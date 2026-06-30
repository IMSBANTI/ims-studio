"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createProjectAction(data: {
  name: string;
  clientName: string;
  briefReceivedDate: string;
  projectSource: string;
  briefStatus: string;
  projectType: string;
  departmentInvolved: string;
  startDate: string;
  deadline: string;
  priority: string;
  status: string;
  projectBrief: string;
  managerId: string;
  notes?: string;
  originalBriefUrl?: string;
  referenceLink?: string;
  bdMemberName: string;
  bdMemberEmail: string;
  bdNotes?: string;
  memberIds: string[];
  budget?: number;
  actualCost?: number;
}) {
  try {
    const briefDate = new Date(data.briefReceivedDate);
    const sDate = new Date(data.startDate);
    const dLine = new Date(data.deadline);

    // Create the project in database
    const project = await prisma.project.create({
      data: {
        name: data.name,
        clientName: data.clientName,
        briefReceivedDate: briefDate,
        projectSource: data.projectSource,
        briefStatus: data.briefStatus,
        projectType: data.projectType,
        departmentInvolved: data.departmentInvolved,
        startDate: sDate,
        deadline: dLine,
        priority: data.priority,
        status: data.status,
        projectBrief: data.projectBrief,
        notes: data.notes,
        originalBriefUrl: data.originalBriefUrl,
        referenceLink: data.referenceLink,
        managerId: data.managerId || null,
        budget: data.budget ? parseFloat(data.budget.toString()) : null,
        actualCost: data.actualCost ? parseFloat(data.actualCost.toString()) : null,
      },
    });

    // Create BD brief source entry
    await prisma.businessDevelopmentSource.create({
      data: {
        project_id: project.id,
        bd_member_name: data.bdMemberName,
        bd_member_email: data.bdMemberEmail,
        brief_received_date: briefDate,
        brief_status: data.briefStatus,
        project_source: data.projectSource,
        bd_notes: data.bdNotes,
        brief_attachment_url: data.originalBriefUrl,
      },
    });

    // Assign project members
    if (data.memberIds && data.memberIds.length > 0) {
      await prisma.projectMember.createMany({
        data: data.memberIds.map((userId) => ({
          projectId: project.id,
          userId,
        })),
      });
    }

    revalidatePath("/projects");
    revalidatePath("/");
    return { success: true, projectId: project.id };
  } catch (error: any) {
    console.error("Create project error: ", error);
    return { error: error?.message || "Failed to create project" };
  }
}

export async function updateProjectAction(
  id: string,
  data: {
    name: string;
    clientName: string;
    briefReceivedDate: string;
    projectSource: string;
    briefStatus: string;
    projectType: string;
    departmentInvolved: string;
    startDate: string;
    deadline: string;
    priority: string;
    status: string;
    projectBrief: string;
    managerId: string;
    notes?: string;
    originalBriefUrl?: string;
    referenceLink?: string;
    bdMemberName: string;
    bdMemberEmail: string;
    bdNotes?: string;
    memberIds: string[];
    budget?: number;
    actualCost?: number;
  }
) {
  try {
    const briefDate = new Date(data.briefReceivedDate);
    const sDate = new Date(data.startDate);
    const dLine = new Date(data.deadline);

    // Update project metadata
    await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        clientName: data.clientName,
        briefReceivedDate: briefDate,
        projectSource: data.projectSource,
        briefStatus: data.briefStatus,
        projectType: data.projectType,
        departmentInvolved: data.departmentInvolved,
        startDate: sDate,
        deadline: dLine,
        priority: data.priority,
        status: data.status,
        projectBrief: data.projectBrief,
        notes: data.notes,
        originalBriefUrl: data.originalBriefUrl,
        referenceLink: data.referenceLink,
        managerId: data.managerId || null,
        budget: data.budget ? parseFloat(data.budget.toString()) : null,
        actualCost: data.actualCost ? parseFloat(data.actualCost.toString()) : null,
      },
    });

    // Update or create BD source info
    await prisma.businessDevelopmentSource.upsert({
      where: { project_id: id },
      create: {
        project_id: id,
        bd_member_name: data.bdMemberName,
        bd_member_email: data.bdMemberEmail,
        brief_received_date: briefDate,
        brief_status: data.briefStatus,
        project_source: data.projectSource,
        bd_notes: data.bdNotes,
        brief_attachment_url: data.originalBriefUrl,
      },
      update: {
        bd_member_name: data.bdMemberName,
        bd_member_email: data.bdMemberEmail,
        brief_received_date: briefDate,
        brief_status: data.briefStatus,
        project_source: data.projectSource,
        bd_notes: data.bdNotes,
        brief_attachment_url: data.originalBriefUrl,
      },
    });

    // Re-sync project members
    await prisma.projectMember.deleteMany({
      where: { projectId: id },
    });

    if (data.memberIds && data.memberIds.length > 0) {
      await prisma.projectMember.createMany({
        data: data.memberIds.map((userId) => ({
          projectId: id,
          userId,
        })),
      });
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update project error: ", error);
    return { error: error?.message || "Failed to update project" };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    await prisma.project.delete({
      where: { id },
    });
    revalidatePath("/projects");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete project error: ", error);
    return { error: error?.message || "Failed to delete project" };
  }
}
