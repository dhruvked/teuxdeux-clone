import { Text, Group, Badge } from "@mantine/core";
import type { Task } from "@/types";

type TaskItemProps = {
  task: Task;
};

export function TaskItem({ task }: TaskItemProps) {
  return (
    <Group gap="xs" justify="space-between" align="flex-start">
      <Text
        size="sm"
        c={task.completedAt ? "dimmed" : undefined}
        td={task.completedAt ? "line-through" : undefined}
      >
        {task.title}
      </Text>
      {task.completedAt && (
        <Badge size="xs" variant="light" color="teal">
          done
        </Badge>
      )}
    </Group>
  );
}
