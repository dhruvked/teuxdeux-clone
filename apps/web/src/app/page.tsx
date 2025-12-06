"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  date: string | null;
  completedAt: string | null;
  sortOrder: number;
};

type RecurringRule = {
  id: string;
  title: string;
  cadence: "daily" | "weekly" | "monthly";
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  startsOn: string;
  endsOn: string | null;
  isActive: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

function startOfWeek(date = new Date()) {
  const day = date.getDay(); // 0-6
  const diff = day === 0 ? -6 : 1 - day; // start Monday
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [recurringForm, setRecurringForm] = useState({
    title: "",
    cadence: "daily" as RecurringRule["cadence"],
    startsOn: toISODate(new Date()),
  });

  const weekStart = useMemo(() => {
    const start = startOfWeek();
    const d = new Date(start);
    d.setDate(start.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      return d;
    });
  }, [weekStart]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = toISODate(days[0]);
        const end = toISODate(days[6]);
        const [tasksRes, recurringRes] = await Promise.all([
          fetch(`${API_BASE}/tasks?start=${start}&end=${end}`).then((r) =>
            r.json()
          ),
          fetch(`${API_BASE}/recurring`).then((r) => r.json()),
        ]);
        setTasks(tasksRes.tasks ?? []);
        setRecurring(recurringRes.recurringRules ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [weekStart, days]);

  const handleAddTask = async (date: string | null) => {
    const key = date ?? "someday";
    const title = newTaskTitle[key]?.trim();
    if (!title) return;
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date: date ?? undefined }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const data = await res.json();
      setTasks((prev) => [...prev, data.task]);
      setNewTaskTitle((prev) => ({ ...prev, [key]: "" }));
    } catch (err) {
      console.error(err);
      setError("Could not add task");
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completedAt }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
    } catch (err) {
      console.error(err);
      setError("Could not update task");
    }
  };

  const handleAddRecurring = async () => {
    if (!recurringForm.title.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recurringForm.title,
          cadence: recurringForm.cadence,
          startsOn: recurringForm.startsOn,
        }),
      });
      if (!res.ok) throw new Error("Failed to create rule");
      const data = await res.json();
      setRecurring((prev) => [...prev, data.recurringRule]);
      setRecurringForm((prev) => ({ ...prev, title: "" }));
    } catch (err) {
      console.error(err);
      setError("Could not add recurring rule");
    }
  };

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      const key = t.date ?? "someday";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    Object.values(map).forEach((list) =>
      list.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
      )
    );
    return map;
  }, [tasks]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">TeuxDeux Clone</h1>
          <p className="text-sm text-muted-foreground">
            Week view + Someday, wired to your API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setWeekOffset((v) => v - 1)}>
            ← Prev
          </Button>
          <Button variant="outline" onClick={() => setWeekOffset(0)}>
            This Week
          </Button>
          <Button variant="outline" onClick={() => setWeekOffset((v) => v + 1)}>
            Next →
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
        {days.map((day) => {
          const dateKey = toISODate(day);
          const list = tasksByDate[dateKey] ?? [];
          return (
            <Card key={dateKey} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base flex justify-between">
                  <span>
                    {dayNames[day.getDay()]}{" "}
                    <span className="text-muted-foreground text-sm">
                      {dateKey}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                <div className="space-y-2">
                  {list.map((task) => (
                    <label
                      key={task.id}
                      className={cn(
                        "flex items-start gap-2 text-sm",
                        task.completedAt && "line-through text-muted-foreground"
                      )}
                    >
                      <Checkbox
                        checked={Boolean(task.completedAt)}
                        onCheckedChange={() => handleToggleComplete(task)}
                      />
                      <span>{task.title}</span>
                    </label>
                  ))}
                  {!list.length && (
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add task"
                    value={newTaskTitle[dateKey] ?? ""}
                    onChange={(e) =>
                      setNewTaskTitle((prev) => ({
                        ...prev,
                        [dateKey]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTask(dateKey);
                    }}
                  />
                  <Button size="sm" onClick={() => handleAddTask(dateKey)}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Someday</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 flex-1">
            <div className="space-y-2">
              {(tasksByDate["someday"] ?? []).map((task) => (
                <label
                  key={task.id}
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    task.completedAt && "line-through text-muted-foreground"
                  )}
                >
                  <Checkbox
                    checked={Boolean(task.completedAt)}
                    onCheckedChange={() => handleToggleComplete(task)}
                  />
                  <span>{task.title}</span>
                </label>
              ))}
              {!(tasksByDate["someday"] ?? []).length && (
                <p className="text-xs text-muted-foreground">No tasks</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add someday task"
                value={newTaskTitle["someday"] ?? ""}
                onChange={(e) =>
                  setNewTaskTitle((prev) => ({
                    ...prev,
                    someday: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask(null);
                }}
              />
              <Button size="sm" onClick={() => handleAddTask(null)}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recurring Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recurring.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recurring rules yet.
              </p>
            )}
            {recurring.map((rule) => (
              <div
                key={rule.id}
                className="rounded border p-3 text-sm flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{rule.title}</span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {rule.cadence}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Start: {rule.startsOn}{" "}
                  {rule.endsOn ? `· Ends: ${rule.endsOn}` : ""}{" "}
                  {rule.isActive ? "· Active" : "· Paused"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Recurring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="r-title">Title</Label>
              <Input
                id="r-title"
                placeholder="Daily stretch"
                value={recurringForm.title}
                onChange={(e) =>
                  setRecurringForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-start">Starts On</Label>
              <Input
                id="r-start"
                type="date"
                value={recurringForm.startsOn}
                onChange={(e) =>
                  setRecurringForm((p) => ({ ...p, startsOn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-cadence">Cadence</Label>
              <select
                id="r-cadence"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={recurringForm.cadence}
                onChange={(e) =>
                  setRecurringForm((p) => ({
                    ...p,
                    cadence: e.target.value as RecurringRule["cadence"],
                  }))
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <Button
              onClick={handleAddRecurring}
              disabled={!recurringForm.title.trim()}
            >
              Create recurring
            </Button>
          </CardContent>
        </Card>
      </section>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
    </div>
  );
}
