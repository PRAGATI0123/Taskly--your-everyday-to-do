import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The picture shown when someone shares a Taskly link (WhatsApp, LinkedIn,
 * Slack…). Next.js draws it once at build time from the layout below.
 */
export const alt = "Taskly — organize projects on a drag-and-drop Kanban board";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLUMNS = [
  { title: "To Do", cards: ["Write the onboarding guide", "Plan the launch email"] },
  { title: "In Progress", cards: ["Design the pricing page"] },
  { title: "Done", cards: ["Set up the project", "Pick the brand colours"] },
];

// Read once, when the image is built.
const logo = await readFile(join(process.cwd(), "public/logo-dark.png"));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 72px",
          color: "#f3e9df",
          backgroundImage: "linear-gradient(135deg, #16100c 0%, #2c1d14 55%, #5a3a26 100%)",
        }}
      >
        {/* Left: logo, name and tagline */}
        <div style={{ display: "flex", flexDirection: "column", width: 470 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> is required inside ImageResponse */}
          <img src={logoSrc} width={92} height={96} alt="" />
          <div style={{ fontSize: 104, fontWeight: 700, marginTop: 24, color: "#e0b48a" }}>
            Taskly
          </div>
          <div style={{ fontSize: 36, lineHeight: 1.3, marginTop: 12, color: "#d9c7b6" }}>
            Organize projects and move tasks across your Kanban board.
          </div>
        </div>

        {/* Right: a small board picture */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {COLUMNS.map((column) => (
            <div
              key={column.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flex: 1,
                padding: 16,
                borderRadius: 20,
                background: "rgba(255, 245, 235, 0.08)",
                border: "1px solid rgba(255, 245, 235, 0.15)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: "#d9c7b6" }}>{column.title}</div>
              {column.cards.map((card) => (
                <div
                  key={card}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: 14,
                    borderRadius: 14,
                    fontSize: 20,
                    lineHeight: 1.25,
                    background: "#211812",
                    border: "1px solid rgba(255, 245, 235, 0.12)",
                    textDecoration: column.title === "Done" ? "line-through" : "none",
                    color: column.title === "Done" ? "#a8968a" : "#f3e9df",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 6,
                      borderRadius: 3,
                      backgroundImage: "linear-gradient(90deg, #a86b40, #e0b48a)",
                    }}
                  />
                  {card}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
