"use client";

import { createContext, useContext } from "react";
import { DEFAULT_CRM_CONFIG, type CrmConfig } from "@/lib/crm-config";

const Ctx = createContext<CrmConfig>(DEFAULT_CRM_CONFIG);

/** Makes the editable CRM settings (stage labels/colors, sources, archive reasons) available to client components. */
export function CrmConfigProvider({ value, children }: { value: CrmConfig; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCrmConfig = () => useContext(Ctx);
