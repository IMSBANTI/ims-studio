"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTaskAction(data: {
  title: string;
  description: string;
  assignedUserId: string;
  departmentName: string;
  projectId: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  priority: string;
  status: string;
  notes?: string;
  attachmentUrl?: string;
}) {
  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedUserId: data.assignedUserId,
        departmentName: data.departmentName,
        projectId: data.projectId,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        estimatedHours: Number(data.estimatedHours),
        actualHours: 0.0,
        priority: data.priority,
        status: data.status,
        notes: data.notes,
        attachmentUrl: data.attachmentUrl,
      },
    });

    // Create a notification for the assigned user
    await prisma.notification.create({
      data: {
        title: "New Task Assigned",
        content: `You have been assigned a new task: "${data.title}" under Project: "${(await prisma.project.findUnique({ where: { id: data.projectId } }))?.name || ""}"`,
        type: "TaskAssigned",
        userId: data.assignedUserId,
      },
    });

    revalidatePath("/tasks");
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath("/");
    return { success: true, taskId: task.id };
  } catch (error: any) {
    console.error("Create task error: ", error);
    return { error: error?.message || "Failed to create task" };
  }
}

export async function updateTaskAction(
  id: string,
  data: {
    title: string;
    description: string;
    assignedUserId: string;
    departmentName: string;
    projectId: string;
    startDate: string;
    dueDate: string;
    estimatedHours: number;
    priority: string;
    status: string;
    notes?: string;
    attachmentUrl?: string;
  }
) {
  try {
    const originalTask = await prisma.task.findUnique({ where: { id } });
    
    const updateData: any = {
      title: data.title,
      description: data.description,
      assignedUserId: data.assignedUserId,
      departmentName: data.departmentName,
      startDate: new Date(data.startDate),
      dueDate: new Date(data.dueDate),
      estimatedHours: Number(data.estimatedHours),
      priority: data.priority,
      status: data.status,
      notes: data.notes,
      attachmentUrl: data.attachmentUrl,
    };

    if (data.status === "Completed") {
      updateData.completionDate = new Date();
    } else {
      updateData.completionDate = null;
    }

    await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Check notifications logic
    if (data.status === "Revision" && originalTask?.status !== "Revision") {
      await prisma.notification.create({
        data: {
          title: "Task Marked for Revision",
          content: `Your task "${data.title}" has been marked for revision.`,
          type: "TaskRevision",
          userId: data.assignedUserId,
        },
      });
    }

    revalidatePath("/tasks");
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update task error: ", error);
    return { error: error?.message || "Failed to update task" };
  }
}

export async function deleteTaskAction(id: string, projectId: string) {
  try {
    await prisma.task.delete({
      where: { id },
    });
    revalidatePath("/tasks");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete task error: ", error);
    return { error: error?.message || "Failed to delete task" };
  }
}
