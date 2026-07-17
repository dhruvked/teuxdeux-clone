import {
	pgSchema,
	uuid,
	text,
	integer,
	timestamp,
	date,
	boolean,
} from "drizzle-orm/pg-core";

const td = pgSchema("TD_TODO");

export const users = td.table("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const habits = td.table("habits", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	color: text("color").notNull(), // theme name e.g. "emerald", "violet", "indigo", "rose", "sunset"
	goalDays: integer("goal_days").default(20).notNull(), // Target monthly goal
	sortOrder: integer("sort_order").default(0).notNull(),
	archived: boolean("archived").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const habitLogs = td.table("habit_logs", {
	id: uuid("id").defaultRandom().primaryKey(),
	habitId: uuid("habit_id")
		.notNull()
		.references(() => habits.id, { onDelete: "cascade" }),
	date: date("date").notNull(), // ISO YYYY-MM-DD
	completed: boolean("completed").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});
