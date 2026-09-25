import { pgTable, serial, integer, date, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { habitsTable } from "./habits";

export const completionsTable = pgTable("completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habitsTable.id, { onDelete: "cascade" }),
  completedDate: date("completed_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("unique_habit_date").on(t.habitId, t.completedDate),
]);

export const insertCompletionSchema = createInsertSchema(completionsTable).omit({ id: true, createdAt: true });
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
export type Completion = typeof completionsTable.$inferSelect;
