import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReportsClient } from "@/components/reports-client";

export default async function ReportsPage() {
  const user = getSession();
  if (!user) {
    return null;
  }

  // Load all projects with relations
  const projects = await prisma.project.findMany({
    include: {
      manager: true,
      bdSource: true,
      members: {
        include: {
          user: true,
        },
      },
      tasks: {
        include: {
          assignedUser: true,
        },
      },
      timeLogs: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Load all tasks for general task reports
  const tasks = await prisma.task.findMany({
    include: {
      project: true,
      assignedUser: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Load all users
  const users = await prisma.user.findMany({
    where: { status: "Active" },
    orderBy: { name: "asc" },
  });

  return (
    <ReportsClient
      currentUser={user!}
      projects={projects}
      tasks={tasks}
      users={users}
    />
  );
}
