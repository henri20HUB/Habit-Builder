import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, completionsTable } from "@workspace/db";
import {
  ListCompletionsQueryParams,
  ListCompletionsResponse,
  ToggleCompletionBody,
  ToggleCompletionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toSqlDate = (date: Date) => date.toISOString().slice(0, 10);

router.get("/completions", async (req, res): Promise<void> => {
  const params = ListCompletionsQueryParams.safeParse({
    ...req.query,
    startDate: new Date(String(req.query.startDate)),
    endDate: new Date(String(req.query.endDate)),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [
    gte(completionsTable.completedDate, toSqlDate(params.data.startDate)),
    lte(completionsTable.completedDate, toSqlDate(params.data.endDate)),
  ];

  if (params.data.habitId != null) {
    conditions.push(eq(completionsTable.habitId, params.data.habitId));
  }

  const completions = await db
    .select()
    .from(completionsTable)
    .where(and(...conditions));

  res.json(ListCompletionsResponse.parse(completions));
});

router.post("/completions", async (req, res): Promise<void> => {
  const parsed = ToggleCompletionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(completionsTable)
    .where(
      and(
        eq(completionsTable.habitId, parsed.data.habitId),
        eq(completionsTable.completedDate, toSqlDate(parsed.data.completedDate))
      )
    );

  if (existing) {
    await db
      .delete(completionsTable)
      .where(eq(completionsTable.id, existing.id));

    res.json(ToggleCompletionResponse.parse({ completed: false }));
    return;
  }

  const [completion] = await db
    .insert(completionsTable)
    .values({
      habitId: parsed.data.habitId,
      completedDate: toSqlDate(parsed.data.completedDate),
    })
    .returning();

  res.json(
    ToggleCompletionResponse.parse({ completed: true, completion })
  );
});

export default router;
