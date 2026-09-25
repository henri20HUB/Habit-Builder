import { Router, type IRouter } from "express";
import { eq, sql, and, gte, lte, desc, asc, count } from "drizzle-orm";
import { db, habitsTable, completionsTable } from "@workspace/db";
import {
  CreateHabitBody,
  GetHabitParams,
  GetHabitResponse,
  UpdateHabitParams,
  UpdateHabitBody,
  UpdateHabitResponse,
  DeleteHabitParams,
  ToggleArchiveHabitParams,
  ToggleArchiveHabitResponse,
  ListHabitsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/habits", async (_req, res): Promise<void> => {
  const habits = await db
    .select()
    .from(habitsTable)
    .orderBy(asc(habitsTable.sortOrder), desc(habitsTable.createdAt));
  res.json(ListHabitsResponse.parse(habits));
});

router.post("/habits", async (req, res): Promise<void> => {
  const parsed = CreateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${habitsTable.sortOrder}), 0)` })
    .from(habitsTable);

  const [habit] = await db
    .insert(habitsTable)
    .values({ ...parsed.data, sortOrder: (maxOrder[0]?.max ?? 0) + 1 })
    .returning();

  res.status(201).json(GetHabitResponse.parse(habit));
});

router.get("/habits/:id", async (req, res): Promise<void> => {
  const params = GetHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [habit] = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, params.data.id));

  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  res.json(GetHabitResponse.parse(habit));
});

router.patch("/habits/:id", async (req, res): Promise<void> => {
  const params = UpdateHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [habit] = await db
    .update(habitsTable)
    .set(parsed.data)
    .where(eq(habitsTable.id, params.data.id))
    .returning();

  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  res.json(UpdateHabitResponse.parse(habit));
});

router.delete("/habits/:id", async (req, res): Promise<void> => {
  const params = DeleteHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [habit] = await db
    .delete(habitsTable)
    .where(eq(habitsTable.id, params.data.id))
    .returning();

  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/habits/:id/archive", async (req, res): Promise<void> => {
  const params = ToggleArchiveHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  const [habit] = await db
    .update(habitsTable)
    .set({ archived: !existing.archived })
    .where(eq(habitsTable.id, params.data.id))
    .returning();

  res.json(ToggleArchiveHabitResponse.parse(habit));
});

export default router;
