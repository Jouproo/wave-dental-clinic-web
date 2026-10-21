import { renderWaveIcon } from "@/lib/pwa-icon";

export const runtime = "edge";

export async function GET() {
  return renderWaveIcon(512);
}
