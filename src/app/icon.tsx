import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          borderRadius: 8,
        }}
      >
        <span
          style={{
            color: "#4ade80",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            marginTop: -2,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size },
  );
}
