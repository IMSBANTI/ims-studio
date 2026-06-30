"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createSubmissionAction(data: {
  title: string;
  clientName: string;
  eventName: string;
  eventDate?: string;
  submissionDate: string;
  status: string;
  lossReason?: string;
  reusabilityScore?: string;
  notes?: string;
  presentationUrl?: string;
  attachmentUrl?: string;
  budget?: number;
  reusableTags: string;
  bdRepId: string;
  projectIds?: string[];
}) {
  try {
    const eDate = data.eventDate ? new Date(data.eventDate) : null;
    const sDate = new Date(data.submissionDate);

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        title: data.title,
        clientName: data.clientName,
        eventName: data.eventName,
        eventDate: eDate,
        submissionDate: sDate,
        status: data.status,
        lossReason: data.lossReason || null,
        reusabilityScore: data.reusabilityScore || null,
        notes: data.notes || null,
        presentationUrl: data.presentationUrl || null,
        attachmentUrl: data.attachmentUrl || null,
        budget: data.budget ? parseFloat(data.budget.toString()) : null,
        reusableTags: data.reusableTags || "",
        bdRepId: data.bdRepId,
      },
    });

    // Link projects
    if (data.projectIds && data.projectIds.length > 0) {
      await prisma.project.updateMany({
        where: { id: { in: data.projectIds } },
        data: { submissionId: submission.id },
      });
    }

    revalidatePath("/business-development");
    revalidatePath("/projects");
    revalidatePath("/");
    return { success: true, submissionId: submission.id };
  } catch (error: any) {
    console.error("Create submission error:", error);
    return { error: error?.message || "Failed to create submission" };
  }
}

export async function updateSubmissionAction(
  id: string,
  data: {
    title: string;
    clientName: string;
    eventName: string;
    eventDate?: string;
    submissionDate: string;
    status: string;
    lossReason?: string;
    reusabilityScore?: string;
    notes?: string;
    presentationUrl?: string;
    attachmentUrl?: string;
    budget?: number;
    reusableTags: string;
    bdRepId: string;
    projectIds?: string[];
  }
) {
  try {
    const eDate = data.eventDate ? new Date(data.eventDate) : null;
    const sDate = new Date(data.submissionDate);

    // Update submission details
    await prisma.submission.update({
      where: { id },
      data: {
        title: data.title,
        clientName: data.clientName,
        eventName: data.eventName,
        eventDate: eDate,
        submissionDate: sDate,
        status: data.status,
        lossReason: data.lossReason || null,
        reusabilityScore: data.reusabilityScore || null,
        notes: data.notes || null,
        presentationUrl: data.presentationUrl || null,
        attachmentUrl: data.attachmentUrl || null,
        budget: data.budget ? parseFloat(data.budget.toString()) : null,
        reusableTags: data.reusableTags || "",
        bdRepId: data.bdRepId,
      },
    });

    // Reset old project links
    await prisma.project.updateMany({
      where: { submissionId: id },
      data: { submissionId: null },
    });

    // Link newly selected projects
    if (data.projectIds && data.projectIds.length > 0) {
      await prisma.project.updateMany({
        where: { id: { in: data.projectIds } },
        data: { submissionId: id },
      });
    }

    revalidatePath("/business-development");
    revalidatePath("/projects");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update submission error:", error);
    return { error: error?.message || "Failed to update submission" };
  }
}

export async function updateSubmissionStatusAction(
  id: string,
  data: {
    status: string;
    lossReason?: string;
    reusabilityScore?: string;
    notes?: string;
    reusableTags?: string;
  }
) {
  try {
    await prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        lossReason: data.lossReason || null,
        reusabilityScore: data.reusabilityScore || null,
        notes: data.notes || null,
        reusableTags: data.reusableTags !== undefined ? data.reusableTags : undefined,
      },
    });

    revalidatePath("/business-development");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update submission status error:", error);
    return { error: error?.message || "Failed to update submission outcome" };
  }
}

export async function deleteSubmissionAction(id: string) {
  try {
    await prisma.submission.delete({
      where: { id },
    });
    revalidatePath("/business-development");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete submission error:", error);
    return { error: error?.message || "Failed to delete submission" };
  }
}

export async function cloneSubmissionAction(
  id: string,
  data: {
    title: string;
    clientName: string;
    eventName: string;
    submissionDate: string;
    eventDate?: string;
    cloneProjects: boolean;
  }
) {
  try {
    // 1. Get original submission
    const original = await prisma.submission.findUnique({
      where: { id },
      include: { projects: true },
    });

    if (!original) {
      return { error: "Original submission not found" };
    }

    const newEventDate = data.eventDate ? new Date(data.eventDate) : (original.eventDate ? new Date(original.eventDate) : null);
    const newSubmissionDate = new Date(data.submissionDate);

    // 2. Create cloned submission
    const clonedSubmission = await prisma.submission.create({
      data: {
        title: data.title,
        clientName: data.clientName,
        eventName: data.eventName,
        eventDate: newEventDate,
        submissionDate: newSubmissionDate,
        status: "Draft", // Cloned pitches start as Draft
        reusabilityScore: original.reusabilityScore,
        notes: `Cloned from submission: ${original.title}. Original notes: ${original.notes || ""}`,
        presentationUrl: original.presentationUrl,
        attachmentUrl: original.attachmentUrl,
        budget: original.budget,
        reusableTags: original.reusableTags,
        bdRepId: original.bdRepId,
      },
    });

    // 3. Clone projects if requested
    if (data.cloneProjects && original.projects.length > 0) {
      for (const proj of original.projects) {
        // Clone project
        const clonedProject = await prisma.project.create({
          data: {
            name: `${proj.name} (Cloned)`,
            clientName: data.clientName,
            briefReceivedDate: new Date(),
            projectSource: "Business Development Team",
            briefStatus: "Received",
            projectType: proj.projectType,
            departmentInvolved: proj.departmentInvolved,
            startDate: new Date(),
            deadline: newEventDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from now if no event date
            priority: proj.priority,
            status: "Not Started", // Cloned projects start fresh
            projectBrief: proj.projectBrief,
            notes: `Cloned for new submission: ${data.title}. Original project: ${proj.name}`,
            originalBriefUrl: proj.originalBriefUrl,
            referenceLink: proj.referenceLink,
            budget: proj.budget,
            submissionId: clonedSubmission.id,
            managerId: proj.managerId,
          },
        });

        // Copy project members
        const originalMembers = await prisma.projectMember.findMany({
          where: { projectId: proj.id },
        });

        if (originalMembers.length > 0) {
          await prisma.projectMember.createMany({
            data: originalMembers.map((m) => ({
              projectId: clonedProject.id,
              userId: m.userId,
            })),
          });
        }
      }
    } else if (!data.cloneProjects && original.projects.length > 0) {
      // Just link the same projects (not recommended, but supported if they don't check clone)
      // Usually they want to clone projects because it's a new pitch, but let's support it
      await prisma.project.updateMany({
        where: { id: { in: original.projects.map(p => p.id) } },
        data: { submissionId: clonedSubmission.id },
      });
    }

    revalidatePath("/business-development");
    revalidatePath("/projects");
    revalidatePath("/");
    return { success: true, submissionId: clonedSubmission.id };
  } catch (error: any) {
    console.error("Clone submission error:", error);
    return { error: error?.message || "Failed to clone submission" };
  }
}
