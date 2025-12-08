"use client";

import { Container, Stack, Title } from "@mantine/core";
import { TaskBoard } from "@/components/task-board";

export default function Home() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <TaskBoard />
      </Stack>
    </Container>
  );
}
