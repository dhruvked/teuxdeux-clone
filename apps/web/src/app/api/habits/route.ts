import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

const DEFAULT_USER_ID = "11111111-1111-1111-1111-111111111111";

async function ensureDefaultUser() {
	const user = await db.query.users.findFirst({
		where: eq(schema.users.id, DEFAULT_USER_ID),
	});
	if (!user) {
		await db.insert(schema.users).values({
			id: DEFAULT_USER_ID,
			email: "demo@local",
			passwordHash: "demo_password",
		});
	}
}

export async function GET(request: Request) {
	try {
		await ensureDefaultUser();

		const { searchParams } = new URL(request.url);
		const year = searchParams.get("year");
		const month = searchParams.get("month");

		if (!year || !month) {
			return NextResponse.json({ error: "Missing year or month query parameter" }, { status: 400 });
		}

		const yearNum = parseInt(year);
		const monthNum = parseInt(month);

		if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
			return NextResponse.json({ error: "Invalid year or month query parameter" }, { status: 400 });
		}

		// Calculate start and end date for filtering logs
		const lastDay = new Date(yearNum, monthNum, 0).getDate();
		const startDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
		const endDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

		// Get all habits for user (active)
		const userHabits = await db.query.habits.findMany({
			where: and(
				eq(schema.habits.userId, DEFAULT_USER_ID),
				eq(schema.habits.archived, false)
			),
			orderBy: [schema.habits.sortOrder, schema.habits.createdAt],
		});

		const habitsList = [...userHabits];

		if (habitsList.length === 0) {
			return NextResponse.json({ habits: [] });
		}

		const habitIds = habitsList.map((h) => h.id);

		// Fetch logs for these habits in the specific date range
		const logs = await db.query.habitLogs.findMany({
			where: and(
				inArray(schema.habitLogs.habitId, habitIds),
				gte(schema.habitLogs.date, startDate),
				lte(schema.habitLogs.date, endDate)
			),
		});

		// Map logs to their respective habits
		const result = habitsList.map((habit) => {
			const habitLogs = logs
				.filter((log) => log.habitId === habit.id)
				.map((log) => ({
					id: log.id,
					date: log.date,
					completed: log.completed,
				}));
			return {
				...habit,
				logs: habitLogs,
			};
		});

		return NextResponse.json({ habits: result });
	} catch (error: any) {
		console.error("Error fetching habits:", error);
		return NextResponse.json({ error: error.message || "Failed to fetch habits" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		await ensureDefaultUser();
		const body = await request.json();
		const { name, color, goalDays } = body;

		if (!name || !color) {
			return NextResponse.json({ error: "Name and color are required" }, { status: 400 });
		}

		const goalDaysNum = goalDays !== undefined ? parseInt(goalDays) : 20;

		// Find the current max sortOrder to append the habit to the end
		const currentHabits = await db.query.habits.findMany({
			where: eq(schema.habits.userId, DEFAULT_USER_ID),
		});
		const maxSortOrder = currentHabits.reduce((max, h) => Math.max(max, h.sortOrder), -1);

		const [newHabit] = await db
			.insert(schema.habits)
			.values({
				userId: DEFAULT_USER_ID,
				name,
				color,
				goalDays: isNaN(goalDaysNum) ? 20 : goalDaysNum,
				sortOrder: maxSortOrder + 1,
				archived: false,
			})
			.returning();

		return NextResponse.json({ habit: { ...newHabit, logs: [] } });
	} catch (error: any) {
		console.error("Error creating habit:", error);
		return NextResponse.json({ error: error.message || "Failed to create habit" }, { status: 500 });
	}
}
