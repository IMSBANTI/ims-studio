"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { createProjectAction, updateProjectAction, deleteProjectAction } from "@/app/actions/projects";
import { Search, Plus, Filter, Edit2, Trash2, Eye, ExternalLink } from "lucide-react";

interface ProjectsClientProps {
  currentUser: SessionUser;
  projects: any[];
  users: any[];
  projectTypes: any[];
  departments: any[];
  bdFilterNames: string[];
}

export const ProjectsClient: React.FC<ProjectsClientProps> = ({
  currentUser,
  projects,
  users,
  projectTypes,
  departments,
  bdFilterNames,
}) => {
  const router = useRouter();
  const { toast } = useToast();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [bdFilter, setBdFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    briefReceivedDate: new Date().toISOString().split("T")[0],
    projectSource: "Business Development Team",
    briefStatus: "Received",
    projectType: "Event",
    departmentInvolved: "2D LED",
    startDate: new Date().toISOString().split("T")[0],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    priority: "Medium",
    status: "Not Started",
    projectBrief: "",
    managerId: "",
    notes: "",
    originalBriefUrl: "",
    referenceLink: "",
    bdMemberName: "",
    bdMemberEmail: "",
    bdNotes: "",
    memberIds: [] as string[],
  });

  const canCreate = currentUser.roleName === "Admin" || currentUser.roleName === "Sr. Studio Manager";
  const canDelete = currentUser.roleName === "Admin";
  const canEdit = currentUser.roleName === "Admin" || currentUser.roleName === "Sr. Studio Manager" || currentUser.roleName === "Manager";

  // Filter projects locally
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // 1. Search Query
      const query = search.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.clientName.toLowerCase().includes(query);

      // 2. Status Filter
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;

      // 3. Department Filter
      const matchesDept =
        deptFilter === "All" ||
        project.departmentInvolved === deptFilter ||
        project.departmentInvolved === "Both";

      // 4. BD Representative Filter
      const matchesBd =
        bdFilter === "All" ||
        (project.bdSource && project.bdSource.bd_member_name === bdFilter);

      // 5. Month Filter
      let matchesMonth = true;
      if (monthFilter !== "All") {
        const date = new Date(project.briefReceivedDate);
        const projectMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        matchesMonth = projectMonthYear === monthFilter;
      }

      return matchesSearch && matchesStatus && matchesDept && matchesBd && matchesMonth;
    });
  }, [projects, search, statusFilter, deptFilter, bdFilter, monthFilter]);

  // Unique Month options based on existing projects brief dates
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    projects.forEach((p) => {
      const date = new Date(p.briefReceivedDate);
      const label = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.add(JSON.stringify({ label, value }));
    });
    return Array.from(months).map((m) => JSON.parse(m));
  }, [projects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      name: "",
      clientName: "",
      briefReceivedDate: new Date().toISOString().split("T")[0],
      projectSource: "Business Development Team",
      briefStatus: "Received",
      projectType: projectTypes[0]?.name || "Event",
      departmentInvolved: "2D LED",
      startDate: new Date().toISOString().split("T")[0],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "Medium",
      status: "Not Started",
      projectBrief: "",
      managerId: users.find(u => u.roleName === "Sr. Studio Manager")?.id || "",
      notes: "",
      originalBriefUrl: "",
      referenceLink: "",
      bdMemberName: "",
      bdMemberEmail: "",
      bdNotes: "",
      memberIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientName: project.clientName,
      briefReceivedDate: new Date(project.briefReceivedDate).toISOString().split("T")[0],
      projectSource: project.projectSource,
      briefStatus: project.briefStatus,
      projectType: project.projectType,
      departmentInvolved: project.departmentInvolved,
      startDate: new Date(project.startDate).toISOString().split("T")[0],
      deadline: new Date(project.deadline).toISOString().split("T")[0],
      priority: project.priority,
      status: project.status,
      projectBrief: project.projectBrief,
      managerId: project.managerId || "",
      notes: project.notes || "",
      originalBriefUrl: project.originalBriefUrl || "",
      referenceLink: project.referenceLink || "",
      bdMemberName: project.bdSource?.bd_member_name || "",
      bdMemberEmail: project.bdSource?.bd_member_email || "",
      bdNotes: project.bdSource?.bd_notes || "",
      memberIds: project.members.map((m: any) => m.userId),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? All associated tasks and time logs will be deleted.")) {
      return;
    }

    try {
      const res = await deleteProjectAction(id);
      if (res.success) {
        toast("Project deleted successfully", "success");
      } else {
        toast(res.error || "Failed to delete project", "error");
      }
    } catch (err: any) {
      toast("Error deleting project", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingProject) {
        // Edit Mode
        const res = await updateProjectAction(editingProject.id, formData);
        if (res.success) {
          toast("Project updated successfully", "success");
          setIsModalOpen(false);
        } else {
          toast(res.error || "Failed to update project", "error");
        }
      } else {
        // Create Mode
        const res = await createProjectAction(formData);
        if (res.success) {
          toast("Project created successfully", "success");
          setIsModalOpen(false);
        } else {
          toast(res.error || "Failed to create project", "error");
        }
      }
    } catch (err: any) {
      toast("An error occurred during save", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberCheckboxChange = (userId: string) => {
    setFormData((prev) => {
      const exists = prev.memberIds.includes(userId);
      const memberIds = exists
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId];
      return { ...prev, memberIds };
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge variant="red">Urgent</Badge>;
      case "High":
        return <Badge variant="yellow">High</Badge>;
      case "Medium":
        return <Badge variant="blue">Medium</Badge>;
      default:
        return <Badge variant="gray">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
      case "Delivered":
        return <Badge variant="green">{status}</Badge>;
      case "In Progress":
      case "Review":
      case "Revision":
        return <Badge variant="blue">{status}</Badge>;
      case "On Hold":
        return <Badge variant="yellow">{status}</Badge>;
      case "Cancelled":
        return <Badge variant="red">{status}</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Head */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Studio Projects</h2>
          <p className="text-sm text-studio-gray-text">
            Manage experiential design projects, time tracking, briefs and department allocations.
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate} className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
            <Plus className="w-4 h-4" /> Create Project
          </Button>
        )}
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-studio-gray-text" />
            <Input
              placeholder="Search project or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-studio-gray-text shrink-0" />
            <Select
              options={[{ label: "All Statuses", value: "All" }, ...["Not Started", "In Progress", "On Hold", "Review", "Revision", "Completed", "Delivered", "Cancelled"].map(s => ({ label: s, value: s }))]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[
                { label: "All Departments", value: "All" },
                { label: "2D LED Team Only", value: "2D LED" },
                { label: "3D LED Team Only", value: "3D LED" },
                { label: "Both Teams Involved", value: "Both" },
              ]}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[
                { label: "All BD Reps", value: "All" },
                ...bdFilterNames.map((name) => ({ label: name, value: name })),
              ]}
              value={bdFilter}
              onChange={(e) => setBdFilter(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[
                { label: "All Months", value: "All" },
                ...monthOptions.map((o) => ({ label: o.label, value: o.value })),
              ]}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-sm text-studio-gray-text">
              No projects found matching search filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Details</TableHead>
                  <TableHead>Client & BD Info</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link href={`/projects/${project.id}`} className="font-bold text-studio-black hover:text-studio-red hover:underline">
                        {project.name}
                      </Link>
                      <p className="text-[11px] text-studio-gray-text mt-0.5">Type: {project.projectType}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium text-studio-gray-darkText">{project.clientName}</span>
                        {project.bdSource && (
                          <div className="text-[10px] text-studio-gray-text mt-0.5">
                            BD: {project.bdSource.bd_member_name} ({project.bdSource.brief_status})
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.departmentInvolved}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-[11px] text-studio-gray-darkText">
                        <div>Start: {new Date(project.startDate).toLocaleDateString()}</div>
                        <div className="font-semibold text-studio-red">Due: {new Date(project.deadline).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/projects/${project.id}`}>
                          <Button size="sm" variant="ghost" className="p-1.5" title="View Details">
                            <Eye className="w-4 h-4 text-studio-gray-text hover:text-studio-black" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <Button size="sm" variant="ghost" className="p-1.5" onClick={() => handleOpenEdit(project)} title="Edit Project">
                            <Edit2 className="w-4 h-4 text-studio-gray-text hover:text-studio-black" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="sm" variant="ghost" className="p-1.5 hover:bg-red-50" onClick={() => handleDelete(project.id)} title="Delete Project">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? "Edit Project Details" : "Create New Project Entry"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Core Project Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-studio-red pb-1 border-b border-studio-gray-border">
              Project Base Parameters
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  required
                  disabled={currentUser.roleName === "Manager"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  required
                  disabled={currentUser.roleName === "Manager"}
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="projectType">Project Type</Label>
                <Select
                  id="projectType"
                  disabled={currentUser.roleName === "Manager"}
                  options={projectTypes.map((t) => ({ label: t.name, value: t.name }))}
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="departmentInvolved">Department Involved</Label>
                <Select
                  id="departmentInvolved"
                  disabled={currentUser.roleName === "Manager"}
                  options={[
                    { label: "2D LED Team", value: "2D LED" },
                    { label: "3D LED Team", value: "3D LED" },
                    { label: "Both Teams", value: "Both" },
                  ]}
                  value={formData.departmentInvolved}
                  onChange={(e) => setFormData({ ...formData, departmentInvolved: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="managerId">Project Manager</Label>
                <Select
                  id="managerId"
                  disabled={currentUser.roleName === "Manager"}
                  options={[
                    { label: "Select Manager", value: "" },
                    ...users
                      .filter((u) => u.roleName.includes("Manager"))
                      .map((u) => ({ label: u.name, value: u.id })),
                  ]}
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  disabled={currentUser.roleName === "Manager"}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  required
                  disabled={currentUser.roleName === "Manager"}
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  disabled={currentUser.roleName === "Manager"}
                  options={["Low", "Medium", "High", "Urgent"].map((p) => ({ label: p, value: p }))}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="status">Project Status</Label>
                <Select
                  id="status"
                  options={["Not Started", "In Progress", "On Hold", "Review", "Revision", "Completed", "Delivered", "Cancelled"].map(
                    (s) => ({ label: s, value: s })
                  )}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="referenceLink">Reference Link (Drive/Dropbox)</Label>
                <Input
                  id="referenceLink"
                  placeholder="https://drive.google.com/..."
                  value={formData.referenceLink}
                  onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="projectBrief">Project Brief Description</Label>
              <Textarea
                id="projectBrief"
                rows={3}
                required
                disabled={currentUser.roleName === "Manager"}
                placeholder="Describe project creative scope..."
                value={formData.projectBrief}
                onChange={(e) => setFormData({ ...formData, projectBrief: e.target.value })}
              />
            </div>
          </div>

          {/* Section: BD Brief Source Tracking */}
          <div className="space-y-4 pt-4 border-t border-studio-gray-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-studio-red pb-1 border-b border-studio-gray-border">
              Business Development / Brief Tracker
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bdMemberName">BD Representative Name</Label>
                <Input
                  id="bdMemberName"
                  required
                  disabled={currentUser.roleName === "Manager"}
                  placeholder="John Doe"
                  value={formData.bdMemberName}
                  onChange={(e) => setFormData({ ...formData, bdMemberName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bdMemberEmail">BD Representative Email</Label>
                <Input
                  id="bdMemberEmail"
                  type="email"
                  required
                  disabled={currentUser.roleName === "Manager"}
                  placeholder="john@ims.studio"
                  value={formData.bdMemberEmail}
                  onChange={(e) => setFormData({ ...formData, bdMemberEmail: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="briefReceivedDate">Brief Received Date</Label>
                <Input
                  id="briefReceivedDate"
                  type="date"
                  required
                  disabled={currentUser.roleName === "Manager"}
                  value={formData.briefReceivedDate}
                  onChange={(e) => setFormData({ ...formData, briefReceivedDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="projectSource">Project Source</Label>
                <Select
                  id="projectSource"
                  disabled={currentUser.roleName === "Manager"}
                  options={[
                    "Direct Client",
                    "Business Development Team",
                    "Existing Client",
                    "Referral",
                    "Other",
                  ].map((s) => ({ label: s, value: s }))}
                  value={formData.projectSource}
                  onChange={(e) => setFormData({ ...formData, projectSource: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="briefStatus">Brief Status</Label>
                <Select
                  id="briefStatus"
                  disabled={currentUser.roleName === "Manager"}
                  options={[
                    "Received",
                    "Need Clarification",
                    "Confirmed",
                    "In Progress",
                    "Revised Brief Received",
                  ].map((s) => ({ label: s, value: s }))}
                  value={formData.briefStatus}
                  onChange={(e) => setFormData({ ...formData, briefStatus: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="originalBriefUrl">Brief File URL</Label>
                <Input
                  id="originalBriefUrl"
                  placeholder="https://drive.google.com/brief-file"
                  value={formData.originalBriefUrl}
                  onChange={(e) => setFormData({ ...formData, originalBriefUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bdNotes">BD Team Comments</Label>
              <Textarea
                id="bdNotes"
                rows={2}
                disabled={currentUser.roleName === "Manager"}
                placeholder="Any special remarks from the BD representative..."
                value={formData.bdNotes}
                onChange={(e) => setFormData({ ...formData, bdNotes: e.target.value })}
              />
            </div>
          </div>

          {/* Section: Assign Team Members */}
          {currentUser.roleName !== "Manager" && (
            <div className="space-y-3 pt-4 border-t border-studio-gray-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-studio-red pb-1 border-b border-studio-gray-border">
                Assign Studio Visualizers
              </h3>
              <Label>Select Team Members involved in this project scope</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-studio-gray-bg p-4 rounded-lg border border-studio-gray-border max-h-40 overflow-y-auto">
                {users
                  .filter((u) => u.roleName !== "Admin" && u.roleName !== "BD Representative")
                  .map((usr) => (
                    <label key={usr.id} className="flex items-center gap-2 text-xs text-studio-black cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={formData.memberIds.includes(usr.id)}
                        onChange={() => handleMemberCheckboxChange(usr.id)}
                        className="rounded border-studio-gray-border text-studio-red focus:ring-studio-red"
                      />
                      <span>{usr.name} <span className="text-[10px] text-studio-gray-text">({usr.roleName})</span></span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-studio-gray-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
