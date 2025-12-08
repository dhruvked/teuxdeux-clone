export type Task = {
  id: string;
  userId?: string;
  title: string;
  date: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type RecurringRule = {
  id: string;
  userId?: string;
  title: string;
  cadence: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  dayOfMonth: number | null;
  startsOn: string;
  endsOn: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type TasksResponse = { tasks: Task[] };
export type TaskResponse = { task: Task };

export type RecurringRulesResponse = { recurringRules: RecurringRule[] };
export type RecurringRuleResponse = { recurringRule: RecurringRule };
