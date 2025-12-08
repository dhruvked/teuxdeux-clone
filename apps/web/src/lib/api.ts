import type { TaskResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export function weekRange(offsetWeeks = 0) {
	const now = new Date();
	const day = now.getDay();
	const diff = day === 0 ? -6 : 1 - day; // start Monday
	const start = new Date(now);
	start.setDate(now.getDate() + diff + offsetWeeks * 7);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(start.getDate() + 4); // 5 columns (Mon-Fri)
	end.setHours(23, 59, 59, 999);
	return {
		startDate: start,
		endDate: end,
		startISO: toISODate(start),
		endISO: toISODate(end),
	};
}

export async function fetchTasksForRange(startISO: string, endISO: string) {
	const res = await fetch(`${API_BASE}/tasks?start=${startISO}&end=${endISO}`, {
		cache: "no-store",
	});
	if (!res.ok) {
		throw new Error(`Failed to fetch tasks: ${res.status}`);
	}
	const data: TaskResponse = await res.json();
	return data.tasks ?? [];
}
