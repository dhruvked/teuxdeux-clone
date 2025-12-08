import { request } from "./client";

export async function getHealth(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/health");
}
