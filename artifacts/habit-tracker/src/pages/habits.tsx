import { 
  useListHabits, 
  useCreateHabit, 
  useUpdateHabit, 
  useDeleteHabit, 
  useToggleArchiveHabit,
  getListHabitsQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MoreVertical, Archive, ArchiveRestore, Trash2, Edit2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { HabitForm } from "@/components/habit-form";
import type { Habit } from "@workspace/api-client-react";

export default function Habits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: habits, isLoading } = useListHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const toggleArchive = useToggleArchiveHabit();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const activeHabits = habits?.filter(h => !h.archived) || [];
  const archivedHabits = habits?.filter(h => h.archived) || [];

  const handleToggleArchive = (id: number, currentArchived: boolean) => {
    toggleArchive.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({
          title: currentArchived ? "Habit unarchived" : "Habit archived",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this habit? All history will be lost.")) {
      deleteHabit.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({
            title: "Habit deleted",
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  const HabitList = ({ items }: { items: Habit[] }) => (
    <div className="space-y-4">
      {items.map(habit => (
        <Card key={habit.id} className={`overflow-hidden ${habit.archived ? "opacity-60" : ""}`}>
          <CardContent className="p-0 flex items-stretch">
            <div 
              className="w-2"
              style={{ backgroundColor: habit.color }}
            />
            <div className="p-4 flex-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl p-2 bg-muted rounded-lg">
                  {habit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{habit.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize font-normal">
                      {habit.frequency}
                    </Badge>
                    {habit.description && (
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingHabit(habit)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleArchive(habit.id, habit.archived)}>
                    {habit.archived ? (
                      <><ArchiveRestore className="w-4 h-4 mr-2" /> Unarchive</>
                    ) : (
                      <><Archive className="w-4 h-4 mr-2" /> Archive</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:bg-destructive/10"
                    onClick={() => handleDelete(habit.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Habits</h1>
          <p className="text-muted-foreground mt-1">Create and organize your routines.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-5 h-5 mr-2" /> New Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <HabitForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {activeHabits.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Active Habits</h2>
            <HabitList items={activeHabits} />
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <h3 className="text-lg font-medium text-foreground">No active habits</h3>
            <p className="text-muted-foreground mt-1 mb-4">Start by creating your first habit to track.</p>
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create Habit</Button>
          </div>
        )}

        {archivedHabits.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Archived</h2>
            <HabitList items={archivedHabits} />
          </div>
        )}
      </div>

      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          {editingHabit && (
            <HabitForm 
              habit={editingHabit} 
              onSuccess={() => setEditingHabit(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
