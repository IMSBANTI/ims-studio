"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/actions/tasks";
import { createCommentAction } from "@/app/actions/comments";
import { createTimeLogAction } from "@/app/actions/timelogs";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  MessageSquare,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface ProjectDetailsClientProps {
  currentUser: SessionUser;
  project: any;
  activeUsers: any[];
}

export const ProjectDetailsClient: React.FC<ProjectDetailsClientProps> = ({
  currentUser,
  project,
  activeUsers,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tasks" | "team" | "logs" | "comments">("tasks");

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments state
  const [newComment, setNewComment] = useState("");

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedUserId: "",
    departmentName: "2D LED",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    estimatedHours: 8,
    priority: "Medium",
    status: "To Do",
    notes: "",
    attachmentUrl: "",
  });

  // Log Hours form state
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split("T")[0],
    taskId: "",
    hours: 4,
    workNote: "",
    statusUpdate: "In Progress",
  });

  const canManageTasks = currentUser.roleName === "Admin" || currentUser.roleName === "Sr. Studio Manager" || currentUser.roleName === "Manager";
  const isTeamMember = project.members.some((m: any) => m.userId === currentUser.id);
  const canLogHours = currentUser.roleName === "Admin" || isTeamMember;

  const selectableTasks = useMemo(() => {
    if (currentUser.roleName === "Admin" || currentUser.roleName.includes("Manager")) {
      return project.tasks;
    }
    return project.tasks.filter((t: any) => t.assignedUserId === currentUser.id);
  }, [project.tasks, currentUser]);

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      assignedUserId: activeUsers[0]?.id || "",
      departmentName: project.departmentInvolved === "Both" ? "2D LED" : project.departmentInvolved,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      estimatedHours: 8,
      priority: "Medium",
      status: "To Do",
      notes: "",
      attachmentUrl: "",
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      assignedUserId: task.assignedUserId,
      departmentName: task.departmentName,
      startDate: new Date(task.startDate).toISOString().split("T")[0],
      dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      estimatedHours: task.estimatedHours,
      priority: task.priority,
      status: task.status,
      notes: task.notes || "",
      attachmentUrl: task.attachmentUrl || "",
    });
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTask) {
        const res = await updateTaskAction(editingTask.id, {
          ...taskForm,
          projectId: project.id,
        });
        if (res.success) {
          toast("Task updated successfully", "success");
          setIsTaskModalOpen(false);
        } else {
          toast(res.error || "Failed to update task", "error");
        }
      } else {
        const res = await createTaskAction({
          ...taskForm,
          projectId: project.id,
        });
        if (res.success) {
          toast("Task created successfully", "success");
          setIsTaskModalOpen(false);
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

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await deleteTaskAction(taskId, project.id);
      if (res.success) {
        toast("Task deleted successfully", "success");
      } else {
        toast(res.error || "Failed to delete task", "error");
      }
    } catch (e) {
      toast("Error deleting task", "error");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await createCommentAction({
        content: newComment,
        projectId: project.id,
      });

      if (res.success) {
        setNewComment("");
        toast("Comment added", "success");
      } else {
        toast(res.error || "Failed to add comment", "error");
      }
    } catch (err) {
      toast("Error submitting comment", "error");
    }
  };

  const handleOpenLog = () => {
    if (selectableTasks.length === 0) {
      toast("No active tasks are currently assigned to you on this project.", "warning");
      return;
    }
    setLogForm({
      date: new Date().toISOString().split("T")[0],
      taskId: selectableTasks[0]?.id || "",
      hours: 4,
      workNote: "",
      statusUpdate: selectableTasks[0]?.status || "In Progress",
    });
    setIsLogModalOpen(true);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await createTimeLogAction({
        ...logForm,
        projectId: project.id,
      });

      if (res.success) {
        toast("Working hours logged successfully", "success");
        setIsLogModalOpen(false);
      } else {
        toast(res.error || "Failed to log hours", "error");
      }
    } catch (e) {
      toast("Error logging hours", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* Back button and header */}
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="text-xs text-studio-gray-text flex items-center gap-1">
          <span>Projects</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-studio-black">{project.name}</span>
        </div>
      </div>

      {/* Main Grid: Details Left, BD Track Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core project parameters */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-studio-black">{project.name}</h2>
                {getPriorityBadge(project.priority)}
                {getStatusBadge(project.status)}
              </div>
              <p className="text-sm text-studio-gray-text mt-1">Client: <span className="font-semibold text-studio-black">{project.clientName}</span></p>
            </div>
            {canLogHours && (
              <Button onClick={handleOpenLog} size="sm" className="bg-studio-red hover:bg-studio-red-hover text-white">
                Log Working Hours
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            {/* Metadata pills */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 p-4 bg-studio-gray-bg rounded-lg border border-studio-gray-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Type</span>
                <p className="font-semibold mt-0.5">{project.projectType}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Department</span>
                <p className="font-semibold mt-0.5">{project.departmentInvolved}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Start Date</span>
                <p className="font-semibold mt-0.5">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Deadline</span>
                <p className="font-semibold text-studio-red mt-0.5">{new Date(project.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Est. Budget</span>
                <p className="font-semibold text-green-700 mt-0.5">৳{project.budget ? project.budget.toLocaleString() : "0"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Actual Cost</span>
                <p className="font-semibold text-zinc-700 mt-0.5">৳{project.actualCost ? project.actualCost.toLocaleString() : "0"}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-studio-black mb-1">Project Brief</h3>
              <p className="text-studio-gray-darkText leading-relaxed bg-zinc-50 p-4 rounded border border-studio-gray-border/50">
                {project.projectBrief}
              </p>
            </div>

            {project.notes && (
              <div>
                <h3 className="font-bold text-studio-black mb-1">Internal Notes</h3>
                <p className="text-studio-gray-text italic bg-yellow-50/50 p-3 rounded border border-yellow-200/50">
                  {project.notes}
                </p>
              </div>
            )}

            {/* Links block */}
            <div className="flex gap-4 flex-wrap text-xs font-semibold">
              {project.originalBriefUrl && (
                <a href={project.originalBriefUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-studio-red hover:underline">
                  <Paperclip className="w-4 h-4" /> Original Brief Document <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {project.referenceLink && (
                <a href={project.referenceLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                  <ExternalLink className="w-4 h-4" /> Assets Folder Link
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BD brief tracking card */}
        <Card className="bg-studio-black text-white border-zinc-800">
          <CardHeader className="border-zinc-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-studio-red" />
              <CardTitle className="text-white">BD / Brief Source Section</CardTitle>
            </div>
            <CardDescription className="text-zinc-500">BD representative tracking details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {project.bdSource ? (
              <>
                <div className="space-y-1">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Brief Received From</span>
                  <p className="text-sm font-semibold text-white">{project.bdSource.bd_member_name}</p>
                  <p className="text-zinc-400">{project.bdSource.bd_member_email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-zinc-800">
                  <div>
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Received Date</span>
                    <p className="font-semibold text-zinc-200">{new Date(project.bdSource.brief_received_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Brief Status</span>
                    <p className="font-semibold text-zinc-200">{project.bdSource.brief_status}</p>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Project Intake Source</span>
                  <p className="font-semibold text-zinc-200 mt-0.5">{project.bdSource.project_source}</p>
                </div>

                {project.bdSource.bd_notes && (
                  <div>
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">BD Handover Remarks</span>
                    <p className="text-zinc-400 italic bg-zinc-900 p-2.5 rounded border border-zinc-800 mt-1 leading-relaxed">
                      {project.bdSource.bd_notes}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-zinc-400 italic">No BD Source details available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex border-b border-studio-gray-border gap-6">
          {(["tasks", "team", "logs", "comments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? "border-studio-red text-studio-red"
                  : "border-transparent text-studio-gray-text hover:text-studio-black"
              }`}
            >
              {tab === "logs" ? "Time Logs" : tab === "comments" ? "Comments & Notes" : tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="py-2">
          {/* TAB: TASKS */}
          {activeTab === "tasks" && (
            <Card>
              <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-studio-gray-border">
                <div>
                  <CardTitle className="text-md">Associated Design Tasks</CardTitle>
                  <CardDescription>Visualizers tasks execution board</CardDescription>
                </div>
                {canManageTasks && (
                  <Button onClick={handleOpenCreateTask} size="sm" className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {project.tasks.length === 0 ? (
                  <div className="text-center py-10 text-sm text-studio-gray-text">
                    No tasks assigned to this project yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task Title</TableHead>
                        <TableHead>Assigned Person</TableHead>
                        <TableHead>Dept</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Hours (Est/Act)</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        {canManageTasks && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.tasks.map((task: any) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <span className="font-bold text-studio-black">{task.title}</span>
                            {task.description && <p className="text-[10px] text-studio-gray-text mt-0.5">{task.description}</p>}
                          </TableCell>
                          <TableCell className="font-medium text-xs">{task.assignedUser.name}</TableCell>
                          <TableCell><Badge variant="outline">{task.departmentName}</Badge></TableCell>
                          <TableCell className="text-xs font-semibold">{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">
                            <span className="font-medium">{task.estimatedHours}h</span> / <span className={task.actualHours > task.estimatedHours ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{task.actualHours}h</span>
                          </TableCell>
                          <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                          <TableCell>{getStatusBadge(task.status)}</TableCell>
                          {canManageTasks && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" className="p-1" onClick={() => handleOpenEditTask(task)}>
                                  <Edit className="w-4 h-4 text-studio-gray-text hover:text-studio-black" />
                                </Button>
                                <Button size="sm" variant="ghost" className="p-1 hover:bg-red-50" onClick={() => handleDeleteTask(task.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB: TEAM */}
          {activeTab === "team" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Involved Team Members</CardTitle>
                <CardDescription>Studio team assigned to this project execution</CardDescription>
              </CardHeader>
              <CardContent>
                {project.members.length === 0 ? (
                  <p className="text-sm text-studio-gray-text italic text-center py-6">No visualizers assigned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {project.members.map((m: any) => (
                      <div key={m.userId} className="p-4 rounded-lg border border-studio-gray-border flex items-start gap-3 bg-studio-gray-bg">
                        <div className="w-9 h-9 rounded-full bg-studio-red/10 border border-studio-red/20 flex items-center justify-center font-bold text-studio-red shrink-0">
                          {m.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-studio-black">{m.user.name}</p>
                          <p className="text-[10px] text-studio-gray-text">{m.user.roleName} • {m.user.departmentName}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {m.user.skillTags.split(",").map((s: string) => (
                              <span key={s} className="text-[9px] bg-white border border-studio-gray-border px-1.5 py-0.5 rounded text-studio-black font-semibold">
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB: TIME LOGS */}
          {activeTab === "logs" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Time Tracking Logs</CardTitle>
                <CardDescription>Cumulative effort breakdown on this project</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {project.timeLogs.length === 0 ? (
                  <div className="text-center py-10 text-sm text-studio-gray-text">
                    No time logs recorded against this project yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Team Member</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Logged Hours</TableHead>
                        <TableHead>Work Note / Update</TableHead>
                        <TableHead>Status Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.timeLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs font-semibold">{new Date(log.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium text-xs">{log.user.name}</TableCell>
                          <TableCell className="text-xs font-bold text-studio-black">{log.task.title}</TableCell>
                          <TableCell className="text-xs font-black text-studio-red">{log.hours} hours</TableCell>
                          <TableCell className="text-xs text-studio-gray-darkText leading-normal">{log.workNote}</TableCell>
                          <TableCell>{getStatusBadge(log.statusUpdate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB: COMMENTS */}
          {activeTab === "comments" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Project Activity & Comments</CardTitle>
                <CardDescription>Discuss project updates or log design details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleCommentSubmit} className="flex gap-3">
                  <Input
                    placeholder="Type an update or comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" className="bg-studio-black hover:bg-studio-black-hover text-white">
                    Post Comment
                  </Button>
                </form>

                <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2">
                  {project.comments.length === 0 ? (
                    <p className="text-sm text-studio-gray-text italic text-center py-6">No discussions yet.</p>
                  ) : (
                    project.comments.map((comment: any) => (
                      <div key={comment.id} className="p-3 bg-studio-gray-bg rounded-lg border border-studio-gray-border flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-studio-red/10 border border-studio-red/20 flex items-center justify-center font-bold text-studio-red text-xs shrink-0 mt-0.5">
                          {comment.user.name.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-studio-black">{comment.user.name}</span>
                            <span className="text-[10px] text-studio-gray-text">{comment.user.roleName}</span>
                            <span className="text-[9px] text-zinc-400">• {new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-studio-gray-darkText leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Task Creation/Editing Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? "Edit Task" : "Assign New Task"}
        size="md"
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="taskTitle">Task Title</Label>
            <Input
              id="taskTitle"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="taskDesc">Task Description</Label>
            <Textarea
              id="taskDesc"
              rows={2}
              required
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="taskAssignee">Assignee</Label>
              <Select
                id="taskAssignee"
                options={activeUsers
                  .filter((u) => u.roleName !== "Admin" && u.roleName !== "BD Representative")
                  .map((u) => ({ label: u.name, value: u.id }))}
                value={taskForm.assignedUserId}
                onChange={(e) => setTaskForm({ ...taskForm, assignedUserId: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="taskDept">Department</Label>
              <Select
                id="taskDept"
                options={[
                  { label: "2D LED", value: "2D LED" },
                  { label: "3D LED", value: "3D LED" },
                ]}
                value={taskForm.departmentName}
                onChange={(e) => setTaskForm({ ...taskForm, departmentName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="taskStart">Start Date</Label>
              <Input
                id="taskStart"
                type="date"
                required
                value={taskForm.startDate}
                onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="taskDue">Due Date</Label>
              <Input
                id="taskDue"
                type="date"
                required
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="taskEst">Est Hours</Label>
              <Input
                id="taskEst"
                type="number"
                required
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="taskPriority">Priority</Label>
              <Select
                id="taskPriority"
                options={["Low", "Medium", "High", "Urgent"].map((p) => ({ label: p, value: p }))}
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="taskStatus">Status</Label>
              <Select
                id="taskStatus"
                options={["To Do", "In Progress", "Review", "Revision", "Completed"].map((s) => ({ label: s, value: s }))}
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="taskUrl">Attachment / Reference Link</Label>
            <Input
              id="taskUrl"
              placeholder="Google Drive, Figma, or design asset link..."
              value={taskForm.attachmentUrl}
              onChange={(e) => setTaskForm({ ...taskForm, attachmentUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="taskNotes">Notes</Label>
            <Textarea
              id="taskNotes"
              rows={2}
              value={taskForm.notes}
              onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-studio-gray-border">
            <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Saving..." : editingTask ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Working Hours Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Daily Working Hours"
        size="sm"
      >
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="logDate">Date</Label>
            <Input
              id="logDate"
              type="date"
              required
              value={logForm.date}
              onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="logTask">Select Task</Label>
            <Select
              id="logTask"
              options={selectableTasks.map((t: any) => ({ label: `${t.title} (${t.status})`, value: t.id }))}
              value={logForm.taskId}
              onChange={(e) => {
                const selectedTaskId = e.target.value;
                const currentStatus = selectableTasks.find((t: any) => t.id === selectedTaskId)?.status || "In Progress";
                setLogForm({ ...logForm, taskId: selectedTaskId, statusUpdate: currentStatus });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="logHours">Hours Spent</Label>
              <Input
                id="logHours"
                type="number"
                step="0.5"
                required
                value={logForm.hours}
                onChange={(e) => setLogForm({ ...logForm, hours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="logStatus">Task New Status</Label>
              <Select
                id="logStatus"
                options={["To Do", "In Progress", "Review", "Revision", "Completed"].map((s) => ({ label: s, value: s }))}
                value={logForm.statusUpdate}
                onChange={(e) => setLogForm({ ...logForm, statusUpdate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="logNote">Work Details / Progress Note</Label>
            <Textarea
              id="logNote"
              rows={3}
              required
              placeholder="What did you work on during these hours? Add render links if applicable..."
              value={logForm.workNote}
              onChange={(e) => setLogForm({ ...logForm, workNote: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-studio-gray-border">
            <Button type="button" variant="outline" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Submitting Log..." : "Log Hours"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
