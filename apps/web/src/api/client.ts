const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Request failed (${res.status}): ${msg}`);
  }

  return (await res.json()) as T;
}

export { API_BASE, request };
