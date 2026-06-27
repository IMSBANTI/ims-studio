"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createDepartmentAction(name: string) {
  try {
    const existing = await prisma.department.findUnique({
      where: { name },
    });
    if (existing) {
      return { error: "Department already exists" };
    }

    await prisma.department.create({
      data: { name },
    });

    revalidatePath("/settings");
    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    console.error("Create dept error: ", error);
    return { error: error?.message || "Failed to create department" };
  }
}

export async function createRoleAction(name: string, departmentName?: string) {
  try {
    const existing = await prisma.role.findUnique({
      where: { name },
    });
    if (existing) {
      return { error: "Role already exists" };
    }

    await prisma.role.create({
      data: { name, departmentName },
    });

    revalidatePath("/settings");
    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    console.error("Create role error: ", error);
    return { error: error?.message || "Failed to create role" };
  }
}

export async function createProjectTypeAction(name: string) {
  try {
    const existing = await prisma.projectType.findUnique({
      where: { name },
    });
    if (existing) {
      return { error: "Project type already exists" };
    }

    await prisma.projectType.create({
      data: { name },
    });

    revalidatePath("/settings");
    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    console.error("Create project type error: ", error);
    return { error: error?.message || "Failed to create project type" };
  }
}

export async function updateProfileAction(data: {
  name: string;
  email: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    const { cookies } = await import("next/headers");
    const { getSession } = await import("@/lib/auth");
    
    const session = getSession();
    if (!session) {
      return { error: "Unauthenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if new email is already taken
    if (data.email !== user.email) {
      const emailCheck = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailCheck) {
        return { error: "Email is already taken by another user" };
      }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
    };

    if (data.currentPassword && data.newPassword) {
      if (user.password !== data.currentPassword) {
        return { error: "Incorrect current password" };
      }
      updateData.password = data.newPassword;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Update the session cookie
    const updatedSession = {
      id: user.id,
      email: data.email,
      name: data.name,
      roleName: user.roleName,
      departmentName: user.departmentName,
    };

    const serialized = Buffer.from(JSON.stringify(updatedSession)).toString("base64");
    
    cookies().set("ims_session", serialized, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    revalidatePath("/settings");
    revalidatePath("/team");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update profile error: ", error);
    return { error: error?.message || "Failed to update profile" };
  }
}

