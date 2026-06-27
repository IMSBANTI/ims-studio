"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/actions/tasks";
import { Search, Plus, Filter, Edit2, Trash2, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface TasksClientProps {
  currentUser: SessionUser;
  tasks: any[];
  users: any[];
  projects: any[];
}

export const TasksClient: React.FC<TasksClientProps> = ({
  currentUser,
  tasks,
  users,
  projects,
}) => {
  const { toast } = useToast();

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedUserId: "",
    departmentName: "2D LED",
    projectId: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    estimatedHours: 8,
    priority: "Medium",
    status: "To Do",
    notes: "",
    attachmentUrl: "",
  });

  const canManage = currentUser.roleName === "Admin" || currentUser.roleName === "Sr. Studio Manager" || currentUser.roleName === "Manager";

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === "All" || task.assignedUserId === assigneeFilter;
      const matchesProject = projectFilter === "All" || task.projectId === projectFilter;
      const matchesDept = deptFilter === "All" || task.departmentName === deptFilter;

      // Visualizers can see everything but default list may prioritize their tasks
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesProject && matchesDept;
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, projectFilter, deptFilter]);

  const handleOpenCreate = () => {
    if (projects.length === 0) {
      toast("Please create a project first before adding tasks", "warning");
      return;
    }
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      assignedUserId: activeVisualizers[0]?.id || "",
      departmentName: "2D LED",
      projectId: projects[0]?.id || "",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      estimatedHours: 8,
      priority: "Medium",
      status: "To Do",
      notes: "",
      attachmentUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assignedUserId: task.assignedUserId,
      departmentName: task.departmentName,
      projectId: task.projectId,
      startDate: new Date(task.startDate).toISOString().split("T")[0],
      dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      estimatedHours: task.estimatedHours,
      priority: task.priority,
      status: task.status,
      notes: task.notes || "",
      attachmentUrl: task.attachmentUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, projectId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await deleteTaskAction(id, projectId);
      if (res.success) {
        toast("Task deleted successfully", "success");
      } else {
        toast(res.error || "Failed to delete task", "error");
      }
    } catch (e) {
      toast("Error deleting task", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTask) {
        const res = await updateTaskAction(editingTask.id, formData);
        if (res.success) {
          toast("Task updated successfully", "success");
          setIsModalOpen(false);
        } else {
          toast(res.error || "Failed to update task", "error");
        }
      } else {
        const res = await createTaskAction(formData);
        if (res.success) {
          toast("Task created successfully", "success");
          setIsModalOpen(false);
        } else {
          toast(res.error || "Failed to create task", "error");
        }
      }
    } catch (err: any) {
      toast("Error saving task", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Quick Status Update for Visualizers on their own tasks
  const handleQuickStatusUpdate = async (task: any, newStatus: string) => {
    try {
      const res = await updateTaskAction(task.id, {
        title: task.title,
        description: task.description,
        assignedUserId: task.assignedUserId,
        departmentName: task.departmentName,
        projectId: task.projectId,
        startDate: new Date(task.startDate).toISOString().split("T")[0],
        dueDate: new Date(task.dueDate).toISOString().split("T")[0],
        estimatedHours: task.estimatedHours,
        priority: task.priority,
        status: newStatus,
        notes: task.notes,
        attachmentUrl: task.attachmentUrl,
      });

      if (res.success) {
        toast(`Task status updated to ${newStatus}`, "success");
      } else {
        toast(res.error || "Failed to update status", "error");
      }
    } catch (e) {
      toast("Error updating task status", "error");
    }
  };

  const activeVisualizers = useMemo(() => {
    return users.filter((u) => u.roleName !== "Admin" && u.roleName !== "BD Representative");
  }, [users]);

  // Styling maps
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Urgent": return <Badge variant="red">Urgent</Badge>;
      case "High": return <Badge variant="yellow">High</Badge>;
      case "Medium": return <Badge variant="blue">Medium</Badge>;
      default: return <Badge variant="gray">Low</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Completed": return <Badge variant="green">Completed</Badge>;
      case "Review": return <Badge variant="yellow">Review</Badge>;
      case "Revision": return <Badge variant="red">Revision</Badge>;
      case "In Progress": return <Badge variant="blue">In Progress</Badge>;
      default: return <Badge variant="gray">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Studio Tasks</h2>
          <p className="text-sm text-studio-gray-text">
            Track daily design revisions, modeling progress, and render setups.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleOpenCreate} className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
            <Plus className="w-4 h-4" /> Create Task
          </Button>
        )}
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-studio-gray-text" />
            <Input
              placeholder="Search task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              options={[{ label: "All Projects", value: "All" }, ...projects.map(p => ({ label: p.name, value: p.id }))]}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[{ label: "All Assignees", value: "All" }, ...activeVisualizers.map(u => ({ label: u.name, value: u.id }))]}
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[
                { label: "All Departments", value: "All" },
                { label: "2D LED Team", value: "2D LED" },
                { label: "3D LED Team", value: "3D LED" },
              ]}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[{ label: "All Statuses", value: "All" }, ...["To Do", "In Progress", "Review", "Revision", "Completed"].map(s => ({ label: s, value: s }))]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          <div>
            <Select
              options={[{ label: "All Priorities", value: "All" }, ...["Low", "Medium", "High", "Urgent"].map(p => ({ label: p, value: p }))]}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tasks display */}
      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-sm text-studio-gray-text">
              No tasks found matching filter settings.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Info</TableHead>
                  <TableHead>Project Reference</TableHead>
                  <TableHead>Assigned Team Member</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Estimated / Actual Hours</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
                  const isUserAssigned = task.assignedUserId === currentUser.id;
                  
                  return (
                    <TableRow
                      key={task.id}
                      className={
                        task.status === "Completed"
                          ? "bg-green-50/10 border-l-4 border-l-green-500"
                          : isOverdue
                          ? "bg-red-50/20 border-l-4 border-l-studio-red"
                          : task.priority === "Urgent"
                          ? "border-l-4 border-l-yellow-500"
                          : ""
                      }
                    >
                      <TableCell>
                        <div className="font-bold text-studio-black">{task.title}</div>
                        {task.description && <p className="text-[10px] text-studio-gray-text mt-0.5 max-w-xs truncate">{task.description}</p>}
                        {task.attachmentUrl && (
                          <a href={task.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-1 mt-1">
                            Asset Link
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/projects/${task.projectId}`} className="text-xs font-semibold text-studio-gray-darkText hover:text-studio-red hover:underline">
                          {task.project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-xs text-studio-gray-darkText">{task.assignedUser.name}</span>
                        <p className="text-[9px] text-studio-gray-text">Dept: {task.departmentName}</p>
                      </TableCell>
                      <TableCell>
                        <div className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? "text-studio-red" : "text-studio-black"}`}>
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        Est: <span className="font-bold">{task.estimatedHours}h</span> • Logged: <span className={`font-bold ${task.actualHours > task.estimatedHours ? "text-studio-red" : "text-green-600"}`}>{task.actualHours}h</span>
                      </TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>
                        {isUserAssigned ? (
                          <Select
                            className="h-8 py-0.5 text-xs w-28"
                            options={["To Do", "In Progress", "Review", "Revision", "Completed"].map((s) => ({ label: s, value: s }))}
                            value={task.status}
                            onChange={(e) => handleQuickStatusUpdate(task, e.target.value)}
                          />
                        ) : (
                          getStatusBadge(task.status)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canManage && (
                            <>
                              <Button size="sm" variant="ghost" className="p-1" onClick={() => handleOpenEdit(task)}>
                                <Edit2 className="w-3.5 h-3.5 text-studio-gray-text hover:text-studio-black" />
                              </Button>
                              <Button size="sm" variant="ghost" className="p-1 hover:bg-red-50" onClick={() => handleDelete(task.id, task.projectId)}>
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Task Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? "Edit Task" : "Create New Task"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="projectId">Project Reference</Label>
              <Select
                id="projectId"
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="assignedUserId">Assigned Visualizer</Label>
              <Select
                id="assignedUserId"
                options={activeVisualizers.map((u) => ({ label: `${u.name} (${u.departmentName})`, value: u.id }))}
                value={formData.assignedUserId}
                onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="departmentName">Department</Label>
              <Select
                id="departmentName"
                options={[
                  { label: "2D LED", value: "2D LED" },
                  { label: "3D LED", value: "3D LED" },
                ]}
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="estimatedHours">Est. Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                required
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                options={["Low", "Medium", "High", "Urgent"].map((p) => ({ label: p, value: p }))}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                options={["To Do", "In Progress", "Review", "Revision", "Completed"].map((s) => ({ label: s, value: s }))}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="attachmentUrl">Attachment Link</Label>
            <Input
              id="attachmentUrl"
              placeholder="Google Drive, Dropbox, Figma..."
              value={formData.attachmentUrl}
              onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes / Comments</Label>
            <Textarea
              id="notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-studio-gray-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
