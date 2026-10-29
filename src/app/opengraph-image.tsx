import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "AI Tool Picks: honest AI tool reviews, comparisons and guides";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "#fff",
          background: "linear-gradient(135deg, #05060f 0%, #101640 55%, #2a1466 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#a5b4fc", letterSpacing: 6, textTransform: "uppercase" }}>
          Independent · Free plans first
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, marginTop: 28, lineHeight: 1.05 }}>AI Tool Picks</div>
        <div style={{ display: "flex", fontSize: 40, color: "#c7cee8", marginTop: 28, maxWidth: 900 }}>
          Honest reviews, comparisons and guides to AI tools for freelancers and small businesses.
        </div>
      </div>
    ),
    size,
  );
}
