import { randomUUID } from "crypto";
import { Router } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/index.js";
import { tasks } from "@/db/schema.js";
import { DEFAULT_USER_ID } from "./context.js";
import { parseDateOptional, parseDateRequired } from "./utils.js";

export const tasksRouter: Router = Router();

tasksRouter.get("/", async (req, res) => {
	try {
		const start = req.query.start ? String(req.query.start) : undefined;
		const end = req.query.end ? String(req.query.end) : undefined;

		const conditions = [eq(tasks.userId, DEFAULT_USER_ID)];
		if (start) conditions.push(gte(tasks.date, parseDateRequired(start)));
		if (end) conditions.push(lte(tasks.date, parseDateRequired(end)));

		const where = and(...conditions);

		const data = await db
			.select()
			.from(tasks)
			.where(where)
			.orderBy(tasks.date, tasks.sortOrder, tasks.createdAt);

		res.json({ tasks: data });
	} catch (error) {
		console.error(error);
		res.status(400).json({ error: "Failed to fetch tasks" });
	}
});

tasksRouter.post("/", async (req, res) => {
	try {
		const bodySchema = z.object({
			title: z.string().min(1),
			date: z.string().optional(),
			sortOrder: z.number().optional(),
		});
		const body = bodySchema.parse(req.body);

		const inserted = await db
			.insert(tasks)
			.values({
				id: randomUUID(),
				userId: DEFAULT_USER_ID,
				title: body.title,
				date: parseDateOptional(body.date),
				sortOrder: body.sortOrder ?? 0,
			})
			.returning();

		res.status(201).json({ task: inserted[0] });
	} catch (error) {
		console.error(error);
		res.status(400).json({ error: "Failed to create task" });
	}
});

tasksRouter.patch("/:id", async (req, res) => {
	try {
		const bodySchema = z.object({
			title: z.string().min(1).optional(),
			date: z.string().optional().nullable(),
			completed: z.boolean().optional(),
			sortOrder: z.number().optional(),
		});
		const body = bodySchema.parse(req.body);
		const taskId = req.params.id;

		const updates: Record<string, unknown> = {};
		if (body.title !== undefined) updates.title = body.title;
		if (body.date !== undefined) updates.date = parseDateOptional(body.date);
		if (body.completed !== undefined) updates.completedAt = body.completed ? new Date() : null;
		if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
		updates.updatedAt = new Date();

		const updated = await db
			.update(tasks)
			.set(updates)
			.where(and(eq(tasks.id, taskId), eq(tasks.userId, DEFAULT_USER_ID)))
			.returning();

		if (!updated.length) return res.status(404).json({ error: "Task not found" });

		res.json({ task: updated[0] });
	} catch (error) {
		console.error(error);
		res.status(400).json({ error: "Failed to update task" });
	}
});

tasksRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await db
      .delete(tasks)
      .where(
        and(eq(tasks.id, req.params.id), eq(tasks.userId, DEFAULT_USER_ID))
      )
      .returning();

    if (!deleted.length)
      return res.status(404).json({ error: "Task not found" });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to delete task" });
  }
});
