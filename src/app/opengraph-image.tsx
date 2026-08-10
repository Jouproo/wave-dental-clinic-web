import { ImageResponse } from "next/og";
import { clinicConfig } from "@/config/clinic";

export const runtime = "edge";
export const alt = clinicConfig.clinicName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 32,
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.35)",
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 36,
          }}
        >
          W
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 16,
          }}
        >
          {clinicConfig.clinicNameEn}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.85)" }}>
          Dental Clinic — 6th of October City, Giza, Egypt
        </div>
      </div>
    ),
    { ...size }
  );
}
