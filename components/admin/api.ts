export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const body = await response
    .json()
    .catch(() => ({ error: "The server is unavailable. Please try again." }));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("terra-session-expired"));
    throw new Error(body.error || "Request failed.");
  }
  return body;
}
