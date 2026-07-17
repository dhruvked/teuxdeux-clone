"use client";

import React from "react";
import {
	Plus,
	Trash2,
	ChevronLeft,
	ChevronRight,
	Settings,
	Flame,
	TrendingUp,
	Check,
	Calendar,
	Activity,
} from "lucide-react";
import {
	AppShell,
	AppShellMain,
	Stack,
	Text,
	Group,
	Button,
	ActionIcon,
	Modal,
	TextInput,
	Select,
	NumberInput,
	Card,
	SimpleGrid,
	RingProgress,
	Progress,
	Tooltip,
	Menu,
	Paper,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

type HabitLog = {
	id: string;
	date: string;
	completed: boolean;
};

type Habit = {
	id: string;
	name: string;
	color: string;
	goalDays: number;
	sortOrder: number;
	archived: boolean;
	createdAt: string;
	logs: HabitLog[];
};

const COLOR_THEMES = [
	{ value: "emerald", label: "Emerald Green", hex: "#10b981" },
	{ value: "violet", label: "Electric Violet", hex: "#8b5cf6" },
	{ value: "indigo", label: "Indigo Blue", hex: "#6366f1" },
	{ value: "rose", label: "Rose Pink", hex: "#f43f5e" },
	{ value: "sunset", label: "Sunset Orange", hex: "#f97316" },
	{ value: "gold", label: "Gold Yellow", hex: "#eab308" },
	{ value: "teal", label: "Ocean Teal", hex: "#14b8a6" },
];

const getColorHex = (colorName: string) => {
	const theme = COLOR_THEMES.find((t) => t.value === colorName);
	return theme ? theme.hex : "#8b5cf6";
};

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitTracker() {
	const [habits, setHabits] = React.useState<Habit[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
	const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1); // 1-12

	// Modal states
	const [addModalOpen, setAddModalOpen] = React.useState(false);
	const [newHabitName, setNewHabitName] = React.useState("");
	const [newHabitColor, setNewHabitColor] = React.useState("emerald");
	const [newHabitGoal, setNewHabitGoal] = React.useState<number | string>(20);

	const [editHabit, setEditHabit] = React.useState<Habit | null>(null);
	const [editHabitName, setEditHabitName] = React.useState("");
	const [editHabitColor, setEditHabitColor] = React.useState("");
	const [editHabitGoal, setEditHabitGoal] = React.useState<number | string>(20);

	const daysInMonth = React.useMemo(() => {
		return new Date(selectedYear, selectedMonth, 0).getDate();
	}, [selectedYear, selectedMonth]);

	// Fetch habits for selected month/year
	const loadHabits = async (year: number, month: number) => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/habits?year=${year}&month=${month}`);
			if (!res.ok) {
				throw new Error("Failed to load habits");
			}
			const data = await res.json();
			setHabits(data.habits || []);
		} catch (err: any) {
			console.error(err);
			setError(err.message || "Failed to fetch habits");
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		loadHabits(selectedYear, selectedMonth);
	}, [selectedYear, selectedMonth]);

	// Month Navigation
	const prevMonth = () => {
		if (selectedMonth === 1) {
			setSelectedMonth(12);
			setSelectedYear(selectedYear - 1);
		} else {
			setSelectedMonth(selectedMonth - 1);
		}
	};

	const nextMonth = () => {
		if (selectedMonth === 12) {
			setSelectedMonth(1);
			setSelectedYear(selectedYear + 1);
		} else {
			setSelectedMonth(selectedMonth + 1);
		}
	};

	// Log Habit Checkbox Click (Optimistic UI update)
	const toggleHabitLog = async (habitId: string, dayNum: number) => {
		const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

		// Pre-calculate optimistic state change
		setHabits((prevHabits) =>
			prevHabits.map((habit) => {
				if (habit.id !== habitId) return habit;
				const exists = habit.logs.find((l) => l.date === formattedDate);
				let newLogs = [];
				if (exists) {
					newLogs = habit.logs.filter((l) => l.date !== formattedDate);
				} else {
					newLogs = [...habit.logs, { id: "temp-id", date: formattedDate, completed: true }];
				}
				return { ...habit, logs: newLogs };
			})
		);

		try {
			const res = await fetch(`/api/habits/${habitId}/log`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ date: formattedDate }),
			});
			if (!res.ok) {
				throw new Error("Failed to save log");
			}
			const data = await res.json();

			// Replace temporary log item with real database record
			setHabits((prevHabits) =>
				prevHabits.map((habit) => {
					if (habit.id !== habitId) return habit;
					const otherLogs = habit.logs.filter((l) => l.date !== formattedDate);
					const finalLogs = data.completed
						? [...otherLogs, { id: data.log.id, date: data.log.date, completed: true }]
						: otherLogs;
					return { ...habit, logs: finalLogs };
				})
			);
		} catch (err) {
			console.error(err);
			notifications.show({
				title: "Error",
				message: "Could not sync completion status to the cloud.",
				color: "red",
			});
			// Rollback to database state by reloading
			loadHabits(selectedYear, selectedMonth);
		}
	};

	// Add Habit
	const handleAddHabit = async () => {
		if (!newHabitName.trim()) return;

		try {
			const res = await fetch("/api/habits", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: newHabitName,
					color: newHabitColor,
					goalDays: Number(newHabitGoal) || 20,
				}),
			});
			if (!res.ok) throw new Error("Failed to create habit");
			const data = await res.json();

			setHabits((prev) => [...prev, data.habit]);
			setNewHabitName("");
			setNewHabitColor("emerald");
			setNewHabitGoal(20);
			setAddModalOpen(false);
			notifications.show({
				title: "Success",
				message: "Habit created successfully!",
				color: "green",
			});
		} catch (err: any) {
			console.error(err);
			notifications.show({
				title: "Error",
				message: err.message || "Failed to create habit.",
				color: "red",
			});
		}
	};

	// Edit Habit
	const handleEditHabit = async () => {
		if (!editHabit || !editHabitName.trim()) return;

		try {
			const res = await fetch(`/api/habits/${editHabit.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: editHabitName,
					color: editHabitColor,
					goalDays: Number(editHabitGoal) || 20,
				}),
			});
			if (!res.ok) throw new Error("Failed to update habit");
			const data = await res.json();

			setHabits((prev) =>
				prev.map((h) => (h.id === editHabit.id ? { ...h, ...data.habit } : h))
			);
			setEditHabit(null);
			notifications.show({
				title: "Success",
				message: "Habit updated successfully!",
				color: "green",
			});
		} catch (err: any) {
			console.error(err);
			notifications.show({
				title: "Error",
				message: err.message || "Failed to update habit.",
				color: "red",
			});
		}
	};

	// Delete Habit
	const handleDeleteHabit = async (id: string) => {
		if (!confirm("Are you sure you want to delete this habit? All progress logs will be permanently deleted.")) return;

		try {
			const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Failed to delete habit");

			setHabits((prev) => prev.filter((h) => h.id !== id));
			if (editHabit?.id === id) setEditHabit(null);
			notifications.show({
				title: "Deleted",
				message: "Habit has been removed.",
				color: "orange",
			});
		} catch (err: any) {
			console.error(err);
			notifications.show({
				title: "Error",
				message: err.message || "Failed to delete habit.",
				color: "red",
			});
		}
	};

	// Helper for checking if habit is completed on day
	const isDayCompleted = (habit: Habit, day: number) => {
		const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		return habit.logs.some((l) => l.date === formattedDate);
	};

	// Analytics calculations
	const stats = React.useMemo(() => {
		if (habits.length === 0) {
			return { overallProgress: 0, activeCount: 0, maxStreak: 0 };
		}

		let totalLogCapacity = habits.length * daysInMonth;
		let totalCompletedLogs = 0;

		habits.forEach((habit) => {
			totalCompletedLogs += habit.logs.length;
		});

		// Calculate streaks
		let globalMaxStreak = 0;
		const todayStr = new Date().toISOString().split("T")[0];

		habits.forEach((habit) => {
			let currentStreak = 0;
			let maxStreak = 0;
			
			// Order logs by date descending
			const completedDates = new Set(habit.logs.map((l) => l.date));

			// Loop through all days of the selected month
			for (let d = 1; d <= daysInMonth; d++) {
				const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
				if (completedDates.has(dateStr)) {
					currentStreak++;
					if (currentStreak > maxStreak) {
						maxStreak = currentStreak;
					}
				} else {
					currentStreak = 0;
				}
			}

			if (maxStreak > globalMaxStreak) {
				globalMaxStreak = maxStreak;
			}
		});

		const overallProgress = Math.round((totalCompletedLogs / totalLogCapacity) * 100) || 0;

		return {
			overallProgress,
			activeCount: habits.length,
			maxStreak: globalMaxStreak,
		};
	}, [habits, daysInMonth, selectedYear, selectedMonth]);

	// Weekly Progress blocks (Weeks 1 to 5)
	const weeklyStats = React.useMemo(() => {
		const weeks = [
			{ label: "Week 1", start: 1, end: 7 },
			{ label: "Week 2", start: 8, end: 14 },
			{ label: "Week 3", start: 15, end: 21 },
			{ label: "Week 4", start: 22, end: 28 },
			{ label: "Week 5", start: 29, end: daysInMonth },
		];

		return weeks.map((week) => {
			const totalDays = week.end - week.start + 1;
			const totalCapacity = habits.length * totalDays;
			let completedCount = 0;

			if (habits.length > 0) {
				habits.forEach((habit) => {
					for (let d = week.start; d <= week.end; d++) {
						if (isDayCompleted(habit, d)) {
							completedCount++;
						}
					}
				});
			}

			const percentage = totalCapacity > 0 ? Math.round((completedCount / totalCapacity) * 100) : 0;

			return {
				...week,
				completed: completedCount,
				capacity: totalCapacity,
				percentage,
			};
		});
	}, [habits, daysInMonth]);

	// Render column headers (Days 1 to 31)
	const renderDayHeaders = () => {
		const headers = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const date = new Date(selectedYear, selectedMonth - 1, d);
			const dayName = WEEKDAYS[date.getDay()];
			const isToday =
				new Date().getDate() === d &&
				new Date().getMonth() + 1 === selectedMonth &&
				new Date().getFullYear() === selectedYear;

			headers.push(
				<div
					key={d}
					className={`flex flex-col items-center justify-center min-w-[34px] py-1.5 rounded-md ${
						isToday ? "bg-white/10 border border-white/20" : ""
					}`}
				>
					<Text size="xs" c="dimmed" style={{ fontSize: "10px", textTransform: "uppercase" }}>
						{dayName[0]}
					</Text>
					<Text size="sm" fw={isToday ? 700 : 500} c={isToday ? "white" : "gray.4"}>
						{d}
					</Text>
				</div>
			);
		}
		return headers;
	};

	return (
		<AppShell padding="md">
			<AppShellMain className="min-h-screen bg-transparent p-4 md:p-8">
				<Stack gap="xl" className="max-w-[1400px] mx-auto">
					{/* Header section with Glassmorphism */}
					<Paper
						p="xl"
						radius="lg"
						style={{
							background: "rgba(255, 255, 255, 0.03)",
							backdropFilter: "blur(12px)",
							border: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						<Group justify="space-between" align="center" wrap="wrap" gap="md">
							<div>
								<Group gap="xs">
									<Calendar size={28} className="text-violet-400" />
									<Text size="xl" fw={700} c="white">
										Habit Dashboard
									</Text>
								</Group>
								<Text size="xs" c="dimmed" mt={4}>
									Track your progress daily and keep your streaks alive.
								</Text>
							</div>

							{/* Month Navigation */}
							<Group gap="xs">
								<ActionIcon variant="subtle" color="gray" onClick={prevMonth} size="lg">
									<ChevronLeft size={20} />
								</ActionIcon>
								<Text size="md" fw={600} className="w-[130px] text-center c-white">
									{MONTH_NAMES[selectedMonth - 1]} {selectedYear}
								</Text>
								<ActionIcon variant="subtle" color="gray" onClick={nextMonth} size="lg">
									<ChevronRight size={20} />
								</ActionIcon>

								<Button
									variant="light"
									color="violet"
									leftSection={<Plus size={16} />}
									onClick={() => setAddModalOpen(true)}
									className="ml-2"
								>
									Add Habit
								</Button>
							</Group>
						</Group>
					</Paper>

					{/* Overall Stats Cards */}
					<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
						<Card
							p="lg"
							radius="lg"
							style={{
								background: "rgba(255, 255, 255, 0.02)",
								border: "1px solid rgba(255, 255, 255, 0.06)",
							}}
						>
							<Group justify="space-between">
								<div>
									<Text size="xs" c="dimmed" fw={600}>
										OVERALL PROGRESS
									</Text>
									<Text size="xl" fw={800} mt={4}>
										{stats.overallProgress}%
									</Text>
								</div>
								<RingProgress
									size={60}
									thickness={6}
									roundCaps
									sections={[{ value: stats.overallProgress, color: "violet" }]}
								/>
							</Group>
						</Card>

						<Card
							p="lg"
							radius="lg"
							style={{
								background: "rgba(255, 255, 255, 0.02)",
								border: "1px solid rgba(255, 255, 255, 0.06)",
							}}
						>
							<Group justify="space-between">
								<div>
									<Text size="xs" c="dimmed" fw={600}>
										ACTIVE HABITS
									</Text>
									<Text size="xl" fw={800} mt={4}>
										{stats.activeCount}
									</Text>
								</div>
								<ActionIcon variant="light" color="teal" size="xl" radius="md">
									<Activity size={20} />
								</ActionIcon>
							</Group>
						</Card>

						<Card
							p="lg"
							radius="lg"
							style={{
								background: "rgba(255, 255, 255, 0.02)",
								border: "1px solid rgba(255, 255, 255, 0.06)",
							}}
						>
							<Group justify="space-between">
								<div>
									<Text size="xs" c="dimmed" fw={600}>
										LONGEST STREAK
									</Text>
									<Text size="xl" fw={800} mt={4}>
										{stats.maxStreak} Days
									</Text>
								</div>
								<ActionIcon variant="light" color="orange" size="xl" radius="md">
									<Flame size={20} className="animate-pulse" />
								</ActionIcon>
							</Group>
						</Card>
					</SimpleGrid>

					{/* Loading and Error states */}
					{loading && (
						<Paper p="xl" radius="lg" style={{ background: "rgba(0,0,0,0.1)", textAlign: "center" }}>
							<Text size="md" c="dimmed">
								Loading your habit tracker board...
							</Text>
						</Paper>
					)}

					{error && (
						<Paper p="xl" radius="lg" style={{ background: "rgba(250, 82, 82, 0.05)", border: "1px solid rgba(250, 82, 82, 0.15)" }}>
							<Text size="md" c="red">
								{error}
							</Text>
							<Button variant="subtle" color="red" mt="md" onClick={() => loadHabits(selectedYear, selectedMonth)}>
								Retry Connection
							</Button>
						</Paper>
					)}

					{/* Main Grid View */}
					{!loading && !error && (
						<Paper
							p="lg"
							radius="lg"
							style={{
								background: "rgba(255, 255, 255, 0.02)",
								border: "1px solid rgba(255, 255, 255, 0.06)",
								overflow: "hidden",
							}}
						>
							{habits.length === 0 ? (
								<div className="py-16 text-center">
									<Text size="md" c="dimmed">
										No habits tracked yet for this month.
									</Text>
									<Button variant="outline" color="violet" mt="md" onClick={() => setAddModalOpen(true)}>
										Create your first habit
									</Button>
								</div>
							) : (
								<div className="overflow-x-auto pb-4">
									{/* Grid Header */}
									<div className="flex min-w-[1250px] border-b border-white/5 pb-3">
										{/* Habits label column */}
										<div className="w-[200px] flex items-center pr-4">
											<Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: "1px" }}>
												HABITS
											</Text>
										</div>

										{/* Days columns */}
										<div className="flex-1 flex justify-between gap-1.5">
											{renderDayHeaders()}
										</div>
									</div>

									{/* Grid Rows */}
									<div className="flex flex-col gap-2 mt-3">
										{habits.map((habit) => (
											<div key={habit.id} className="flex min-w-[1250px] items-center py-1 hover:bg-white/[0.01] rounded-lg transition-colors">
												{/* Habit Info Column */}
												<div className="w-[200px] pr-4 flex items-center justify-between">
													<Tooltip label={habit.name} position="top-start" openDelay={500}>
														<Text
															size="sm"
															fw={600}
															className="truncate cursor-pointer max-w-[150px] hover:text-white transition-colors"
															style={{ color: "rgba(255,255,255,0.85)" }}
															onClick={() => {
																setEditHabit(habit);
																setEditHabitName(habit.name);
																setEditHabitColor(habit.color);
																setEditHabitGoal(habit.goalDays);
															}}
														>
															{habit.name}
														</Text>
													</Tooltip>

													{/* Habit Actions */}
													<Menu shadow="md" width={160} position="right-start">
														<Menu.Target>
															<ActionIcon variant="subtle" color="gray" size="sm">
																<Settings size={14} />
															</ActionIcon>
														</Menu.Target>
														<Menu.Dropdown style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
															<Menu.Label>Configure Habit</Menu.Label>
															<Menu.Item
																leftSection={<Settings size={14} />}
																onClick={() => {
																	setEditHabit(habit);
																	setEditHabitName(habit.name);
																	setEditHabitColor(habit.color);
																	setEditHabitGoal(habit.goalDays);
																}}
																style={{ color: "white" }}
															>
																Edit Details
															</Menu.Item>
															<Menu.Divider />
															<Menu.Item
																leftSection={<Trash2 size={14} />}
																color="red"
																onClick={() => handleDeleteHabit(habit.id)}
															>
																Delete Habit
															</Menu.Item>
														</Menu.Dropdown>
													</Menu>
												</div>

												{/* Habit Completion Checkboxes */}
												<div className="flex-1 flex justify-between gap-1.5">
													{Array.from({ length: daysInMonth }).map((_, idx) => {
														const dayNum = idx + 1;
														const completed = isDayCompleted(habit, dayNum);
														const activeColorHex = getColorHex(habit.color);

														return (
															<div
																key={dayNum}
																onClick={() => toggleHabitLog(habit.id, dayNum)}
																className="min-w-[34px] h-[34px] flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 relative"
																style={{
																	background: completed
																		? `rgba(${parseInt(activeColorHex.slice(1, 3), 16)}, ${parseInt(activeColorHex.slice(3, 5), 16)}, ${parseInt(activeColorHex.slice(5, 7), 16)}, 0.2)`
																		: "rgba(255,255,255,0.03)",
																	border: completed
																		? `1px solid ${activeColorHex}`
																		: "1px solid rgba(255,255,255,0.06)",
																}}
															>
																{completed && (
																	<Check
																		size={16}
																		style={{
																			color: activeColorHex,
																		}}
																		className="scale-100 animate-fade-in"
																	/>
																)}
															</div>
														);
													})}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</Paper>
					)}

					{/* Weekly Progress Analytics */}
					{!loading && !error && habits.length > 0 && (
						<div>
							<Text size="sm" fw={700} c="dimmed" mb="md" style={{ letterSpacing: "1px" }}>
								WEEKLY COMPLETION RATES
							</Text>
							<SimpleGrid cols={{ base: 1, sm: 5 }} spacing="md">
								{weeklyStats.map((week) => (
									<Card
										key={week.label}
										p="md"
										radius="lg"
										style={{
											background: "rgba(255, 255, 255, 0.02)",
											border: "1px solid rgba(255, 255, 255, 0.05)",
										}}
									>
										<Text size="xs" fw={700} c="dimmed">
											{week.label.toUpperCase()}
										</Text>
										<Text size="xs" c="dimmed" mt={4}>
											Days {week.start} - {week.end}
										</Text>
										<Group justify="space-between" align="flex-end" mt="md">
											<div>
												<Text size="lg" fw={800}>
													{week.percentage}%
												</Text>
												<Text size="xs" c="dimmed">
													{week.completed}/{week.capacity} habits
												</Text>
											</div>
											<RingProgress
												size={50}
												thickness={4.5}
												sections={[{ value: week.percentage, color: week.percentage > 70 ? "teal" : week.percentage > 40 ? "violet" : "orange" }]}
											/>
										</Group>
									</Card>
								))}
							</SimpleGrid>
						</div>
					)}

					{/* Detailed Habit Goal Lists (Progress Bars) */}
					{!loading && !error && habits.length > 0 && (
						<div>
							<Text size="sm" fw={700} c="dimmed" mb="md" style={{ letterSpacing: "1px" }}>
								MONTHLY GOAL ANALYTICS
							</Text>
							<SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
								{habits.map((habit) => {
									const completedCount = habit.logs.length;
									const goal = habit.goalDays;
									const progressPercentage = Math.min(100, Math.round((completedCount / goal) * 100)) || 0;
									const colorHex = getColorHex(habit.color);

									// Calc habit-specific current streak
									let currentStreak = 0;
									const completedDates = new Set(habit.logs.map((l) => l.date));
									const today = new Date();
									const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
									const yesterday = new Date(today);
									yesterday.setDate(today.getDate() - 1);
									const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

									// We can compute current streak by counting backwards from today (or yesterday if they haven't completed today yet)
									let startCheckDate = today;
									// if not completed today and not completed yesterday, streak is 0.
									// if not completed today but completed yesterday, streak starts from yesterday.
									// if completed today, streak starts from today.
									if (!completedDates.has(todayStr) && completedDates.has(yesterdayStr)) {
										startCheckDate = yesterday;
									}

									let checking = true;
									let dateCursor = new Date(startCheckDate);
									while (checking) {
										const cursorStr = `${dateCursor.getFullYear()}-${String(dateCursor.getMonth() + 1).padStart(2, "0")}-${String(dateCursor.getDate()).padStart(2, "0")}`;
										if (completedDates.has(cursorStr)) {
											currentStreak++;
											dateCursor.setDate(dateCursor.getDate() - 1);
										} else {
											checking = false;
										}
									}

									return (
										<Paper
											key={habit.id}
											p="md"
											radius="lg"
											style={{
												background: "rgba(255, 255, 255, 0.01)",
												border: "1px solid rgba(255, 255, 255, 0.04)",
											}}
										>
											<Group justify="space-between" mb="xs">
												<Group gap="xs">
													<div
														className="w-3.5 h-3.5 rounded-full"
														style={{ backgroundColor: colorHex }}
													/>
													<Text size="sm" fw={600} c="white">
														{habit.name}
													</Text>
												</Group>
												<Group gap="xs">
													{currentStreak > 0 && (
														<Group gap="4" align="center" className="bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
															<Flame size={12} className="text-orange-500" />
															<Text size="xs" fw={700} c="orange.5">
																{currentStreak}d streak
															</Text>
														</Group>
													)}
													<Text size="xs" fw={700} c="dimmed">
														{completedCount} / {goal} days
													</Text>
												</Group>
											</Group>
											<Progress
												value={progressPercentage}
												color={habit.color}
												size="sm"
												radius="md"
												style={{ background: "rgba(255,255,255,0.05)" }}
											/>
										</Paper>
									);
								})}
							</SimpleGrid>
						</div>
					)}
				</Stack>
			</AppShellMain>

			{/* Add Habit Modal */}
			<Modal
				opened={addModalOpen}
				onClose={() => setAddModalOpen(false)}
				title="Track New Habit"
				centered
				styles={{
					content: { background: "#151515", border: "1px solid rgba(255,255,255,0.1)", color: "white" },
					header: { background: "#151515", color: "white" },
				}}
			>
				<Stack gap="md">
					<TextInput
						label="Habit Name"
						placeholder="E.g. Read 15 pages, Drink water, Gym"
						value={newHabitName}
						onChange={(event) => setNewHabitName(event.currentTarget.value)}
						required
						styles={{ input: { background: "#202020", color: "white", borderColor: "#303030" } }}
					/>

					<Select
						label="Color Tag Theme"
						value={newHabitColor}
						onChange={(value) => setNewHabitColor(value || "emerald")}
						data={COLOR_THEMES}
						required
						styles={{ dropdown: { background: "#1a1a1a", borderColor: "#303030" }, input: { background: "#202020", color: "white", borderColor: "#303030" } }}
					/>

					<NumberInput
						label="Monthly Completion Goal (Days)"
						min={1}
						max={31}
						value={newHabitGoal}
						onChange={(val) => setNewHabitGoal(val)}
						required
						styles={{ input: { background: "#202020", color: "white", borderColor: "#303030" } }}
					/>

					<Button color="violet" onClick={handleAddHabit} mt="md" fullWidth>
						Create Habit
					</Button>
				</Stack>
			</Modal>

			{/* Edit Habit Modal */}
			<Modal
				opened={!!editHabit}
				onClose={() => setEditHabit(null)}
				title="Edit Habit Details"
				centered
				styles={{
					content: { background: "#151515", border: "1px solid rgba(255,255,255,0.1)", color: "white" },
					header: { background: "#151515", color: "white" },
				}}
			>
				<Stack gap="md">
					<TextInput
						label="Habit Name"
						placeholder="E.g. Read 15 pages"
						value={editHabitName}
						onChange={(event) => setEditHabitName(event.currentTarget.value)}
						required
						styles={{ input: { background: "#202020", color: "white", borderColor: "#303030" } }}
					/>

					<Select
						label="Color Tag Theme"
						value={editHabitColor}
						onChange={(value) => setEditHabitColor(value || "emerald")}
						data={COLOR_THEMES}
						required
						styles={{ dropdown: { background: "#1a1a1a", borderColor: "#303030" }, input: { background: "#202020", color: "white", borderColor: "#303030" } }}
					/>

					<NumberInput
						label="Monthly Completion Goal (Days)"
						min={1}
						max={31}
						value={editHabitGoal}
						onChange={(val) => setEditHabitGoal(val)}
						required
						styles={{ input: { background: "#202020", color: "white", borderColor: "#303030" } }}
					/>

					<Group justify="space-between" mt="lg">
						<Button
							variant="outline"
							color="red"
							leftSection={<Trash2 size={14} />}
							onClick={() => {
								if (editHabit) {
									handleDeleteHabit(editHabit.id);
								}
							}}
						>
							Delete
						</Button>
						<Button color="violet" onClick={handleEditHabit}>
							Save Changes
						</Button>
					</Group>
				</Stack>
			</Modal>
		</AppShell>
	);
}
