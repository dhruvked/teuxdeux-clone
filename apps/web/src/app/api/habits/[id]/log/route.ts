import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

const DEFAULT_USER_ID = "11111111-1111-1111-1111-111111111111";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: habitId } = await params;
		const body = await request.json();
		const { date } = body;

		if (!date) {
			return NextResponse.json({ error: "Date is required" }, { status: 400 });
		}

		// Verify habit belongs to default user
		const existingHabit = await db.query.habits.findFirst({
			where: and(
				eq(schema.habits.id, habitId),
				eq(schema.habits.userId, DEFAULT_USER_ID)
			),
		});

		if (!existingHabit) {
			return NextResponse.json({ error: "Habit not found" }, { status: 404 });
		}

		// Check if log already exists
		const existingLog = await db.query.habitLogs.findFirst({
			where: and(
				eq(schema.habitLogs.habitId, habitId),
				eq(schema.habitLogs.date, date)
			),
		});

		if (existingLog) {
			// If it exists, toggle off by deleting
			await db.delete(schema.habitLogs).where(eq(schema.habitLogs.id, existingLog.id));
			return NextResponse.json({ completed: false, log: null });
		} else {
			// If it does not exist, toggle on by creating
			const [newLog] = await db
				.insert(schema.habitLogs)
				.values({
					habitId,
					date,
					completed: true,
				})
				.returning();
			return NextResponse.json({ completed: true, log: newLog });
		}
	} catch (error: any) {
		console.error("Error toggling habit log:", error);
		return NextResponse.json({ error: error.message || "Failed to toggle habit log" }, { status: 500 });
	}
}
