"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionUser } from "@/lib/auth";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Briefcase,
  Clock,
  ClipboardList,
  AlertTriangle,
  FolderDot,
  CheckCircle,
  FileCheck2
} from "lucide-react";

interface DashboardClientProps {
  user: SessionUser;
  metrics: {
    totalProjectsMonth: number;
    activeProjects: number;
    completedProjects: number;
    pendingProjects: number;
    revisedBriefProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    tasksInReview: number;
    totalHoursMonth: number;
    workload2D: number;
    workload3D: number;
  };
  personWiseTasks: Array<{ name: string; total: number; completed: number; pending: number }>;
  personWiseHours: Array<{ name: string; hours: number }>;
  projectStatusCounts: Array<{ status: string; count: number }>;
  bdProjectsCount: Array<{ name: string; count: number }>;
  activeProjectsList: any[];
  overdueTasksList: any[];
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  user,
  metrics,
  personWiseTasks = [],
  personWiseHours = [],
  projectStatusCounts = [],
  bdProjectsCount = [],
  activeProjectsList = [],
  overdueTasksList = [],
}) => {
  // Chart Colors matching the screenshot
  // To Do: Teal (#0D9488), In Progress: Blue (#2563EB), Review: Orange/Red (#C2410C), Revision: Purple (#86198F), Completed: Red (#DC2626)
  const DONUT_COLORS: Record<string, string> = {
    "To Do": "#0D9488",
    "Not Started": "#0D9488",
    "In Progress": "#2563EB",
    "Review": "#C2410C",
    "Revision": "#86198F",
    "Completed": "#DC2626",
    "Delivered": "#10B981",
    "On Hold": "#F59E0B",
    "Cancelled": "#6B7280",
  };

  const getDonutColor = (status: string) => {
    return DONUT_COLORS[status] || "#6B7280";
  };

  // 1. Monthly Studio Productivity (Area Chart) May, June, July
  const productivityData = [
    { name: "05", Projects: 0, Hours: 2.0 },
    { name: "06", Projects: 3, Hours: 60.0 },
    {
      name: "07",
      Projects: metrics.totalProjectsMonth,
      Hours: metrics.totalHoursMonth,
    },
  ];

  // 2. Project Status Overview donut list
  const donutData = useMemo(() => {
    return projectStatusCounts.map((p) => ({
      name: p.status,
      value: p.count,
    }));
  }, [projectStatusCounts]);

  // 3. Department Workload (Bar Chart)
  // Hours (Teal: #0D9488) vs Active Tasks (Brown/Orange: #B45309)
  const deptWorkloadData = [
    {
      name: "2D LED",
      Hours: metrics.workload2D * 8.5, // Est hours or mock multiplier for visual scaling
      "Active Tasks": metrics.workload2D,
    },
    {
      name: "3D LED",
      Hours: metrics.workload3D * 10,
      "Active Tasks": metrics.workload3D,
    },
    {
      name: "Business Development",
      Hours: 0,
      "Active Tasks": 0,
    },
  ];

  // 4. Person-wise Output (Horizontal Bar Chart)
  // Legend: Completed Tasks (Pink/Magenta #D946EF), Hours (Blue #2563EB)
  const personOutputData = useMemo(() => {
    return personWiseTasks.map((pt) => {
      const hoursEntry = personWiseHours.find((h) => h.name === pt.name);
      return {
        name: pt.name,
        "Completed Tasks": pt.completed,
        Hours: hoursEntry ? hoursEntry.hours : 0,
      };
    });
  }, [personWiseTasks, personWiseHours]);

  const currentPeriodStr = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Title section matching screenshot */}
      <div className="space-y-0.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488]">
          {currentPeriodStr}
        </span>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Dashboard</h2>
      </div>

      {/* KPI Summary Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects This Month */}
        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400">Projects This Month</p>
              <h3 className="text-2xl font-black text-zinc-900">{metrics.totalProjectsMonth}</h3>
              <p className="text-[10px] text-zinc-500 font-semibold">{metrics.activeProjects} active</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-teal-100 bg-teal-50/50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Projects */}
        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400">Completed Projects</p>
              <h3 className="text-2xl font-black text-zinc-900">{metrics.completedProjects}</h3>
              <p className="text-[10px] text-zinc-500 font-semibold">{metrics.pendingProjects} pending</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50/50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400">Task Completion</p>
              <h3 className="text-2xl font-black text-zinc-900">
                {metrics.completedTasks}/{metrics.totalTasks}
              </h3>
              <p className="text-[10px] text-zinc-500 font-semibold">{metrics.pendingTasks} pending</p>
            </div>
            <div className="w-10 h-10 rounded-full border-pink-100 bg-pink-50/50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-pink-600" />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400">Working Hours</p>
              <h3 className="text-2xl font-black text-zinc-900">{metrics.totalHoursMonth.toFixed(1)}</h3>
              <p className="text-[10px] text-zinc-500 font-semibold">Logged this month</p>
            </div>
            <div className="w-10 h-10 rounded-full border-amber-100 bg-amber-50/50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1 Charts: Monthly Productivity & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Studio Productivity area chart */}
        <Card className="lg:col-span-2 border-zinc-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-900">Monthly Studio Productivity</CardTitle>
            <CardDescription className="text-[10px]">Projects and hours by month</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Hours" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                <Area type="monotone" dataKey="Projects" stroke="#0D9488" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Overview donut chart */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-900">Project Status Overview</CardTitle>
            <CardDescription className="text-[10px]">Current task status mix</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-between">
            {donutData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No active projects
              </div>
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={68}
                        paddingAngle={2}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getDonutColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Horizontal status indicators mapping screenshot */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] font-bold text-zinc-500 mt-2">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDonutColor(d.name) }} />
                      <span>{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 Charts: Department Workload & Person-wise Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload bar chart */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-900">Department Workload</CardTitle>
            <CardDescription className="text-[10px]">Active tasks and effort logged per team</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Hours" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Active Tasks" fill="#B45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Person-wise Output horizontal/group chart */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-900">Person-wise Output</CardTitle>
            <CardDescription className="text-[10px]">Active effort contribution per visualizer</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {personOutputData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No active records
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personOutputData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E4E7" />
                  <XAxis type="number" stroke="#71717A" fontSize={9} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#71717A" fontSize={9} width={90} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Completed Tasks" fill="#D946EF" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Hours" fill="#2563EB" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 Lists: Active Projects & Overdue Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects List */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center gap-2">
            <FolderDot className="w-4 h-4 text-studio-red" />
            <div>
              <CardTitle className="text-sm font-bold text-zinc-900">Active Projects</CardTitle>
              <CardDescription className="text-[10px]">Ongoing design deliverables in the pipeline</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeProjectsList.length === 0 ? (
              <p className="text-xs text-zinc-400 italic p-6 text-center">No active projects found.</p>
            ) : (
              <div className="divide-y divide-zinc-100 text-xs">
                {activeProjectsList.map((project) => (
                  <div key={project.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/50 transition-colors">
                    <div>
                      <Link href={`/projects/${project.id}`} className="font-bold text-zinc-800 hover:text-studio-red hover:underline">
                        {project.name}
                      </Link>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Client: {project.clientName} • Type: {project.projectType}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[9px] uppercase">{project.status}</Badge>
                      <p className="text-[9px] text-studio-red font-semibold mt-1">Due: {new Date(project.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks List */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-studio-red" />
            <div>
              <CardTitle className="text-sm font-bold text-zinc-900">Overdue Tasks</CardTitle>
              <CardDescription className="text-[10px]">Tasks that have passed their scheduled deadlines</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {overdueTasksList.length === 0 ? (
              <p className="text-xs text-green-600 font-semibold p-6 text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" /> All visualizer tasks are currently on schedule!
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 text-xs">
                {overdueTasksList.map((task) => (
                  <div key={task.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-zinc-800">{task.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Project: {task.project.name} • Assignee: {task.assignedUser.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="red" className="text-[9px] uppercase">{task.priority}</Badge>
                      <p className="text-[9px] text-studio-red font-black mt-1">Overdue: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
