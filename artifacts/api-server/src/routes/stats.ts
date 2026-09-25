import { Router, type IRouter } from "express";
import { eq, sql, and, gte, desc, count } from "drizzle-orm";
import { db, habitsTable, completionsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetStreaksResponse,
  GetWeeklyActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function calculateLevel(totalXp: number): { currentLevel: number; xpToNextLevel: number } {
  let level = 1;
  let xpNeeded = 100;
  let remainingXp = totalXp;

  while (remainingXp >= xpNeeded) {
    remainingXp -= xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  }

  return { currentLevel: level, xpToNextLevel: xpNeeded - remainingXp };
}

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0]!;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;

  const allHabits = await db.select().from(habitsTable);
  const totalHabits = allHabits.length;
  const activeHabits = allHabits.filter((h) => !h.archived).length;

  const todayCompletions = await db
    .select({ cnt: count() })
    .from(completionsTable)
    .where(eq(completionsTable.completedDate, today));

  const weekCompletions = await db
    .select({ cnt: count() })
    .from(completionsTable)
    .where(gte(completionsTable.completedDate, weekAgo));

  const totalCompletions = await db
    .select({ cnt: count() })
    .from(completionsTable);

  const totalXp = (totalCompletions[0]?.cnt ?? 0) * 10;
  const { currentLevel, xpToNextLevel } = calculateLevel(totalXp);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const recentCompletions = await db
    .select({ cnt: count() })
    .from(completionsTable)
    .where(gte(completionsTable.completedDate, thirtyDaysAgo));

  const possibleCompletions = activeHabits * 30;
  const overallCompletionRate = possibleCompletions > 0
    ? Math.round(((recentCompletions[0]?.cnt ?? 0) / possibleCompletions) * 100) / 100
    : 0;

  const allCompletionDates = await db
    .select({ completedDate: completionsTable.completedDate })
    .from(completionsTable)
    .orderBy(desc(completionsTable.completedDate));

  let longestStreak = 0;
  if (allCompletionDates.length > 0) {
    const uniqueDates = [...new Set(allCompletionDates.map((c) => c.completedDate))].sort().reverse();
    let currentStreak = 1;
    let best = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]!);
      const curr = new Date(uniqueDates[i]!);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        currentStreak++;
        best = Math.max(best, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    longestStreak = best;
  }

  const stats = {
    totalHabits,
    activeHabits,
    completionsToday: todayCompletions[0]?.cnt ?? 0,
    completionsThisWeek: weekCompletions[0]?.cnt ?? 0,
    overallCompletionRate,
    currentLevel,
    totalXp,
    xpToNextLevel,
    longestStreak,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/stats/streaks", async (_req, res): Promise<void> => {
  const habits = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.archived, false));

  const streaks = [];

  for (const habit of habits) {
    const completions = await db
      .select({ completedDate: completionsTable.completedDate })
      .from(completionsTable)
      .where(eq(completionsTable.habitId, habit.id))
      .orderBy(desc(completionsTable.completedDate));

    let currentStreak = 0;
    let bestStreak = 0;

    if (completions.length > 0) {
      const dates = completions.map((c) => c.completedDate).sort().reverse();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstDate = new Date(dates[0]!);
      firstDate.setHours(0, 0, 0, 0);

      const diffFromToday = Math.round(
        (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffFromToday <= 1) {
        currentStreak = 1;
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1]!);
          const curr = new Date(dates[i]!);
          const diff = Math.round(
            (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      let tempStreak = 1;
      bestStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]!);
        const curr = new Date(dates[i]!);
        const diff = Math.round(
          (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 1) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
    }

    streaks.push({
      habitId: habit.id,
      habitName: habit.name,
      habitColor: habit.color,
      habitIcon: habit.icon,
      currentStreak,
      bestStreak,
    });
  }

  res.json(GetStreaksResponse.parse(streaks));
});

router.get("/stats/weekly-activity", async (_req, res): Promise<void> => {
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;

  const activity = await db
    .select({
      dayOfWeek: sql<string>`to_char(${completionsTable.completedDate}::date, 'Dy')`,
      count: count(),
    })
    .from(completionsTable)
    .where(gte(completionsTable.completedDate, fourWeeksAgo))
    .groupBy(
      sql`to_char(${completionsTable.completedDate}::date, 'Dy')`,
      sql`extract(dow from ${completionsTable.completedDate}::date)`
    )
    .orderBy(sql`extract(dow from ${completionsTable.completedDate}::date)`);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activityMap = new Map(activity.map((a) => [a.dayOfWeek, a.count]));
  const result = dayNames.map((day) => ({
    dayOfWeek: day,
    count: activityMap.get(day) ?? 0,
  }));

  res.json(GetWeeklyActivityResponse.parse(result));
});

export default router;
