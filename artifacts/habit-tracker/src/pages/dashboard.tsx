import { 
  useGetDashboardStats, 
  useListHabits,
  useListCompletions,
  useToggleCompletion,
  getListCompletionsQueryKey,
  getGetDashboardStatsQueryKey,
  useGetStreaks,
  useGetWeeklyActivity
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import { Check, Flame, Trophy, Target, ArrowRight, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function Dashboard() {
  const today = new Date();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: habits, isLoading: isLoadingHabits } = useListHabits();
  const { data: completions, isLoading: isLoadingCompletions } = useListCompletions({
    startDate: format(today, "yyyy-MM-dd"),
    endDate: format(today, "yyyy-MM-dd"),
  });
  const { data: streaks } = useGetStreaks();
  const { data: weeklyActivity } = useGetWeeklyActivity();

  const toggleCompletion = useToggleCompletion();

  const activeHabits = habits?.filter(h => !h.archived) || [];
  
  // Filter for today's habits based on frequency - simplified for prototype
  const todaysHabits = activeHabits;

  const handleToggle = (habitId: number) => {
    const isCompleted = completions?.some(c => c.habitId === habitId && isSameDay(new Date(c.completedDate), today));
    
    toggleCompletion.mutate(
      { data: { habitId, completedDate: format(today, "yyyy-MM-dd") } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListCompletionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({
            title: res.completed ? "Habit completed!" : "Habit unmarked",
            description: res.completed ? "Great job sticking to your routine." : "Keep going, you can do this.",
          });
        }
      }
    );
  };

  const isLoading = isLoadingStats || isLoadingHabits || isLoadingCompletions;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Today</h1>
        <p className="text-muted-foreground mt-1">{format(today, "EEEE, MMMM do")}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Progress</p>
                  <p className="text-2xl font-bold">{stats.completionsToday} / {activeHabits.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Longest Streak</p>
                  <p className="text-2xl font-bold">{stats.longestStreak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.completionsThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="w-full">
                  <p className="text-sm font-medium text-muted-foreground flex justify-between">
                    <span>Level {stats.currentLevel}</span>
                    <span className="text-xs">{stats.xpToNextLevel} XP to next</span>
                  </p>
                  <Progress value={(stats.totalXp % 1000) / 10} className="h-2 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Routine</h2>
            <Link href="/habits">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Manage <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {todaysHabits.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center p-6">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ListTodo className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No habits for today</p>
                <p className="text-muted-foreground mt-1 mb-4 text-sm max-w-[250px]">
                  Start building your routine by creating a new habit.
                </p>
                <Link href="/habits">
                  <Button>Create Habit</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {todaysHabits.map((habit) => {
                const isCompleted = completions?.some(c => c.habitId === habit.id && isSameDay(new Date(c.completedDate), today));
                const streak = streaks?.find(s => s.habitId === habit.id);
                
                return (
                  <div 
                    key={habit.id}
                    onClick={() => handleToggle(habit.id)}
                    className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-4
                      ${isCompleted 
                        ? "bg-card border-border shadow-sm opacity-60 hover:opacity-100" 
                        : "bg-card border-border shadow-md hover:shadow-lg hover:border-primary/50"
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
                          style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                        >
                          {habit.icon}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {habit.name}
                          </h3>
                          {streak && streak.currentStreak > 0 && (
                            <div className="flex items-center gap-1 text-xs text-orange-500 font-medium mt-0.5">
                              <Flame className="w-3 h-3" /> {streak.currentStreak} day streak
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${isCompleted 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "border-muted-foreground/30 text-transparent"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Weekly Activity</h2>
          <Card>
            <CardContent className="p-6">
              {weeklyActivity && weeklyActivity.length > 0 ? (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivity}>
                      <XAxis 
                        dataKey="dayOfWeek" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                        dy={10}
                      />
                      <Tooltip 
                        cursor={{ fill: 'var(--muted)' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="var(--color-primary)" 
                        radius={[4, 4, 0, 0]} 
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No activity this week yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
