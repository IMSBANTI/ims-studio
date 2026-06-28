import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ProjectDetailsClient } from "@/components/project-details-client";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const user = getSession();
  if (!user) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
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
        orderBy: {
          dueDate: "asc",
        },
      },
      comments: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      timeLogs: {
        include: {
          user: true,
          task: true,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Load active users in case we need to assign them to tasks
  const activeUsers = await prisma.user.findMany({
    where: {
      status: "Active",
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <ProjectDetailsClient
      currentUser={user!}
      project={project}
      activeUsers={activeUsers}
    />
  );
}
