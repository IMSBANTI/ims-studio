import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CalendarClient } from "@/components/calendar-client";

export default async function CalendarPage() {
  const user = getSession();
  if (!user) {
    return null;
  }

  // Load projects deadlines and brief dates
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      clientName: true,
      briefReceivedDate: true,
      deadline: true,
      status: true,
    },
  });

  // Load tasks deadlines and statuses
  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      priority: true,
      projectId: true,
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <CalendarClient
      currentUser={user!}
      projects={projects}
      tasks={tasks}
    />
  );
}
