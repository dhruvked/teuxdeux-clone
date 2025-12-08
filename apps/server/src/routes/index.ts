import { Router } from "express";
import { sql } from "drizzle-orm";

import { db } from "../db/index.js";
import { recurringRouter } from "./recurring.js";
import { tasksRouter } from "./tasks.js";

export const router: Router = Router();

router.get("/", (_req, res) => {
  res.status(200).send("OK");
});

router.get("/health", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.use("/tasks", tasksRouter);
router.use("/recurring", recurringRouter);
