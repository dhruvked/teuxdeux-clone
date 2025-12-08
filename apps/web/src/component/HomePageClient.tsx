import { AppShell, AppShellHeader, AppShellMain, Stack, Text } from "@mantine/core";
import React from "react";
import { getTasks } from "@/api/tasks";
import type { Task } from "@/api/types";

export default function HomePageClient() {
	const [tasks, setTasks] = React.useState<Task[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				// wide range: past year to next year
				const start = new Date();
				start.setFullYear(start.getFullYear() - 1);
				const end = new Date();
				end.setFullYear(end.getFullYear() + 1);
				const iso = (d: Date) => d.toISOString().slice(0, 10);
				const data = await getTasks(iso(start), iso(end));
				setTasks(data);
			} catch (err) {
				console.error(err);
				setError("Failed to load tasks");
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, []);

	return (
		<AppShell>
			<AppShellHeader></AppShellHeader>
			<AppShellMain>
				<Stack p="md" gap="xs">
					<Text fw={600}>All Tasks</Text>
					{loading && <Text size="sm">Loading…</Text>}
					{error && (
						<Text size="sm" c="red">
							{error}
						</Text>
					)}
					{!loading &&
						!error &&
						tasks.map((task) => (
							<Text key={task.id} size="sm">
								{task.title} {task.date ? `(${task.date})` : "(Someday)"}
							</Text>
						))}
				</Stack>
			</AppShellMain>
		</AppShell>
	);
}
