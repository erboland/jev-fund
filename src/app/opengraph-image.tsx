import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background:
            "linear-gradient(145deg, #F6F1E8 0%, #F0EEE9 48%, #E8E4DC 100%)",
          color: "#0F1F17",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 18,
              background: "#0F1F17",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="56"
              height="40"
              viewBox="0 0 56 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline
                points="4,30 16,22 26,26 38,10 52,18"
                stroke="#2FBF71"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  letterSpacing: -2,
                  lineHeight: 1,
                }}
              >
                {SITE.name}
              </div>
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid #D8D2C8",
                  background: "#FFFDF8",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 2.4,
                  color: "#6B7A70",
                }}
              >
                PAPER
              </div>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#3D4A42",
                maxWidth: 760,
                lineHeight: 1.25,
              }}
            >
              {SITE.tagline}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            padding: "28px 32px",
            borderRadius: 24,
            border: "1px solid #E8E0D4",
            background: "rgba(255, 252, 247, 0.92)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", gap: 36 }}>
              {[
                { label: "NAV", value: "$100,000", tone: "#0F1F17" },
                { label: "DATA", value: "YAHOO", tone: "#1F7A4C" },
                { label: "MODEL", value: "JEV / MOCK", tone: "#4C3EBB" },
                { label: "LOSSES", value: "PUBLIC", tone: "#C23B2A" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: 1.6,
                      color: "#8A8A8A",
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: stat.tone,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <svg
              width="360"
              height="96"
              viewBox="0 0 360 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="0"
                y1="48"
                x2="360"
                y2="48"
                stroke="#E6E0D6"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <polyline
                points="0,72 48,64 96,68 144,42 192,34 240,28 288,36 336,24 360,30"
                stroke="#2FBF71"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              color: "#5C675F",
              maxWidth: 920,
            }}
          >
            {SITE.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            fontWeight: 600,
            color: "#6B7A70",
          }}
        >
          <div>OPEN SOURCE · MIT</div>
          <div>{SITE.githubRepoUrl.replace("https://", "")}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
