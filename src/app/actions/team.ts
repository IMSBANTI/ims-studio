"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTeamMemberAction(data: {
  name: string;
  email: string;
  phone?: string;
  roleName: string;
  departmentName: string;
  skillTags: string;
  status: string;
}) {
  try {
    // Check if user email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return { error: "A user with this email address already exists" };
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        roleName: data.roleName,
        departmentName: data.departmentName,
        skillTags: data.skillTags,
        status: data.status,
        password: "password123", // Default password for new members
      },
    });

    revalidatePath("/team");
    revalidatePath("/");
    return { success: true, userId: newUser.id };
  } catch (error: any) {
    console.error("Create team member error: ", error);
    return { error: error?.message || "Failed to add team member" };
  }
}

export async function updateTeamMemberAction(
  id: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    roleName: string;
    departmentName: string;
    skillTags: string;
    status: string;
  }
) {
  try {
    // Check if email belongs to someone else
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        id: { not: id },
      },
    });
    if (existing) {
      return { error: "Another user with this email address already exists" };
    }

    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        roleName: data.roleName,
        departmentName: data.departmentName,
        skillTags: data.skillTags,
        status: data.status,
      },
    });

    revalidatePath("/team");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update team member error: ", error);
    return { error: error?.message || "Failed to update team member" };
  }
}

export async function deleteTeamMemberAction(id: string) {
  try {
    const timeLogsCount = await prisma.timeLog.count({ where: { userId: id } });
    const tasksCount = await prisma.task.count({ where: { assignedUserId: id } });
    const commentsCount = await prisma.comment.count({ where: { userId: id } });

    if (timeLogsCount > 0 || tasksCount > 0 || commentsCount > 0) {
      return {
        error: "This team member has logged hours, tasks, or comments in the system and cannot be permanently deleted. Please deactivate their account instead to keep records intact.",
      };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/team");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete team member error: ", error);
    return { error: error?.message || "Failed to delete team member" };
  }
}
