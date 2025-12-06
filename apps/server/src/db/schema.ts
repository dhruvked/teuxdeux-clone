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

export const cadenceEnum = td.enum("cadence", ["daily", "weekly", "monthly"]);

export const users = td.table("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const tasks = td.table("tasks", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	date: date("date"),
	completedAt: timestamp("completed_at", { withTimezone: false }),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: false })
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

export const recurringRules = td.table("recurring_rules", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	cadence: cadenceEnum("cadence").notNull(),
	daysOfWeek: integer("days_of_week").array().default([]),
	dayOfMonth: integer("day_of_month"),
	startsOn: date("starts_on").notNull(),
	endsOn: date("ends_on"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const schema = {
	td,
	cadenceEnum,
	users,
	tasks,
	recurringRules,
};
