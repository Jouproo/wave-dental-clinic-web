import { ImageResponse } from "next/og";

/**
 * Renders the "W" badge used across the admin login screen (gradient
 * square + bold white W) as a PNG at the given size — reused for the
 * favicon, apple-touch-icon, and the PWA manifest's install icons so
 * "Add to Home Screen" on /admin gets a consistent brand icon.
 */
export function renderWaveIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1672d6 0%, #55b4fa 100%)",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: size * 0.56,
            fontWeight: 800,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          W
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
