const SESSION_KEY = "jev-fund-viewed";
const VISITOR_KEY = "jev-fund-visitor";

function viewsOrigin() {
  const configured = process.env.NEXT_PUBLIC_VIEWS_ORIGIN?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function viewerId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export async function recordSiteOpen(): Promise<void> {
  const origin = viewsOrigin();
  if (!origin) return;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
  } catch {
    // Private mode: still try to record once per page load.
  }

  try {
    const res = await fetch(`${origin}/api/views`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: viewerId() }),
    });
    if (!res.ok) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore storage failures after a successful POST.
    }
  } catch {
    // Best-effort analytics only.
  }
}
