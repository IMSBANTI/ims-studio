"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { BarChart3, Download, Filter, FileSpreadsheet } from "lucide-react";

type ReportType =
  | "monthly_projects"
  | "task_completion"
  | "team_performance"
  | "project_hours"
  | "dept_workload"
  | "pending_tasks"
  | "completed_projects"
  | "bd_projects"
  | "brief_pending";

interface ReportsClientProps {
  currentUser: SessionUser;
  projects: any[];
  tasks: any[];
  users: any[];
}

export const ReportsClient: React.FC<ReportsClientProps> = ({
  currentUser,
  projects,
  tasks,
  users,
}) => {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType>("monthly_projects");

  // Filters State
  const [monthFilter, setMonthFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [briefStatusFilter, setBriefStatusFilter] = useState("All");
  const [bdFilter, setBdFilter] = useState("All");

  const reportsList = [
    { type: "monthly_projects", label: "Monthly Project Summary" },
    { type: "task_completion", label: "Monthly Task Completion" },
    { type: "team_performance", label: "Team Member Performance" },
    { type: "project_hours", label: "Project-Wise Hours" },
    { type: "dept_workload", label: "Department Workload" },
    { type: "pending_tasks", label: "Pending Tasks" },
    { type: "completed_projects", label: "Completed Projects" },
    { type: "bd_projects", label: "BD Member Projects" },
    { type: "brief_pending", label: "Brief Clarification Pending" },
  ];

  // Available unique options for filters
  const uniqueMonths = useMemo(() => {
    const list = new Set<string>();
    projects.forEach((p) => {
      const date = new Date(p.briefReceivedDate);
      const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      list.add(val);
    });
    return Array.from(list).sort().reverse();
  }, [projects]);

  const uniqueClients = useMemo(() => {
    const list = new Set<string>();
    projects.forEach((p) => list.add(p.clientName));
    return Array.from(list).sort();
  }, [projects]);

  const uniqueBdNames = useMemo(() => {
    const list = new Set<string>();
    projects.forEach((p) => {
      if (p.bdSource) list.add(p.bdSource.bd_member_name);
    });
    return Array.from(list).sort();
  }, [projects]);

  // General filtered project scope
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesMonth =
        monthFilter === "All" ||
        `${new Date(p.briefReceivedDate).getFullYear()}-${String(
          new Date(p.briefReceivedDate).getMonth() + 1
        ).padStart(2, "0")}` === monthFilter;

      const matchesDept =
        deptFilter === "All" || p.departmentInvolved === deptFilter || p.departmentInvolved === "Both";

      const matchesClient =
        !clientFilter || p.clientName.toLowerCase().includes(clientFilter.toLowerCase());

      const matchesProjStatus = projectStatusFilter === "All" || p.status === projectStatusFilter;

      const matchesBriefStatus = briefStatusFilter === "All" || p.briefStatus === briefStatusFilter;

      const matchesBd = bdFilter === "All" || (p.bdSource && p.bdSource.bd_member_name === bdFilter);

      return matchesMonth && matchesDept && matchesClient && matchesProjStatus && matchesBriefStatus && matchesBd;
    });
  }, [projects, monthFilter, deptFilter, clientFilter, projectStatusFilter, briefStatusFilter, bdFilter]);

  // General filtered tasks scope
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesDept = deptFilter === "All" || t.departmentName === deptFilter;
      const matchesProject = projectFilter === "All" || t.projectId === projectFilter;
      const matchesUser = userFilter === "All" || t.assignedUserId === userFilter;
      const matchesTaskStatus = taskStatusFilter === "All" || t.status === taskStatusFilter;

      return matchesDept && matchesProject && matchesUser && matchesTaskStatus;
    });
  }, [tasks, deptFilter, projectFilter, userFilter, taskStatusFilter]);

  // Compiled report dataset
  const reportData = useMemo(() => {
    switch (selectedReport) {
      case "monthly_projects":
        return filteredProjects.map((p) => ({
          "Project Name": p.name,
          Client: p.clientName,
          Type: p.projectType,
          "Intake Date": new Date(p.briefReceivedDate).toLocaleDateString(),
          "Due Date": new Date(p.deadline).toLocaleDateString(),
          Status: p.status,
          Priority: p.priority,
          "BD Rep": p.bdSource?.bd_member_name || "N/A",
        }));

      case "task_completion":
        return filteredTasks
          .filter((t) => t.status === "Completed")
          .map((t) => ({
            "Task Title": t.title,
            "Project Reference": t.project.name,
            "Assigned Visualizer": t.assignedUser.name,
            Department: t.departmentName,
            "Completed Date": t.completionDate ? new Date(t.completionDate).toLocaleDateString() : "N/A",
            "Hours Spent": `${t.actualHours}h`,
          }));

      case "team_performance":
        return users
          .filter((u) => u.roleName !== "Admin")
          .map((u) => {
            const userTasks = tasks.filter((t) => t.assignedUserId === u.id);
            const completed = userTasks.filter((t) => t.status === "Completed").length;
            const pending = userTasks.length - completed;
            const timeLogs = filteredProjects.flatMap((p) =>
              p.timeLogs.filter((l: any) => l.userId === u.id)
            );
            const totalHours = timeLogs.reduce((acc, curr) => acc + curr.hours, 0);

            return {
              "Visualizer Name": u.name,
              Role: u.roleName,
              Department: u.departmentName,
              "Total Tasks": userTasks.length,
              "Completed Tasks": completed,
              "Pending Tasks": pending,
              "Total Logged Hours": `${totalHours} hours`,
            };
          });

      case "project_hours":
        return filteredProjects.map((p) => {
          const totalHours = p.timeLogs.reduce((acc: number, curr: any) => acc + curr.hours, 0);
          const tasksCount = p.tasks.length;
          return {
            "Project Name": p.name,
            Client: p.clientName,
            "Total Tasks": tasksCount,
            "Estimated Scope": `${p.tasks.reduce((a: number, c: any) => a + c.estimatedHours, 0)}h`,
            "Actual Time Logged": `${totalHours} hours`,
            Status: p.status,
          };
        });

      case "dept_workload":
        const depts = ["2D LED", "3D LED"];
        return depts.map((d) => {
          const deptTasks = tasks.filter((t) => t.departmentName === d);
          const active = deptTasks.filter((t) => t.status !== "Completed").length;
          const completed = deptTasks.filter((t) => t.status === "Completed").length;
          const totalHours = deptTasks.reduce((acc, curr) => acc + curr.actualHours, 0);

          return {
            Department: d,
            "Total Tasks assigned": deptTasks.length,
            "Active workload": active,
            "Completed Tasks": completed,
            "Cumulative actual Effort": `${totalHours}h`,
          };
        });

      case "pending_tasks":
        return filteredTasks
          .filter((t) => t.status !== "Completed")
          .map((t) => ({
            "Task Title": t.title,
            "Project Reference": t.project.name,
            "Assigned Visualizer": t.assignedUser.name,
            "Due Date": new Date(t.dueDate).toLocaleDateString(),
            Priority: t.priority,
            Status: t.status,
          }));

      case "completed_projects":
        return filteredProjects
          .filter((p) => p.status === "Completed" || p.status === "Delivered")
          .map((p) => ({
            "Project Name": p.name,
            Client: p.clientName,
            "Brief Intake Date": new Date(p.briefReceivedDate).toLocaleDateString(),
            "Delivery Date": new Date(p.deadline).toLocaleDateString(),
            "Total Logged Hours": `${p.timeLogs.reduce((a: number, c: any) => a + c.hours, 0)}h`,
            "BD Representative": p.bdSource?.bd_member_name || "N/A",
          }));

      case "bd_projects":
        return filteredProjects.map((p) => ({
          "Project Name": p.name,
          Client: p.clientName,
          "BD Representative": p.bdSource?.bd_member_name || "N/A",
          "Brief received Date": new Date(p.briefReceivedDate).toLocaleDateString(),
          "Brief status": p.bdSource?.brief_status || "N/A",
          "Project intake Source": p.bdSource?.project_source || "N/A",
          "Project status": p.status,
        }));

      case "brief_pending":
        return filteredProjects
          .filter((p) => p.bdSource && p.bdSource.brief_status === "Need Clarification")
          .map((p) => ({
            "Project Name": p.name,
            Client: p.clientName,
            "BD Representative": p.bdSource.bd_member_name,
            "Intake Date": new Date(p.briefReceivedDate).toLocaleDateString(),
            "BD notes": p.bdSource.bd_notes || "N/A",
          }));

      default:
        return [];
    }
  }, [selectedReport, filteredProjects, filteredTasks, tasks, users]);

  // Export to CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast("No report data available to export", "warning");
      return;
    }

    try {
      const headers = Object.keys(reportData[0]);
      const csvRows = [];

      // Add Headers Row
      csvRows.push(headers.join(","));

      // Add Data Rows
      reportData.forEach((row) => {
        const values = headers.map((header) => {
          const val = (row as any)[header];
          // Escape quotes and commas
          const escaped = ("" + val).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ims_report_${selectedReport}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast("CSV Report exported successfully", "success");
    } catch (e) {
      toast("Failed to export report", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Studio Reports & Exports</h2>
          <p className="text-sm text-studio-gray-text">
            Export monthly project performance summaries, visualizer effort metrics, and BD brief logs.
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2 bg-[#111111] hover:bg-black text-white">
          <Download className="w-4 h-4 text-studio-red" /> Export to CSV (Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Report types */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4 border-b border-studio-gray-border">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-studio-red" /> Select Report Type
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1">
            {reportsList.map((item) => (
              <button
                key={item.type}
                onClick={() => setSelectedReport(item.type as any)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-bold transition-all ${
                  selectedReport === item.type
                    ? "bg-studio-red text-white shadow"
                    : "text-studio-gray-text hover:bg-studio-gray-bg hover:text-studio-black"
                }`}
              >
                {item.label}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Right Side: Filters and Tables */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters panel */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2 border-b border-studio-gray-border">
              <Filter className="w-4 h-4 text-studio-gray-text" />
              <CardTitle className="text-sm font-bold">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Conditional Filters depending on Report selected */}
              <div>
                <Label className="text-[10px] uppercase font-bold text-studio-gray-text">Intake Month</Label>
                <Select
                  options={[{ label: "All Months", value: "All" }, ...uniqueMonths.map(m => ({ label: m, value: m }))]}
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase font-bold text-studio-gray-text">Department involved</Label>
                <Select
                  options={[
                    { label: "All Departments", value: "All" },
                    { label: "2D LED Team", value: "2D LED" },
                    { label: "3D LED Team", value: "3D LED" },
                  ]}
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                />
              </div>

              {selectedReport.includes("task") ? (
                <>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-studio-gray-text">Project Reference</Label>
                    <Select
                      options={[{ label: "All Projects", value: "All" }, ...projects.map(p => ({ label: p.name, value: p.id }))]}
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-studio-gray-text">Assigned Visualizer</Label>
                    <Select
                      options={[{ label: "All Team Members", value: "All" }, ...users.filter(u => u.roleName !== "Admin").map(u => ({ label: u.name, value: u.id }))]}
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-studio-gray-text">Task Status</Label>
                    <Select
                      options={[{ label: "All Statuses", value: "All" }, ...["To Do", "In Progress", "Review", "Revision", "Completed"].map(s => ({ label: s, value: s }))]}
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-studio-gray-text">Client Search</Label>
                    <Input
                      placeholder="Type client name..."
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-studio-gray-text">Project status</Label>
                    <Select
                      options={[{ label: "All Statuses", value: "All" }, ...["Not Started", "In Progress", "On Hold", "Review", "Revision", "Completed", "Delivered", "Cancelled"].map(s => ({ label: s, value: s }))]}
                      value={projectStatusFilter}
                      onChange={(e) => setProjectStatusFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-studio-gray-text">BD Representative</Label>
                    <Select
                      options={[{ label: "All BD Reps", value: "All" }, ...uniqueBdNames.map(name => ({ label: name, value: name }))]}
                      value={bdFilter}
                      onChange={(e) => setBdFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-studio-gray-text">BD Brief Status</Label>
                    <Select
                      options={[
                        { label: "All Brief Statuses", value: "All" },
                        ...["Received", "Need Clarification", "Confirmed", "In Progress", "Revised Brief Received"].map(s => ({ label: s, value: s }))
                      ]}
                      value={briefStatusFilter}
                      onChange={(e) => setBriefStatusFilter(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results table */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-3 border-b border-studio-gray-border">
              <div>
                <CardTitle className="text-sm font-bold">Compiled Records</CardTitle>
                <CardDescription>Records matching selected report type and filters</CardDescription>
              </div>
              <Badge variant="outline">{reportData.length} records</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {reportData.length === 0 ? (
                <div className="text-center py-10 text-sm text-studio-gray-text">
                  No records compiled matching selection filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(reportData[0]).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row, idx) => {
                      const r = row as any;
                      return (
                        <TableRow key={idx}>
                          {Object.keys(row).map((header) => (
                            <TableCell key={header}>
                              {r[header]?.toString() === "Completed" || r[header]?.toString() === "Delivered" ? (
                                <Badge variant="green">{r[header]}</Badge>
                              ) : r[header]?.toString() === "Need Clarification" || r[header]?.toString() === "Review" || r[header]?.toString() === "Revision" ? (
                                <Badge variant="yellow">{r[header]}</Badge>
                              ) : r[header]?.toString() === "Urgent" || r[header]?.toString() === "Cancelled" ? (
                                <Badge variant="red">{r[header]}</Badge>
                              ) : (
                                r[header]
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
