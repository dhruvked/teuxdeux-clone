import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

const DEFAULT_USER_ID = "11111111-1111-1111-1111-111111111111";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { name, color, goalDays, sortOrder, archived } = body;

		// Verify habit belongs to default user
		const existingHabit = await db.query.habits.findFirst({
			where: and(
				eq(schema.habits.id, id),
				eq(schema.habits.userId, DEFAULT_USER_ID)
			),
		});

		if (!existingHabit) {
			return NextResponse.json({ error: "Habit not found" }, { status: 404 });
		}

		const updateData: Partial<typeof schema.habits.$inferInsert> = {};

		if (name !== undefined) updateData.name = name;
		if (color !== undefined) updateData.color = color;
		if (goalDays !== undefined) {
			const num = parseInt(goalDays);
			updateData.goalDays = isNaN(num) ? existingHabit.goalDays : num;
		}
		if (sortOrder !== undefined) {
			const num = parseInt(sortOrder);
			updateData.sortOrder = isNaN(num) ? existingHabit.sortOrder : num;
		}
		if (archived !== undefined) updateData.archived = archived;

		const [updatedHabit] = await db
			.update(schema.habits)
			.set(updateData)
			.where(eq(schema.habits.id, id))
			.returning();

		return NextResponse.json({ habit: updatedHabit });
	} catch (error: any) {
		console.error("Error updating habit:", error);
		return NextResponse.json({ error: error.message || "Failed to update habit" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		// Verify habit belongs to default user
		const existingHabit = await db.query.habits.findFirst({
			where: and(
				eq(schema.habits.id, id),
				eq(schema.habits.userId, DEFAULT_USER_ID)
			),
		});

		if (!existingHabit) {
			return NextResponse.json({ error: "Habit not found" }, { status: 404 });
		}

		await db.delete(schema.habits).where(eq(schema.habits.id, id));

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Error deleting habit:", error);
		return NextResponse.json({ error: error.message || "Failed to delete habit" }, { status: 500 });
	}
}
