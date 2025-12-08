import { request } from "./client";
import type { Task, TaskResponse, TasksResponse } from "./types";

export type CreateTaskPayload = {
  title: string;
  date?: string | null;
  sortOrder?: number;
};

export type UpdateTaskPayload = {
  title?: string;
  date?: string | null;
  completed?: boolean;
  sortOrder?: number;
};

export async function getTasks(startISO: string, endISO: string): Promise<Task[]> {
  const data = await request<TasksResponse>(`/tasks?start=${startISO}&end=${endISO}`);
  return data.tasks;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const data = await request<TaskResponse>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.task;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const data = await request<TaskResponse>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.task;
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/tasks/${id}`, { method: "DELETE" });
}
