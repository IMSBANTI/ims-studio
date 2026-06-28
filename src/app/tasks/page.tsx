import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { TasksClient } from "@/components/tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = getSession();
  if (!user) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    include: {
      assignedUser: true,
      project: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const users = await prisma.user.findMany({
    where: { status: "Active" },
    orderBy: { name: "asc" },
  });

  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <TasksClient
      currentUser={user!}
      tasks={tasks}
      users={users}
      projects={projects}
    />
  );
}
