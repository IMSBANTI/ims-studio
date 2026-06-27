"use server";

import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCommentAction(data: {
  content: string;
  projectId?: string;
  taskId?: string;
}) {
  try {
    const user = getSession();
    if (!user) {
      return { error: "Unauthenticated" };
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        userId: user.id,
      },
    });

    if (data.projectId) {
      revalidatePath(`/projects/${data.projectId}`);
    }
    if (data.taskId) {
      revalidatePath("/tasks");
    }
    return { success: true, commentId: comment.id };
  } catch (error: any) {
    console.error("Create comment error: ", error);
    return { error: error?.message || "Failed to create comment" };
  }
}
