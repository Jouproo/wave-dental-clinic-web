import { Node, mergeAttributes } from "@tiptap/core";

/**
 * A reusable "medical note" callout block, rendered as
 * <div class="callout-note">…</div>. Toggled via the editor's built-in
 * generic wrapIn/lift commands (no custom command typing needed).
 */
export const CalloutNote = Node.create({
  name: "calloutNote",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "div.callout-note" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "callout-note" }), 0];
  },
});
