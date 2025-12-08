import { request } from "./client";
import type {
  RecurringRule,
  RecurringRuleResponse,
  RecurringRulesResponse,
} from "./types";

export type CreateRecurringPayload = {
  title: string;
  cadence: "daily" | "weekly" | "monthly";
  daysOfWeek?: number[];
  dayOfMonth?: number;
  startsOn: string;
  endsOn?: string | null;
  isActive?: boolean;
};

export type UpdateRecurringPayload = Partial<CreateRecurringPayload>;

export async function getRecurringRules(): Promise<RecurringRule[]> {
  const data = await request<RecurringRulesResponse>("/recurring");
  return data.recurringRules;
}

export async function createRecurringRule(
  payload: CreateRecurringPayload,
): Promise<RecurringRule> {
  const data = await request<RecurringRuleResponse>("/recurring", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.recurringRule;
}

export async function updateRecurringRule(
  id: string,
  payload: UpdateRecurringPayload,
): Promise<RecurringRule> {
  const data = await request<RecurringRuleResponse>(`/recurring/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.recurringRule;
}

export async function deleteRecurringRule(id: string): Promise<void> {
  await request<void>(`/recurring/${id}`, { method: "DELETE" });
}
