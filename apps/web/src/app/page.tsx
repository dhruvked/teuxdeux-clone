"use client";

import { Container, Stack, Title, Text, Button, Group } from "@mantine/core";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function Home() {
	return (
		<Container size="md" py="xl">
			<Stack gap="md">
				<Title order={2}>TeuxDeux Clone</Title>
				<Text c="dimmed">
					Frontend reset. Mantine is installed—ready to build the week view against your API at{" "}
					<code>{API_URL}</code>.
				</Text>
				<Group>
					<Button component="a" href="http://localhost:3000/health" target="_blank" variant="light">
						Check API health
					</Button>
				</Group>
			</Stack>
		</Container>
	);
}
