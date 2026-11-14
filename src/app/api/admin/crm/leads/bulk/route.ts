import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { parseLeadFilter, collectLeadIds, filterIdsToScope } from "@/lib/crm-leads";
import { STAGE_LABELS, LOSS_REASON_OPTIONS, ARCHIVE_REASON_OPTIONS } from "@/lib/crm-labels";

const CHUNK = 150;
const MAX_IDS = 10000;

type BulkAction = "archive" | "restore" | "assign" | "stage";

/**
 * Bulk operations on leads. The target is either an explicit `ids` list
 * (rows ticked in the table) or a `filter` (the "select all N matching"
 * banner) — in both cases resolved server-side through the session's scope,
 * so a client can never reach rows it couldn't see in the list.
 *
 * Body: { action, ids?, filter?, reason?, reason_other?, assignees?, stage?, loss_reason?, loss_reason_other? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.read")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const action = body.action as BulkAction;

  const requiredPermission = {
    archive: "crm.archive", restore: "crm.archive", assign: "crm.assign", stage: "crm.update",
  } as const;
  if (!(action in requiredPermission)) {
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
  if (!sessionHasPermission(session, requiredPermission[action])) {
    return NextResponse.json({ error: "لا تملك صلاحية تنفيذ هذا الإجراء" }, { status: 403 });
  }

  // ---- Resolve target ids (always scope-checked) ----
  let ids: string[];
  try {
    if (Array.isArray(body.ids)) {
      const raw = body.ids.filter((x: unknown): x is string => typeof x === "string").slice(0, MAX_IDS);
      ids = await filterIdsToScope(session, raw);
    } else if (body.filter && typeof body.filter === "object") {
      ids = await collectLeadIds(session, parseLeadFilter(body.filter), MAX_IDS);
    } else {
      return NextResponse.json({ error: "لم يتم تحديد العملاء" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "فشل تحديد العملاء" }, { status: 500 });
  }
  if (ids.length === 0) return NextResponse.json({ affected: 0 });

  const supabase = supabaseServer();
  const now = new Date().toISOString();
  const actor = session.userId || null;
  let affected = 0;

  /** Runs one update per chunk; retries without archive metadata columns if the archive migration hasn't been run yet. */
  async function updateChunks(patch: Record<string, unknown>, fallbackPatch?: Record<string, unknown>) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      let { error } = await supabase.from("leads").update(patch).in("id", chunk);
      if (error && fallbackPatch && /archive_reason|archived_by/.test(error.message)) {
        ({ error } = await supabase.from("leads").update(fallbackPatch).in("id", chunk));
      }
      if (error) throw new Error(error.message);
      affected += chunk.length;
    }
  }

  try {
    if (action === "archive") {
      const reason = typeof body.reason === "string" && ARCHIVE_REASON_OPTIONS.includes(body.reason) ? body.reason : null;
      if (!reason) return NextResponse.json({ error: "اختر سبب الأرشفة" }, { status: 400 });
      const other = typeof body.reason_other === "string" ? body.reason_other.trim() : "";
      if (reason === "أخرى" && !other) return NextResponse.json({ error: "اكتب سبب الأرشفة" }, { status: 400 });
      const archiveReason = reason === "أخرى" ? `أخرى: ${other}` : reason;
      await updateChunks(
        { archived_at: now, archived_by: actor, archive_reason: archiveReason, updated_by: actor },
        { archived_at: now, updated_by: actor }
      );
    }

    if (action === "restore") {
      await updateChunks(
        { archived_at: null, archived_by: null, archive_reason: null, updated_by: actor },
        { archived_at: null, updated_by: actor }
      );
    }

    if (action === "assign") {
      // Round-robin across the chosen assignees (a re-engagement campaign is
      // usually split evenly between agents). An empty list = unassign.
      const assignees: string[] = Array.isArray(body.assignees)
        ? body.assignees.filter((x: unknown): x is string => typeof x === "string" && x.length > 0)
        : [];
      if (assignees.length > 0) {
        const { data: valid } = await supabase.from("admin_users").select("id").in("id", assignees).eq("status", "active");
        const validSet = new Set((valid ?? []).map((u: { id: string }) => u.id));
        if (assignees.some((a) => !validSet.has(a))) {
          return NextResponse.json({ error: "أحد الموظفين المختارين غير موجود أو غير نشط" }, { status: 400 });
        }
      }
      if (assignees.length <= 1) {
        await updateChunks({ assigned_to: assignees[0] ?? null, updated_by: actor });
      } else {
        const buckets = new Map<string, string[]>(assignees.map((a) => [a, []]));
        ids.forEach((id, i) => buckets.get(assignees[i % assignees.length])!.push(id));
        for (const [assignee, bucketIds] of buckets) {
          for (let i = 0; i < bucketIds.length; i += CHUNK) {
            const chunk = bucketIds.slice(i, i + CHUNK);
            const { error } = await supabase.from("leads").update({ assigned_to: assignee, updated_by: actor }).in("id", chunk);
            if (error) throw new Error(error.message);
            affected += chunk.length;
          }
        }
      }
    }

    if (action === "stage") {
      const stage = body.stage as string;
      if (!(stage in STAGE_LABELS)) return NextResponse.json({ error: "مرحلة غير معروفة" }, { status: 400 });
      const patch: Record<string, unknown> = { stage, updated_by: actor };
      if (stage === "lost") {
        if (!LOSS_REASON_OPTIONS.includes(body.loss_reason)) {
          return NextResponse.json({ error: "سبب الخسارة مطلوب عند تحويل العملاء إلى خسارة" }, { status: 400 });
        }
        if (body.loss_reason === "أخرى" && !String(body.loss_reason_other ?? "").trim()) {
          return NextResponse.json({ error: "اكتب توضيحًا لسبب الخسارة" }, { status: 400 });
        }
        patch.loss_reason = body.loss_reason;
        patch.loss_reason_other = body.loss_reason_other || null;
      }

      // Only leads actually changing stage get a history row.
      const changing: { id: string; stage: string }[] = [];
      for (let i = 0; i < ids.length; i += CHUNK) {
        const { data } = await supabase.from("leads").select("id, stage").in("id", ids.slice(i, i + CHUNK)).neq("stage", stage);
        changing.push(...(data ?? []));
      }
      await updateChunks(patch);
      for (let i = 0; i < changing.length; i += 500) {
        await supabase.from("lead_stage_history").insert(
          changing.slice(i, i + 500).map((l) => ({
            lead_id: l.id, from_stage: l.stage, to_stage: stage, changed_by: actor, reason: "تعديل جماعي",
          }))
        );
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل التنفيذ", affected },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    actor_id: actor,
    action: `leads.bulk_${action}`,
    entity_type: "lead",
    entity_id: null,
    after: {
      count: affected,
      reason: body.reason ?? null,
      stage: body.stage ?? null,
      assignees: body.assignees ?? null,
      filter: body.filter ?? null,
      ids: ids.length <= 200 ? ids : undefined,
    },
  });

  return NextResponse.json({ affected });
}
