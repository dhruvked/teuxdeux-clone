export type Task = {
	id: string;
	title: string;
	date: string | null;
	completedAt: string | null;
	sortOrder: number;
};

export type TaskResponse = {
	tasks: Task[];
};
