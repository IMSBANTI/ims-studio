import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { BDClient } from "@/components/bd-client";

export const dynamic = "force-dynamic";

export default async function BDPage() {
  const currentUser = getSession();
  if (!currentUser) {
    return null;
  }

  // Load all projects with BD briefs
  const bdProjects = await prisma.project.findMany({
    include: {
      bdSource: true,
    },
    orderBy: {
      briefReceivedDate: "desc",
    },
  });

  // Load all submissions with their BD Rep and projects
  const submissions = await prisma.submission.findMany({
    include: {
      bdRep: true,
      projects: true,
    },
    orderBy: {
      submissionDate: "desc",
    },
  });

  // Load all projects for linking to submissions
  const allProjects = await prisma.project.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Load all BD representatives from the User table
  const bdReps = await prisma.user.findMany({
    where: {
      roleName: "BD Representative",
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate stats for BD members list
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const bdData = bdReps.map((rep) => {
    // Filter projects matching this BD rep name
    const repProjects = bdProjects.filter(
      (p) => p.bdSource && p.bdSource.bd_member_name.toLowerCase() === rep.name.toLowerCase()
    );

    const repSubmissions = submissions.filter((s) => s.bdRepId === rep.id);

    const monthlyCount = repProjects.filter(
      (p) => new Date(p.briefReceivedDate) >= startOfMonth
    ).length;

    const confirmedCount = repProjects.filter(
      (p) => p.briefStatus === "Confirmed"
    ).length;

    const pendingClarification = repProjects.filter(
      (p) => p.briefStatus === "Need Clarification"
    ).length;

    const completedProjects = repProjects.filter(
      (p) => p.status === "Completed" || p.status === "Delivered"
    ).length;

    // Calculate submissions metrics
    const totalSubmissions = repSubmissions.length;
    const wonCount = repSubmissions.filter((s) => s.status === "Won").length;
    const lostCount = repSubmissions.filter((s) => s.status === "Lost").length;
    const winRate = totalSubmissions > 0 ? Math.round((wonCount / (wonCount + lostCount || 1)) * 100) : 0;

    return {
      id: rep.id,
      name: rep.name,
      email: rep.email,
      phone: rep.phone || "N/A",
      status: rep.status,
      totalReceived: repProjects.length,
      monthlyCount,
      confirmedCount,
      pendingClarification,
      completedProjects,
      totalSubmissions,
      wonCount,
      lostCount,
      winRate,
    };
  });

  return (
    <BDClient
      currentUser={currentUser!}
      bdRepresentatives={bdData}
      projects={bdProjects}
      submissions={submissions}
      allProjects={allProjects}
    />
  );
}

