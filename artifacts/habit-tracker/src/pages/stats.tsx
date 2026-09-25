import { useGetDashboardStats, useGetStreaks, useGetWeeklyActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Flame, Activity, Target } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line, CartesianGrid, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: streaks, isLoading: isLoadingStreaks } = useGetStreaks();
  const { data: weeklyActivity, isLoading: isLoadingActivity } = useGetWeeklyActivity();

  const isLoading = isLoadingStats || isLoadingStreaks || isLoadingActivity;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  const sortedStreaks = streaks ? [...streaks].sort((a, b) => b.currentStreak - a.currentStreak) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-1">Analyze your progress and consistency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Overall Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-8 border-muted">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    className="text-primary"
                    strokeDasharray="552.9"
                    strokeDashoffset={552.9 - (552.9 * (stats?.overallCompletionRate || 0)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-4xl font-bold">{Math.round(stats?.overallCompletionRate || 0)}%</span>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 w-full mt-8 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats?.totalHabits}</p>
                  <p className="text-sm text-muted-foreground">Total Habits</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.currentLevel}</p>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streaks Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> Streaks Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedStreaks.length > 0 ? (
                sortedStreaks.slice(0, 5).map((streak, i) => (
                  <div key={streak.habitId} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-muted-foreground w-4">{i + 1}</div>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${streak.habitColor}20`, color: streak.habitColor }}
                      >
                        {streak.habitIcon}
                      </div>
                      <div>
                        <p className="font-medium">{streak.habitName}</p>
                        <p className="text-xs text-muted-foreground">Best: {streak.bestStreak}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-bold text-lg">
                        <Flame className="w-4 h-4 text-orange-500" /> {streak.currentStreak}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No streaks established yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity Line Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Weekly Consistency
            </CardTitle>
            <CardDescription>Number of completions over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {weeklyActivity && weeklyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="dayOfWeek" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ stroke: 'var(--border)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="var(--color-primary)" 
                      strokeWidth={4}
                      dot={{ r: 6, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--background)' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Not enough data to display weekly chart.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
