import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { TimeLogsClient } from "@/components/time-logs-client";

export const dynamic = "force-dynamic";

export default async function TimeLogsPage() {
  const user = getSession();
  if (!user) {
    return null;
  }

  // Load all logs with relations
  const timeLogs = await prisma.timeLog.findMany({
    include: {
      project: true,
      task: true,
      user: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Load projects to select from when logging hours
  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        where: {
          assignedUserId: user!.id,
          status: { not: "Completed" },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Load active tasks for current user to log time against
  const userTasks = await prisma.task.findMany({
    where: {
      assignedUserId: user!.id,
      status: {
        not: "Completed",
      },
    },
    include: {
      project: true,
    },
  });

  // If Admin or Manager, load ALL active tasks
  const allTasks = await prisma.task.findMany({
    where: {
      status: { not: "Completed" },
    },
    include: {
      project: true,
    },
  });

  return (
    <TimeLogsClient
      currentUser={user!}
      timeLogs={timeLogs}
      projects={projects}
      tasks={user!.roleName === "Admin" || user!.roleName.includes("Manager") ? allTasks : userTasks}
    />
  );
}
