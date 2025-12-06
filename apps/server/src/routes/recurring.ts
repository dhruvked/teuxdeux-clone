import { randomUUID } from "crypto";
import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/index.js";
import { recurringRules } from "@/db/schema.js";
import { DEFAULT_USER_ID } from "./context.js";
import { parseDateOptional, parseDateRequired } from "./utils.js";

export const recurringRouter: Router = Router();

recurringRouter.get("/", async (_req, res) => {
  try {
    const data = await db
      .select()
      .from(recurringRules)
      .where(eq(recurringRules.userId, DEFAULT_USER_ID))
      .orderBy(recurringRules.startsOn);

    res.json({ recurringRules: data });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to fetch recurring rules" });
  }
});

recurringRouter.post("/", async (req, res) => {
  try {
		const bodySchema = z.object({
			title: z.string().min(1),
			cadence: z.enum(["daily", "weekly", "monthly"]),
			daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
			dayOfMonth: z.number().int().min(1).max(31).optional(),
			startsOn: z.string(),
			endsOn: z.string().optional(),
			isActive: z.boolean().optional(),
		});
		const body = bodySchema.parse(req.body);

		const inserted = await db
			.insert(recurringRules)
			.values({
				id: randomUUID(),
				userId: DEFAULT_USER_ID,
				title: body.title,
				cadence: body.cadence,
				daysOfWeek: body.daysOfWeek ?? [],
				dayOfMonth: body.dayOfMonth,
				startsOn: parseDateRequired(body.startsOn),
				endsOn: parseDateOptional(body.endsOn),
				isActive: body.isActive ?? true,
			})
			.returning();

    res.status(201).json({ recurringRule: inserted[0] });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create recurring rule" });
  }
});

recurringRouter.patch("/:id", async (req, res) => {
  try {
		const bodySchema = z.object({
			title: z.string().min(1).optional(),
			cadence: z.enum(["daily", "weekly", "monthly"]).optional(),
			daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
			dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
			startsOn: z.string().optional(),
			endsOn: z.string().optional().nullable(),
			isActive: z.boolean().optional(),
		});
    const body = bodySchema.parse(req.body);
    const ruleId = req.params.id;

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.cadence !== undefined) updates.cadence = body.cadence;
    if (body.daysOfWeek !== undefined) updates.daysOfWeek = body.daysOfWeek;
    if (body.dayOfMonth !== undefined) updates.dayOfMonth = body.dayOfMonth;
    if (body.startsOn !== undefined) updates.startsOn = parseDateRequired(body.startsOn);
    if (body.endsOn !== undefined) updates.endsOn = parseDateOptional(body.endsOn);
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const updated = await db
      .update(recurringRules)
      .set(updates)
      .where(
        and(
          eq(recurringRules.id, ruleId),
          eq(recurringRules.userId, DEFAULT_USER_ID)
        )
      )
      .returning();

    if (!updated.length)
      return res.status(404).json({ error: "Recurring rule not found" });

    res.json({ recurringRule: updated[0] });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to update recurring rule" });
  }
});

recurringRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await db
      .delete(recurringRules)
      .where(
        and(
          eq(recurringRules.id, req.params.id),
          eq(recurringRules.userId, DEFAULT_USER_ID)
        )
      )
      .returning();

    if (!deleted.length)
      return res.status(404).json({ error: "Recurring rule not found" });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to delete recurring rule" });
  }
});
