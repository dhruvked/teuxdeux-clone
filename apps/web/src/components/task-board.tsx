import { useEffect, useMemo, useState } from "react";
import { Alert, Group, Loader, Title } from "@mantine/core";
import { fetchTasksForRange, weekRange } from "@/lib/api";
import type { Task } from "@/types";
import { TaskColumn } from "./task-column";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function TaskBoard() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { startDate, endDate, startISO, endISO } = useMemo(() => weekRange(0), []);

	const days = useMemo(() => {
		return Array.from({ length: 5 }).map((_, idx) => {
			const d = new Date(startDate);
			d.setDate(startDate.getDate() + idx);
			return d;
		});
	}, [startDate]);

	useEffect(() => {
		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const fetched = await fetchTasksForRange(startISO, endISO);
				setTasks(fetched);
			} catch (err) {
				console.error(err);
				setError("Failed to load tasks");
			} finally {
				setLoading(false);
			}
		};
		run();
	}, [startISO, endISO]);

	const tasksByDate = useMemo(() => {
		const map: Record<string, Task[]> = {};
		for (const t of tasks) {
			if (!t.date) continue;
			if (!map[t.date]) map[t.date] = [];
			map[t.date].push(t);
		}
		Object.values(map).forEach((list) => {
			list.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
		});
		return map;
	}, [tasks]);

	return (
		<div className="space-y-4">
			<Group justify="space-between" align="center">
				<div>
					<Title order={4}>Week</Title>
					<div className="text-sm text-slate-500">
						{startISO} – {endISO}
					</div>
				</div>
			</Group>

			{error && (
				<Alert color="red" title="Error">
					{error}
				</Alert>
			)}
			{loading && (
				<Group gap="xs">
					<Loader size="sm" />
					<span className="text-sm text-slate-500">Loading tasks…</span>
				</Group>
			)}

			<div className="overflow-x-auto">
				<div className="flex min-w-[900px] gap-3">
					{days.map((day, idx) => {
						const iso = day.toISOString().slice(0, 10);
						return (
							<div key={iso} className="min-w-[260px] flex-1">
								<TaskColumn title={dayNames[idx]} dateLabel={iso} tasks={tasksByDate[iso] ?? []} />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
