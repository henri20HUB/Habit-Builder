import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateHabit, useUpdateHabit, getListHabitsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Habit } from "@workspace/api-client-react";

const ICONS = ["📚", "🏃‍♂️", "💧", "🧘‍♀️", "💻", "🎨", "💊", "🥗", "✍️", "🎸", "🎧", "🧹", "🧹", "🧠"];
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().optional(),
  icon: z.string().min(1),
  color: z.string().min(1),
  frequency: z.enum(["daily", "weekdays", "weekends", "custom"]),
});

type FormValues = z.infer<typeof formSchema>;

interface HabitFormProps {
  habit?: Habit;
  onSuccess: () => void;
}

export function HabitForm({ habit, onSuccess }: HabitFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: habit?.name || "",
      description: habit?.description || "",
      icon: habit?.icon || ICONS[0],
      color: habit?.color || COLORS[0],
      frequency: habit?.frequency || "daily",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (habit) {
      updateHabit.mutate(
        { id: habit.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
            toast({ title: "Habit updated successfully" });
            onSuccess();
          },
        }
      );
    } else {
      createHabit.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
            toast({ title: "Habit created successfully" });
            onSuccess();
          },
        }
      );
    }
  };

  const isLoading = createHabit.isPending || updateHabit.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Read 10 pages" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Focus on non-fiction books" 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => field.onChange(icon)}
                        className={`w-10 h-10 rounded-md text-xl flex items-center justify-center transition-all ${
                          field.value === icon 
                            ? "bg-primary text-primary-foreground scale-110 shadow-md" 
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          field.value === color 
                            ? "scale-125 ring-2 ring-offset-2 ring-primary shadow-sm" 
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="weekends">Weekends</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : habit ? "Save Changes" : "Create Habit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
