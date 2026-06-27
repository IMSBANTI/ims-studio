import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { TeamClient } from "@/components/team-client";

export default async function TeamPage() {
  const currentUser = getSession();
  if (!currentUser) {
    return null;
  }

  // Load all users
  const users = await prisma.user.findMany({
    include: {
      projects: {
        include: {
          project: true,
        },
      },
      tasks: true,
      timeLogs: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch roles & departments for assigning
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  });

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  // Calculate monthly stats for team display
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const teamData = users.map((user) => {
    // 1. Active assigned projects count
    const activeProjects = user.projects.filter((p) => {
      const status = p.project.status;
      return status !== "Completed" && status !== "Cancelled";
    });

    // 2. Tasks completed this month
    const monthlyTasks = user.tasks.filter((t) => {
      if (t.status !== "Completed" || !t.completionDate) return false;
      const completedDate = new Date(t.completionDate);
      return completedDate >= startOfMonth;
    }).length;

    // 3. Hours logged this month
    const monthlyHours = user.timeLogs
      .filter((l) => new Date(l.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.hours, 0);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "N/A",
      roleName: user.roleName,
      departmentName: user.departmentName,
      status: user.status,
      skillTags: user.skillTags,
      activeProjectsCount: activeProjects.length,
      monthlyCompletedTasks: monthlyTasks,
      monthlyWorkingHours: monthlyHours,
    };
  });

  return (
    <TeamClient
      currentUser={currentUser!}
      team={teamData}
      roles={roles}
      departments={departments}
    />
  );
}
