"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SessionUser } from "@/lib/auth";
import { ChevronLeft, ChevronRight, AlertTriangle, CalendarDays, Clock, FileText, CheckCircle2 } from "lucide-react";

interface CalendarClientProps {
  currentUser: SessionUser;
  projects: any[];
  tasks: any[];
}

interface CalendarEvent {
  id: string;
  type: "brief_received" | "project_deadline" | "task_deadline" | "review_date" | "overdue_task";
  title: string;
  projectName?: string;
  status: string;
  priority?: string;
  date: Date;
}

export const CalendarClient: React.FC<CalendarClientProps> = ({
  currentUser,
  projects,
  tasks,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Next / Prev Month handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Compile calendar events
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    // 1. Project Brief Received dates
    projects.forEach((proj) => {
      list.push({
        id: `brief-${proj.id}`,
        type: "brief_received",
        title: `Brief Received: ${proj.name}`,
        projectName: proj.name,
        status: proj.status,
        date: new Date(proj.briefReceivedDate),
      });
    });

    // 2. Project Deadline dates
    projects.forEach((proj) => {
      list.push({
        id: `proj-due-${proj.id}`,
        type: "project_deadline",
        title: `Project Due: ${proj.name}`,
        projectName: proj.name,
        status: proj.status,
        date: new Date(proj.deadline),
      });
    });

    // 3. Task Deadline dates
    tasks.forEach((task) => {
      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
      
      if (isOverdue) {
        list.push({
          id: `task-overdue-${task.id}`,
          type: "overdue_task",
          title: `OVERDUE: ${task.title}`,
          projectName: task.project.name,
          status: task.status,
          priority: task.priority,
          date: new Date(task.dueDate),
        });
      } else if (task.status === "Review") {
        list.push({
          id: `task-review-${task.id}`,
          type: "review_date",
          title: `In Review: ${task.title}`,
          projectName: task.project.name,
          status: task.status,
          priority: task.priority,
          date: new Date(task.dueDate),
        });
      } else {
        list.push({
          id: `task-due-${task.id}`,
          type: "task_deadline",
          title: `Task Due: ${task.title}`,
          projectName: task.project.name,
          status: task.status,
          priority: task.priority,
          date: new Date(task.dueDate),
        });
      }
    });

    return list;
  }, [projects, tasks]);

  // Generate calendar days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const calendarCells = useMemo(() => {
    const cells = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Days from next month
    const totalCells = 42; // 6 rows of 7 days
    const nextDaysNeeded = totalCells - cells.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month, daysInMonth, firstDayIndex]);

  // Get events on a specific day
  const getDayEvents = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.date.toISOString().split("T")[0] === dateStr);
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getDayEvents(selectedDate);
  }, [selectedDate, events]);

  const getEventStyles = (type: string) => {
    switch (type) {
      case "overdue_task":
        return "bg-red-500 text-white";
      case "project_deadline":
        return "bg-studio-red text-white";
      case "review_date":
        return "bg-yellow-500 text-studio-black";
      case "brief_received":
        return "bg-zinc-800 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "overdue_task": return <AlertTriangle className="w-3.5 h-3.5" />;
      case "project_deadline": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "review_date": return <Clock className="w-3.5 h-3.5" />;
      case "brief_received": return <FileText className="w-3.5 h-3.5" />;
      default: return <CalendarDays className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-studio-black">Studio Calendar</h2>
        <p className="text-sm text-studio-gray-text">
          Visualize project deadlines, task due dates, brief intake days, and overdue visual reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid (Col Span 3) */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-studio-gray-border">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-studio-red" />
              {currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Week Headers */}
            <div className="grid grid-cols-7 text-center font-bold text-xs text-studio-gray-text pb-2 border-b border-studio-gray-border">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Grid of Days */}
            <div className="grid grid-cols-7 grid-rows-6 h-[32rem] mt-2 border-t border-l border-studio-gray-border">
              {calendarCells.map((cell, idx) => {
                const dayEvents = getDayEvents(cell.date);
                const isSelected = selectedDate && selectedDate.toDateString() === cell.date.toDateString();
                const isToday = new Date().toDateString() === cell.date.toDateString();

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`border-r border-b border-studio-gray-border p-2 flex flex-col justify-between cursor-pointer transition-all hover:bg-studio-gray-bg/50 ${
                      !cell.isCurrentMonth ? "bg-zinc-50/50 text-zinc-300" : "bg-white text-studio-black"
                    } ${isSelected ? "ring-2 ring-studio-red z-10 bg-studio-gray-bg/30" : ""} ${
                      isToday ? "bg-red-50/10 border-t-2 border-t-studio-red" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold ${isToday ? "text-studio-red" : ""}`}>
                        {cell.date.getDate()}
                      </span>
                      {dayEvents.some((e) => e.type === "overdue_task") && (
                        <AlertTriangle className="w-3.5 h-3.5 text-studio-red" />
                      )}
                    </div>

                    {/* Tiny Event Badges */}
                    <div className="space-y-1 mt-1 overflow-hidden max-h-[4rem]">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={`text-[9px] font-semibold px-1 rounded truncate leading-tight ${getEventStyles(
                            e.type
                          )}`}
                          title={e.title}
                        >
                          {e.type === "brief_received" ? "Brief" : e.type === "project_deadline" ? "Due" : "Task"}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] text-studio-gray-text font-semibold text-center">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details Sidebar (Col Span 1) */}
        <Card className="flex flex-col bg-studio-black text-white border-zinc-800">
          <CardHeader className="border-zinc-800 pb-4">
            <CardTitle className="text-white text-md">
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "Select a Date"}
            </CardTitle>
            <CardDescription className="text-zinc-500">Scheduled studio work for this day</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 px-5">
            {selectedDayEvents.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4">No deadlines or briefs scheduled for this day.</p>
            ) : (
              selectedDayEvents.map((e) => (
                <div key={e.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded ${getEventStyles(e.type)}`}>
                      {getEventIcon(e.type)}
                    </span>
                    <span className="text-[10px] font-black uppercase text-zinc-400">
                      {e.type.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs leading-normal">{e.title}</h4>
                  {e.projectName && (
                    <p className="text-[10px] text-zinc-400">Project: {e.projectName}</p>
                  )}
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-zinc-500">Status: {e.status}</span>
                    {e.priority && (
                      <span className={`px-1.5 rounded text-[8px] font-bold ${
                        e.priority === "Urgent" ? "bg-red-500/10 text-red-500" : "bg-zinc-800 text-zinc-300"
                      }`}>
                        {e.priority}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
