import { Card, CardSection, Stack, Text } from "@mantine/core";
import type { Task } from "@/types";
import { TaskItem } from "./task-item";

type TaskColumnProps = {
  title: string;
  dateLabel: string;
  tasks: Task[];
};

export function TaskColumn({ title, dateLabel, tasks }: TaskColumnProps) {
  return (
    <Card withBorder radius="md" padding="md" className="flex flex-col gap-sm">
      <CardSection inheritPadding>
        <Text fw={600} size="sm">
          {title}{" "}
          <Text span c="dimmed" size="xs">
            ({dateLabel})
          </Text>
        </Text>
      </CardSection>
      <Stack gap="xs">
        {tasks.length === 0 ? (
          <Text size="xs" c="dimmed">
            No tasks
          </Text>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </Stack>
    </Card>
  );
}
