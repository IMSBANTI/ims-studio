import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ProjectsClient } from "@/components/projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
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
      tasks: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Load all users to populate managers & members lists
  const users = await prisma.user.findMany({
    where: {
      status: "Active",
    },
    orderBy: {
      name: "asc",
    },
  });

  // Load database metadata for dropdowns
  const projectTypes = await prisma.projectType.findMany({
    orderBy: { name: "asc" },
  });

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  // Get list of BD names from current project BD sources to filter by
  const bdMembers = await prisma.businessDevelopmentSource.groupBy({
    by: ["bd_member_name"],
  });
  const bdFilterNames = bdMembers.map((bd) => bd.bd_member_name);

  return (
    <ProjectsClient
      currentUser={user!}
      projects={projects}
      users={users}
      projectTypes={projectTypes}
      departments={departments}
      bdFilterNames={bdFilterNames}
    />
  );
}
