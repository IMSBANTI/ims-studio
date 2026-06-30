import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1. Clean database
  await prisma.notification.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.businessDevelopmentSource.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.projectType.deleteMany();
  await prisma.taskStatus.deleteMany();

  // 2. Create Departments
  const dept2D = await prisma.department.create({ data: { name: "2D LED" } });
  const dept3D = await prisma.department.create({ data: { name: "3D LED" } });
  const deptBD = await prisma.department.create({ data: { name: "Business Development" } });
  const deptAdmin = await prisma.department.create({ data: { name: "Administration" } });

  // 3. Create Roles
  const roles = [
    { name: "Admin", departmentName: "Administration" },
    { name: "Sr. Studio Manager", departmentName: "2D LED" },
    { name: "Manager", departmentName: "2D LED" },
    { name: "Senior Visualizer", departmentName: "2D LED" },
    { name: "Visualizer", departmentName: "2D LED" },
    { name: "3D Visualizer", departmentName: "3D LED" },
    { name: "Edit", departmentName: "3D LED" },
    { name: "BD Representative", departmentName: "Business Development" },
  ];
  for (const r of roles) {
    await prisma.role.create({ data: r });
  }

  // 4. Create Project Types
  const projectTypes = [
    "Event", "Stage Design", "Booth", "Exhibition", "Tunnel", 
    "LED Content", "3D Render", "Walkthrough", "Graphic Design", 
    "Motion Graphic", "Technical Drawing", "Other"
  ];
  for (const pt of projectTypes) {
    await prisma.projectType.create({ data: { name: pt } });
  }

  // 5. Create Task Statuses
  const taskStatuses = ["To Do", "In Progress", "Review", "Revision", "Completed"];
  for (const ts of taskStatuses) {
    await prisma.taskStatus.create({ data: { name: ts } });
  }

  // 6. Create Users (passwords are 'password123' hashed or simple text for dev auth)
  const usersData = [
    {
      email: "admin@ims.studio",
      password: "password123",
      name: "Abir Ahmed (Admin)",
      roleName: "Admin",
      departmentName: "Administration",
      phone: "+8801712345678",
      skillTags: "Management, Admin, Database",
    },
    {
      email: "sr.manager2d@ims.studio",
      password: "password123",
      name: "Farhana Yasmin",
      roleName: "Sr. Studio Manager",
      departmentName: "2D LED",
      phone: "+8801712345679",
      skillTags: "Management, 2D Design, Creative Direction",
    },
    {
      email: "sr.manager3d@ims.studio",
      password: "password123",
      name: "Tariqul Islam",
      roleName: "Sr. Studio Manager",
      departmentName: "3D LED",
      phone: "+8801712345680",
      skillTags: "Management, 3D Modeling, Unreal Engine",
    },
    {
      email: "manager2d@ims.studio",
      password: "password123",
      name: "Sajid Hasan",
      roleName: "Manager",
      departmentName: "2D LED",
      phone: "+8801712345681",
      skillTags: "Project Coordination, Quality Control",
    },
    {
      email: "vis1.2d@ims.studio",
      password: "password123",
      name: "Nabila Tabassum",
      roleName: "Senior Visualizer",
      departmentName: "2D LED",
      phone: "+8801712345682",
      skillTags: "2D Design, Motion Design, Graphic Design, LED Content",
    },
    {
      email: "vis2.2d@ims.studio",
      password: "password123",
      name: "Tanvir Rahman",
      roleName: "Visualizer",
      departmentName: "2D LED",
      phone: "+8801712345683",
      skillTags: "2D Design, Graphic Design, LED Content",
    },
    {
      email: "vis1.3d@ims.studio",
      password: "password123",
      name: "Zamil Akhtar",
      roleName: "3D Visualizer",
      departmentName: "3D LED",
      phone: "+8801712345684",
      skillTags: "3D Modeling, Rendering, Animation, CAD",
    },
    {
      email: "edit.visual@ims.studio",
      password: "password123",
      name: "Rashedul Bari",
      roleName: "Edit",
      departmentName: "3D LED",
      phone: "+8801712345685",
      skillTags: "Video Editing, Sound Design, Motion Graphic",
    },
    {
      email: "bd.john@ims.studio",
      password: "password123",
      name: "John Doe",
      roleName: "BD Representative",
      departmentName: "Business Development",
      phone: "+8801712345686",
      skillTags: "Sales, Presentation, Client Relations",
    },
    {
      email: "bd.sarah@ims.studio",
      password: "password123",
      name: "Sarah Jenkins",
      roleName: "BD Representative",
      departmentName: "Business Development",
      phone: "+8801712345687",
      skillTags: "Sales, Strategy, Client Onboarding",
    },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    const createdUser = await prisma.user.create({ data: u });
    users[u.email] = createdUser;
  }

  // 7. Create Sample Projects, BD Sources, Members, Tasks, Time Logs
  const baseDate = new Date();

  // Create Sample Submissions first
  const project1Date = new Date(baseDate.getFullYear(), baseDate.getMonth(), 5);
  const submission1 = await prisma.submission.create({
    data: {
      title: "Concert Stage Design Pitch 2026",
      clientName: "LiveNation Global",
      eventName: "LiveNation Annual Concert",
      submissionDate: project1Date,
      status: "Won",
      notes: "Client loved the immersive curved screen concept. Approved for studio production.",
      budget: 650000,
      presentationUrl: "https://drive.google.com/file/d/livenation-stage-ppt",
      attachmentUrl: "https://drive.google.com/file/d/livenation-costing-xls",
      reusableTags: "Stage Design, Concert, Curved Screen, Neon",
      reusabilityScore: "High",
      bdRepId: users["bd.sarah@ims.studio"].id,
    }
  });

  const project2Date = new Date(baseDate.getFullYear(), baseDate.getMonth(), 8);
  const submission2 = await prisma.submission.create({
    data: {
      title: "Apex Cyberpunk LED Walking Tunnel Pitch",
      clientName: "Apex Corporation",
      eventName: "Apex Tech Summit Expo",
      submissionDate: project2Date,
      status: "Lost",
      lossReason: "Competitor submitted lower execution costing package.",
      notes: "The 3D design of the 50m long cyberpunk generative LED tunnel is spectacular and highly reusable for any upcoming walk-through or tunnel expo designs.",
      budget: 1200000,
      presentationUrl: "https://drive.google.com/file/d/apex-tunnel-ppt",
      attachmentUrl: "https://drive.google.com/file/d/apex-costing-xls",
      reusableTags: "LED Tunnel, Cyberpunk, Walkthrough, Generative, Expo",
      reusabilityScore: "High",
      bdRepId: users["bd.john@ims.studio"].id,
    }
  });

  const project3Date = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  const submission3 = await prisma.submission.create({
    data: {
      title: "Global Tech Summit Booth Design",
      clientName: "TechSummit Org",
      eventName: "Tech Summit Expo 2026",
      submissionDate: project3Date,
      status: "Won",
      notes: "Compact double-decker layout was accepted with minor branding adjustments.",
      budget: 350000,
      presentationUrl: "https://drive.google.com/file/d/techsummit-booth-ppt",
      attachmentUrl: "https://drive.google.com/file/d/techsummit-costing-xls",
      reusableTags: "Booth, Expo, Double-Decker, Tech",
      reusabilityScore: "Medium",
      bdRepId: users["bd.sarah@ims.studio"].id,
    }
  });

  // Project 1
  const project1 = await prisma.project.create({
    data: {
      name: "Concert Stage Design 2026",
      clientName: "LiveNation Global",
      briefReceivedDate: project1Date,
      projectSource: "Business Development Team",
      briefStatus: "Confirmed",
      projectType: "Stage Design",
      departmentInvolved: "Both",
      startDate: project1Date,
      deadline: new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 15),
      priority: "Urgent",
      status: "In Progress",
      projectBrief: "Create an immersive Concert Stage Design with curved massive 3D LED screens on side walls, center 2D LED, and automated moving lights.",
      notes: "High priority project. Client expects photorealistic walkthrough animation.",
      originalBriefUrl: "https://drive.google.com/file/d/ims-concert-stage-brief",
      referenceLink: "https://dropbox.com/sh/ims-concert-stage-assets",
      managerId: users["sr.manager2d@ims.studio"].id,
      budget: 650000,
      actualCost: 450000,
      submissionId: submission1.id,
    }
  });

  await prisma.businessDevelopmentSource.create({
    data: {
      project_id: project1.id,
      bd_member_name: "Sarah Jenkins",
      bd_member_email: "bd.sarah@ims.studio",
      brief_received_date: project1Date,
      brief_status: "Confirmed",
      project_source: "Business Development Team",
      bd_notes: "Client is highly interested in futuristic aesthetics. Let's showcase our previous tunnel projects.",
      brief_attachment_url: "https://drive.google.com/file/d/ims-concert-stage-brief",
    }
  });

  // Assign project members
  const proj1Members = ["vis1.2d@ims.studio", "vis2.2d@ims.studio", "vis1.3d@ims.studio", "edit.visual@ims.studio"];
  for (const email of proj1Members) {
    await prisma.projectMember.create({
      data: {
        projectId: project1.id,
        userId: users[email].id,
      }
    });
  }

  // Tasks for Project 1
  const t1_1 = await prisma.task.create({
    data: {
      title: "3D Modeling of Stage Structure",
      description: "Model the central stage structure, curved side walls, and structural columns according to CAD footprint.",
      assignedUserId: users["vis1.3d@ims.studio"].id,
      departmentName: "3D LED",
      projectId: project1.id,
      startDate: project1Date,
      dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 15),
      estimatedHours: 40,
      actualHours: 35,
      priority: "High",
      status: "In Progress",
      notes: "Draft modeling done. Working on lighting fixtures.",
    }
  });

  const t1_2 = await prisma.task.create({
    data: {
      title: "2D LED Adaptations & Layout",
      description: "Create pixel-map templates for the center LED walls and generate abstract visuals for mockups.",
      assignedUserId: users["vis1.2d@ims.studio"].id,
      departmentName: "2D LED",
      projectId: project1.id,
      startDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 10),
      dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 20),
      estimatedHours: 24,
      actualHours: 12,
      priority: "Medium",
      status: "In Progress",
      notes: "Templates sent to client for approval.",
    }
  });

  const t1_3 = await prisma.task.create({
    data: {
      title: "Stage Concept Development",
      description: "Initial moodboard and sketch concepts.",
      assignedUserId: users["vis2.2d@ims.studio"].id,
      departmentName: "2D LED",
      projectId: project1.id,
      startDate: project1Date,
      dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 10),
      estimatedHours: 15,
      actualHours: 15,
      priority: "Urgent",
      status: "Completed",
      completionDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 10),
      notes: "Approved by manager Farhana.",
    }
  });

  // Project 2
  const project2 = await prisma.project.create({
    data: {
      name: "Futuristic LED Tunnel Expo",
      clientName: "Apex Corporation",
      briefReceivedDate: project2Date,
      projectSource: "Direct Client",
      briefStatus: "Received",
      projectType: "Tunnel",
      departmentInvolved: "3D LED",
      startDate: project2Date,
      deadline: new Date(baseDate.getFullYear(), baseDate.getMonth(), 28),
      priority: "High",
      status: "Not Started",
      projectBrief: "Design a 50-meter long walking tunnel covered with seamless P2.5 LED screens running generative content.",
      notes: "Direct client project. Highly critical for marketing.",
      originalBriefUrl: "https://drive.google.com/file/d/ims-tunnel-brief",
      referenceLink: "https://drive.google.com/drive/ims-tunnel-references",
      managerId: users["sr.manager3d@ims.studio"].id,
      budget: 1200000,
      actualCost: 0,
      submissionId: submission2.id,
    }
  });

  await prisma.businessDevelopmentSource.create({
    data: {
      project_id: project2.id,
      bd_member_name: "John Doe",
      bd_member_email: "bd.john@ims.studio",
      brief_received_date: project2Date,
      brief_status: "Received",
      project_source: "Direct Client",
      bd_notes: "Directly contacted. Needs clarification on budget limits and ceiling design restrictions.",
      brief_attachment_url: "https://drive.google.com/file/d/ims-tunnel-brief",
    }
  });

  await prisma.projectMember.create({
    data: {
      projectId: project2.id,
      userId: users["vis1.3d@ims.studio"].id,
    }
  });

  const t2_1 = await prisma.task.create({
    data: {
      title: "Tunnel 3D Render Setup",
      description: "Set up the camera angles, textures, and ambient occlusion for the rendering walkthrough.",
      assignedUserId: users["vis1.3d@ims.studio"].id,
      departmentName: "3D LED",
      projectId: project2.id,
      startDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 12),
      dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), 25),
      estimatedHours: 30,
      actualHours: 0,
      priority: "High",
      status: "To Do",
      notes: "Waiting for CAD structure models.",
    }
  });

  // Project 3 (Completed Project)
  const project3 = await prisma.project.create({
    data: {
      name: "Global Tech Summit Booth",
      clientName: "TechSummit Org",
      briefReceivedDate: project3Date,
      projectSource: "Existing Client",
      briefStatus: "Confirmed",
      projectType: "Booth",
      departmentInvolved: "2D LED",
      startDate: project3Date,
      deadline: new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 20),
      priority: "Medium",
      status: "Completed",
      projectBrief: "Interactive 2D LED Graphic visuals for the double-decker Booth design.",
      notes: "Successfully delivered. Positive feedback received.",
      originalBriefUrl: "https://drive.google.com/file/d/ims-booth-brief",
      managerId: users["sr.manager2d@ims.studio"].id,
      budget: 350000,
      actualCost: 280000,
      submissionId: submission3.id,
    }
  });

  await prisma.businessDevelopmentSource.create({
    data: {
      project_id: project3.id,
      bd_member_name: "Sarah Jenkins",
      bd_member_email: "bd.sarah@ims.studio",
      brief_received_date: project3Date,
      brief_status: "Confirmed",
      project_source: "Existing Client",
      bd_notes: "Repeat business. Prompt delivery is required.",
    }
  });


  await prisma.projectMember.create({
    data: {
      projectId: project3.id,
      userId: users["vis1.2d@ims.studio"].id,
    }
  });

  const t3_1 = await prisma.task.create({
    data: {
      title: "2D LED Graphic Design",
      description: "Create standard layouts, banner graphics, and welcome screen adaptations for the booth screens.",
      assignedUserId: users["vis1.2d@ims.studio"].id,
      departmentName: "2D LED",
      projectId: project3.id,
      startDate: project3Date,
      dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 15),
      estimatedHours: 50,
      actualHours: 48,
      priority: "High",
      status: "Completed",
      completionDate: new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 14),
      notes: "All graphics approved and loaded to server.",
    }
  });

  // Time Logs
  await prisma.timeLog.create({
    data: {
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 6),
      projectId: project1.id,
      taskId: t1_1.id,
      userId: users["vis1.3d@ims.studio"].id,
      hours: 8,
      workNote: "Modeled main stage columns and deck structure.",
      statusUpdate: "In Progress",
    }
  });

  await prisma.timeLog.create({
    data: {
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 7),
      projectId: project1.id,
      taskId: t1_1.id,
      userId: users["vis1.3d@ims.studio"].id,
      hours: 7,
      workNote: "Added curved side wall arrays.",
      statusUpdate: "In Progress",
    }
  });

  await prisma.timeLog.create({
    data: {
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 11),
      projectId: project1.id,
      taskId: t1_2.id,
      userId: users["vis1.2d@ims.studio"].id,
      hours: 6,
      workNote: "Generated abstract loops in After Effects.",
      statusUpdate: "In Progress",
    }
  });

  await prisma.timeLog.create({
    data: {
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 12),
      projectId: project1.id,
      taskId: t1_2.id,
      userId: users["vis1.2d@ims.studio"].id,
      hours: 6,
      workNote: "Completed layout mappings.",
      statusUpdate: "Review",
    }
  });

  await prisma.timeLog.create({
    data: {
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 9),
      projectId: project1.id,
      taskId: t1_3.id,
      userId: users["vis2.2d@ims.studio"].id,
      hours: 8,
      workNote: "Brainstorming moodboard sketches.",
      statusUpdate: "In Progress",
    }
  });

  await prisma.timeLog.create({
    data: {
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 10),
      projectId: project1.id,
      taskId: t1_3.id,
      userId: users["vis2.2d@ims.studio"].id,
      hours: 7,
      workNote: "Finalized stage concept presentation PDF.",
      statusUpdate: "Completed",
    }
  });

  await prisma.timeLog.create({
    data: {
      date: new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 5),
      projectId: project3.id,
      taskId: t3_1.id,
      userId: users["vis1.2d@ims.studio"].id,
      hours: 8,
      workNote: "Setup templates and grid files.",
      statusUpdate: "In Progress",
    }
  });

  // Comments & Notifications
  await prisma.comment.create({
    data: {
      content: "Great work on the concept design! Farhana, check if client wants color variants.",
      projectId: project1.id,
      userId: users["manager2d@ims.studio"].id,
    }
  });

  await prisma.comment.create({
    data: {
      content: "Yes, I will ask Sarah to clarify this with LiveNation.",
      projectId: project1.id,
      userId: users["sr.manager2d@ims.studio"].id,
    }
  });

  await prisma.notification.create({
    data: {
      title: "New Brief Clarification Pending",
      content: "Brief clarification pending for project Futuristic LED Tunnel Expo (Sarah Jenkins).",
      type: "BriefClarification",
      userId: users["admin@ims.studio"].id,
    }
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
