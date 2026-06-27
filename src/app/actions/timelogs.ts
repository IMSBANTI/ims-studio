"use server";

import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTimeLogAction(data: {
  date: string;
  projectId: string;
  taskId: string;
  hours: number;
  workNote: string;
  statusUpdate: string;
}) {
  try {
    const user = getSession();
    if (!user) {
      return { error: "Unauthenticated" };
    }

    const logDate = new Date(data.date);

    // Create the time log
    const log = await prisma.timeLog.create({
      data: {
        date: logDate,
        projectId: data.projectId,
        taskId: data.taskId,
        userId: user.id,
        hours: Number(data.hours),
        workNote: data.workNote,
        statusUpdate: data.statusUpdate,
      },
    });

    // Update the task actual hours and status
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
    });

    if (task) {
      const newActualHours = task.actualHours + Number(data.hours);
      
      const updateData: any = {
        actualHours: newActualHours,
        status: data.statusUpdate,
      };

      if (data.statusUpdate === "Completed") {
        updateData.completionDate = new Date();
      }

      await prisma.task.update({
        where: { id: data.taskId },
        data: updateData,
      });

      // Add a status change note as comment
      await prisma.comment.create({
        data: {
          content: `${user.name} logged ${data.hours} hours and updated status to "${data.statusUpdate}". Note: "${data.workNote}"`,
          projectId: data.projectId,
          taskId: data.taskId,
          userId: user.id,
        },
      });
    }

    revalidatePath("/time-logs");
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true, logId: log.id };
  } catch (error: any) {
    console.error("Create time log error: ", error);
    return { error: error?.message || "Failed to log working hours" };
  }
}
