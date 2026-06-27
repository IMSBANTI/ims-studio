import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const user = getSession();
  if (!user) {
    return null;
  }

  // Get current date boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Projects metrics
  const totalProjectsMonth = await prisma.project.count({
    where: {
      briefReceivedDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const activeProjects = await prisma.project.count({
    where: {
      status: {
        in: ["Not Started", "In Progress", "Review", "Revision"],
      },
    },
  });

  const completedProjects = await prisma.project.count({
    where: {
      status: {
        in: ["Completed", "Delivered"],
      },
    },
  });

  const pendingProjects = await prisma.project.count({
    where: {
      status: "Not Started",
    },
  });

  const revisedBriefProjects = await prisma.project.count({
    where: {
      briefStatus: "Revised Brief Received",
    },
  });

  // 2. Tasks metrics
  const totalTasks = await prisma.task.count();
  
  const completedTasks = await prisma.task.count({
    where: { status: "Completed" },
  });

  const pendingTasks = await prisma.task.count({
    where: {
      status: {
        in: ["To Do", "In Progress", "Revision"],
      },
    },
  });

  const tasksInReview = await prisma.task.count({
    where: { status: "Review" },
  });

  // 3. Time log metrics
  const timeLogsMonth = await prisma.timeLog.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: { hours: true },
  });
  const totalHoursMonth = timeLogsMonth.reduce((acc, curr) => acc + curr.hours, 0);

  // 4. Team Workload (Active tasks assigned to members of each department)
  const taskDepartmentCounts = await prisma.task.groupBy({
    by: ["departmentName"],
    where: {
      status: {
        not: "Completed",
      },
    },
    _count: {
      id: true,
    },
  });

  const workload2D = taskDepartmentCounts.find((t) => t.departmentName === "2D LED")?._count.id || 0;
  const workload3D = taskDepartmentCounts.find((t) => t.departmentName === "3D LED")?._count.id || 0;

  // 5. Person-wise tasks (Count of total and completed tasks for each active team member)
  const teamMembers = await prisma.user.findMany({
    where: {
      roleName: {
        not: "Admin",
      },
      status: "Active",
    },
    include: {
      tasks: true,
    },
  });

  const personWiseTasks = teamMembers.map((member) => {
    const total = member.tasks.length;
    const completed = member.tasks.filter((t) => t.status === "Completed").length;
    return {
      name: member.name,
      total,
      completed,
      pending: total - completed,
    };
  });

  // 6. Person-wise working hours for current month
  const timeLogsWithUsers = await prisma.timeLog.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      user: true,
    },
  });

  const hoursMap: Record<string, number> = {};
  timeLogsWithUsers.forEach((log) => {
    if (log.user.roleName !== "Admin") {
      hoursMap[log.user.name] = (hoursMap[log.user.name] || 0) + log.hours;
    }
  });

  const personWiseHours = Object.keys(hoursMap).map((name) => ({
    name,
    hours: hoursMap[name],
  }));

  // Ensure members with 0 hours are also visible in chart/list
  teamMembers.forEach((member) => {
    if (!hoursMap[member.name] && member.roleName !== "BD Representative") {
      personWiseHours.push({ name: member.name, hours: 0 });
    }
  });

  // 7. Project status distribution
  const projectStatuses = await prisma.project.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  const projectStatusCounts = projectStatuses.map((p) => ({
    status: p.status,
    count: p._count.id,
  }));

  // 8. BD team member-wise project counts
  const bdSources = await prisma.businessDevelopmentSource.groupBy({
    by: ["bd_member_name"],
    _count: {
      id: true,
    },
  });

  const bdProjectsCount = bdSources.map((bd) => ({
    name: bd.bd_member_name,
    count: bd._count.id,
  }));

  const metrics = {
    totalProjectsMonth,
    activeProjects,
    completedProjects,
    pendingProjects,
    revisedBriefProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    tasksInReview,
    totalHoursMonth,
    workload2D,
    workload3D,
  };

  // Load active projects and overdue tasks for footer lists matching the screenshot
  const activeProjectsList = await prisma.project.findMany({
    where: {
      status: {
        in: ["Not Started", "In Progress", "Review", "Revision"],
      },
    },
    orderBy: {
      deadline: "asc",
    },
    take: 5,
  });

  const overdueTasksList = await prisma.task.findMany({
    where: {
      dueDate: {
        lt: now,
      },
      status: {
        not: "Completed",
      },
    },
    include: {
      project: {
        select: {
          name: true,
        },
      },
      assignedUser: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
  });

  return (
    <DashboardClient
      user={user!}
      metrics={metrics}
      personWiseTasks={personWiseTasks}
      personWiseHours={personWiseHours}
      projectStatusCounts={projectStatusCounts}
      bdProjectsCount={bdProjectsCount}
      activeProjectsList={activeProjectsList}
      overdueTasksList={overdueTasksList}
    />
  );
}
