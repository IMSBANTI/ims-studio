import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SettingsClient } from "@/components/settings-client";

export default async function SettingsPage() {
  const user = getSession();
  if (!user) {
    return null;
  }

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  });

  const projectTypes = await prisma.projectType.findMany({
    orderBy: { name: "asc" },
  });

  const taskStatuses = await prisma.taskStatus.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <SettingsClient
      currentUser={user!}
      departments={departments}
      roles={roles}
      projectTypes={projectTypes}
      taskStatuses={taskStatuses}
    />
  );
}
