import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export const DEFAULT_USER_ID =
  process.env.DEFAULT_USER_ID ?? "11111111-1111-1111-1111-111111111111";
export const DEFAULT_USER_EMAIL =
  process.env.DEFAULT_USER_EMAIL ?? "demo@local";

export async function ensureDefaultUser() {
  await db
    .insert(users)
    .values({
      id: DEFAULT_USER_ID,
      email: DEFAULT_USER_EMAIL,
      passwordHash: randomUUID(), // placeholder; auth will replace
    })
    .onConflictDoNothing();
}
