"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { createTimeLogAction } from "@/app/actions/timelogs";
import { Clock, Plus, Filter, Calendar, BarChart2, List } from "lucide-react";

interface TimeLogsClientProps {
  currentUser: SessionUser;
  timeLogs: any[];
  projects: any[];
  tasks: any[];
}

export const TimeLogsClient: React.FC<TimeLogsClientProps> = ({
  currentUser,
  timeLogs,
  projects,
  tasks,
}) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"list" | "analytics">("list");
  
  // Filtering states
  const [projectFilter, setProjectFilter] = useState("All");
  const [personFilter, setPersonFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    projectId: "",
    taskId: "",
    hours: 4,
    workNote: "",
    statusUpdate: "In Progress",
  });

  const isManagement = currentUser.roleName === "Admin" || currentUser.roleName.includes("Manager");

  // Filtered Logs list
  const filteredLogs = useMemo(() => {
    return timeLogs.filter((log) => {
      const matchesProject = projectFilter === "All" || log.projectId === projectFilter;
      const matchesPerson = personFilter === "All" || log.userId === personFilter;
      const logDateStr = (typeof log.date === "string" ? log.date : log.date.toISOString()).split("T")[0];
      const matchesDate = !dateFilter || logDateStr === dateFilter;

      return matchesProject && matchesPerson && matchesDate;
    });
  }, [timeLogs, projectFilter, personFilter, dateFilter]);

  // Aggregate Stats (Daily, Weekly, Monthly)
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Weekly calculations
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    // Monthly calculations
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let total = 0;

    // Filter logs for stats (if visualizer, show only their stats. If admin/manager, show studio total)
    const statsLogs = isManagement
      ? timeLogs
      : timeLogs.filter((l) => l.userId === currentUser.id);

    statsLogs.forEach((log) => {
      const logDate = new Date(log.date);
      const logDateStr = (typeof log.date === "string" ? log.date : log.date.toISOString()).split("T")[0];

      if (logDateStr === todayStr) daily += log.hours;
      if (logDate >= startOfWeek) weekly += log.hours;
      if (logDate >= startOfMonth) monthly += log.hours;
      total += log.hours;
    });

    return { daily, weekly, monthly, total };
  }, [timeLogs, currentUser.id, isManagement]);

  // Management Analytics (Person-wise, Project-wise, Department-wise)
  const analytics = useMemo(() => {
    const personWise: Record<string, number> = {};
    const projectWise: Record<string, number> = {};
    const deptWise = { "2D LED": 0, "3D LED": 0 };

    timeLogs.forEach((log) => {
      // 1. Person
      personWise[log.user.name] = (personWise[log.user.name] || 0) + log.hours;
      // 2. Project
      projectWise[log.project.name] = (projectWise[log.project.name] || 0) + log.hours;
      // 3. Department
      if (log.user.departmentName === "2D LED") deptWise["2D LED"] += log.hours;
      if (log.user.departmentName === "3D LED") deptWise["3D LED"] += log.hours;
    });

    return {
      personWise: Object.keys(personWise).map((name) => ({ name, hours: personWise[name] })),
      projectWise: Object.keys(projectWise).map((name) => ({ name, hours: projectWise[name] })),
      deptWise: Object.keys(deptWise).map((dept) => ({ name: dept, hours: (deptWise as any)[dept] })),
    };
  }, [timeLogs]);

  // Unique lists for filtering dropdowns
  const uniqueProjects = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    timeLogs.forEach((l) => {
      if (!seen.has(l.projectId)) {
        seen.add(l.projectId);
        list.push({ id: l.projectId, name: l.project.name });
      }
    });
    return list;
  }, [timeLogs]);

  const uniquePeople = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    timeLogs.forEach((l) => {
      if (!seen.has(l.userId)) {
        seen.add(l.userId);
        list.push({ id: l.userId, name: l.user.name });
      }
    });
    return list;
  }, [timeLogs]);

  const selectableProjects = useMemo(() => {
    const projectIdsWithTasks = new Set(tasks.map((t) => t.projectId));
    return projects.filter((p) => projectIdsWithTasks.has(p.id));
  }, [projects, tasks]);

  const handleOpenLogModal = () => {
    if (tasks.length === 0) {
      toast("No active tasks are currently assigned to you. Assign tasks first.", "warning");
      return;
    }
    const defaultTask = tasks[0];
    setFormData({
      date: new Date().toISOString().split("T")[0],
      projectId: defaultTask.projectId,
      taskId: defaultTask.id,
      hours: 4,
      workNote: "",
      statusUpdate: defaultTask.status,
    });
    setIsModalOpen(true);
  };

  const handleProjectSelect = (projId: string) => {
    const projTasks = tasks.filter((t) => t.projectId === projId);
    const defaultTaskId = projTasks[0]?.id || "";
    const defaultStatus = projTasks[0]?.status || "In Progress";
    setFormData({
      ...formData,
      projectId: projId,
      taskId: defaultTaskId,
      statusUpdate: defaultStatus,
    });
  };

  const handleTaskSelect = (taskId: string) => {
    const status = tasks.find((t) => t.id === taskId)?.status || "In Progress";
    setFormData({ ...formData, taskId, statusUpdate: status });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await createTimeLogAction(formData);
      if (res.success) {
        toast("Working hours logged successfully!", "success");
        setIsModalOpen(false);
      } else {
        toast(res.error || "Failed to log working hours", "error");
      }
    } catch (e) {
      toast("An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Completed": return <Badge variant="green">Completed</Badge>;
      case "Review": return <Badge variant="yellow">Review</Badge>;
      case "Revision": return <Badge variant="red">Revision</Badge>;
      case "In Progress": return <Badge variant="blue">In Progress</Badge>;
      default: return <Badge variant="gray">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Effort & Time Tracking</h2>
          <p className="text-sm text-studio-gray-text">
            Log daily work hours against visual design tasks and monitor active workloads.
          </p>
        </div>
        <div className="flex gap-2">
          {isManagement && (
            <div className="flex bg-white rounded-md border border-studio-gray-border p-0.5">
              <button
                onClick={() => setActiveView("list")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  activeView === "list"
                    ? "bg-studio-red text-white"
                    : "text-studio-gray-text hover:text-studio-black"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Time Logs
              </button>
              <button
                onClick={() => setActiveView("analytics")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  activeView === "analytics"
                    ? "bg-studio-red text-white"
                    : "text-studio-gray-text hover:text-studio-black"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Analytics
              </button>
            </div>
          )}
          <Button onClick={handleOpenLogModal} className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
            <Plus className="w-4 h-4" /> Log Hours
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">
                {isManagement ? "Total Today (Studio)" : "My Logging Today"}
              </p>
              <h3 className="text-2xl font-black text-studio-black">{stats.daily} hours</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-studio-red/10 border border-studio-red/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-studio-red" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">
                {isManagement ? "Total Week (Studio)" : "My Logging Week"}
              </p>
              <h3 className="text-2xl font-black text-blue-600">{stats.weekly} hours</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">
                {isManagement ? "Total Month (Studio)" : "My Logging Month"}
              </p>
              <h3 className="text-2xl font-black text-green-600">{stats.monthly} hours</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">
                {isManagement ? "Cumulative Effort" : "My Cumulative Hours"}
              </p>
              <h3 className="text-2xl font-black text-studio-black">{stats.total} hours</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Clock className="w-5 h-5 text-zinc-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content panes based on activeView */}
      {activeView === "list" ? (
        <>
          {/* Filters card */}
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-studio-gray-text shrink-0" />
                <Select
                  options={[{ label: "All Projects", value: "All" }, ...uniqueProjects.map(p => ({ label: p.name, value: p.id }))]}
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                />
              </div>

              {isManagement && (
                <div>
                  <Select
                    options={[{ label: "All Team Members", value: "All" }, ...uniquePeople.map(u => ({ label: u.name, value: u.id }))]}
                    value={personFilter}
                    onChange={(e) => setPersonFilter(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Input
                  type="date"
                  placeholder="Filter by Date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Logs Table */}
          <Card>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-sm text-studio-gray-text">
                  No time logs recorded matching search criteria.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Project Reference</TableHead>
                      <TableHead>Assigned Task</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Work Note / Details</TableHead>
                      <TableHead>Task Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-semibold">{new Date(log.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-xs">{log.user.name}</TableCell>
                        <TableCell>
                          <Link href={`/projects/${log.projectId}`} className="text-xs font-semibold text-studio-black hover:text-studio-red hover:underline">
                            {log.project.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs font-bold">{log.task.title}</TableCell>
                        <TableCell className="text-xs font-black text-studio-red">{log.hours}h</TableCell>
                        <TableCell className="text-xs text-studio-gray-darkText leading-normal">{log.workNote}</TableCell>
                        <TableCell>{getStatusBadge(log.statusUpdate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Analytics View for Management */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Person-wise breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Team Member Cumulative Effort</CardTitle>
              <CardDescription>Total logged hours per person</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.personWise.length === 0 ? (
                <p className="text-xs text-studio-gray-text italic text-center py-4">No data logged</p>
              ) : (
                analytics.personWise
                  .sort((a, b) => b.hours - a.hours)
                  .map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-xs py-2 border-b border-studio-gray-border/50">
                      <span className="font-bold text-studio-gray-darkText">{item.name}</span>
                      <span className="font-black text-studio-red bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">{item.hours}h</span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* Project-wise breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Cumulative Effort</CardTitle>
              <CardDescription>Total logged hours per project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.projectWise.length === 0 ? (
                <p className="text-xs text-studio-gray-text italic text-center py-4">No data logged</p>
              ) : (
                analytics.projectWise
                  .sort((a, b) => b.hours - a.hours)
                  .map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-xs py-2 border-b border-studio-gray-border/50">
                      <span className="font-bold text-studio-gray-darkText truncate max-w-[12rem]">{item.name}</span>
                      <span className="font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">{item.hours}h</span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* Department breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Department Cumulative Effort</CardTitle>
              <CardDescription>Total logged hours per unit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.deptWise.map((item) => (
                <div key={item.name} className="space-y-2 py-2 border-b border-studio-gray-border/50">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>{item.name} Team</span>
                    <span>{item.hours} hours logged</span>
                  </div>
                  <div className="w-full bg-studio-gray-bg rounded-full h-2 overflow-hidden border border-studio-gray-border">
                    <div
                      className={`h-full rounded-full ${item.name === "2D LED" ? "bg-studio-red" : "bg-blue-600"}`}
                      style={{ width: `${Math.min((item.hours / (stats.total || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log Hours Modal Dialog */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Daily Working Hours" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="projectId">Select Project</Label>
            <Select
              id="projectId"
              options={selectableProjects.map((p) => ({ label: p.name, value: p.id }))}
              value={formData.projectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="taskId">Select Assigned Task</Label>
            <Select
              id="taskId"
              options={tasks
                .filter((t) => t.projectId === formData.projectId)
                .map((t) => ({ label: `${t.title} (${t.status})`, value: t.id }))}
              value={formData.taskId}
              onChange={(e) => handleTaskSelect(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="hours">Hours Spent</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                required
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="statusUpdate">Task Status Update</Label>
              <Select
                id="statusUpdate"
                options={["To Do", "In Progress", "Review", "Revision", "Completed"].map((s) => ({ label: s, value: s }))}
                value={formData.statusUpdate}
                onChange={(e) => setFormData({ ...formData, statusUpdate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="workNote">Progress Note / Work Details</Label>
            <Textarea
              id="workNote"
              rows={3}
              required
              placeholder="Detail your work, render progress, or note changes..."
              value={formData.workNote}
              onChange={(e) => setFormData({ ...formData, workNote: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-studio-gray-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Saving..." : "Log hours"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
