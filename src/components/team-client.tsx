"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { createTeamMemberAction, updateTeamMemberAction, deleteTeamMemberAction } from "@/app/actions/team";
import { Search, Plus, Edit, UserX, UserCheck, Shield, Trash2 } from "lucide-react";

interface TeamClientProps {
  currentUser: SessionUser;
  team: any[];
  roles: any[];
  departments: any[];
}

export const TeamClient: React.FC<TeamClientProps> = ({
  currentUser,
  team,
  roles,
  departments,
}) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    roleName: "Visualizer",
    departmentName: "2D LED",
    skillTags: "2D Design, LED Content",
    status: "Active",
  });

  const isAdmin = currentUser.roleName === "Admin";

  const filteredTeam = useMemo(() => {
    return team.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase()) ||
        member.skillTags.toLowerCase().includes(search.toLowerCase());

      const matchesDept = deptFilter === "All" || member.departmentName === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [team, search, deptFilter]);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      roleName: roles[0]?.name || "Visualizer",
      departmentName: departments[0]?.name || "2D LED",
      skillTags: "",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone === "N/A" ? "" : member.phone,
      roleName: member.roleName,
      departmentName: member.departmentName,
      skillTags: member.skillTags,
      status: member.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (member: any) => {
    const newStatus = member.status === "Active" ? "Inactive" : "Active";
    if (!confirm(`Are you sure you want to set ${member.name}'s status to ${newStatus}?`)) {
      return;
    }

    try {
      const res = await updateTeamMemberAction(member.id, {
        name: member.name,
        email: member.email,
        phone: member.phone === "N/A" ? undefined : member.phone,
        roleName: member.roleName,
        departmentName: member.departmentName,
        skillTags: member.skillTags,
        status: newStatus,
      });

      if (res.success) {
        toast(`User status set to ${newStatus}`, "success");
      } else {
        toast(res.error || "Failed to update status", "error");
      }
    } catch (e) {
      toast("Error updating status", "error");
    }
  };

  const handleDelete = async (member: any) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete ${member.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteTeamMemberAction(member.id);
      if (res.success) {
        toast("Team member deleted permanently", "success");
      } else {
        toast(res.error || "Failed to delete member", "error");
      }
    } catch (e) {
      toast("Error deleting member", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMember) {
        const res = await updateTeamMemberAction(editingMember.id, formData);
        if (res.success) {
          toast("Team member updated successfully", "success");
          setIsModalOpen(false);
        } else {
          toast(res.error || "Failed to update member", "error");
        }
      } else {
        const res = await createTeamMemberAction(formData);
        if (res.success) {
          toast("Team member added successfully", "success");
          setIsModalOpen(false);
        } else {
          toast(res.error || "Failed to add member", "error");
        }
      }
    } catch (err: any) {
      toast("Error saving team member details", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Head */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Studio Team</h2>
          <p className="text-sm text-studio-gray-text">
            Manage studio employees, allocate departments, roles, skill tags, and check monthly productivity.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenCreate} className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
            <Plus className="w-4 h-4" /> Add Team Member
          </Button>
        )}
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-studio-gray-text" />
            <Input
              placeholder="Search by name, email, or skill tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-full sm:w-60">
            <Select
              options={[{ label: "All Departments", value: "All" }, ...departments.map(d => ({ label: d.name, value: d.name }))]}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Team table */}
      <Card>
        <CardContent className="p-0">
          {filteredTeam.length === 0 ? (
            <div className="text-center py-12 text-sm text-studio-gray-text">
              No team members found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Info</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Department & Role</TableHead>
                  <TableHead>Skill Tags</TableHead>
                  <TableHead>Active Projects</TableHead>
                  <TableHead>Completed Tasks (Month)</TableHead>
                  <TableHead>Logged Hours (Month)</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeam.map((member) => (
                  <TableRow key={member.id} className={member.status !== "Active" ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-studio-red/10 border border-studio-red/20 flex items-center justify-center font-bold text-studio-red text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-studio-black">{member.name}</span>
                          {member.roleName === "Admin" && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] bg-zinc-900 text-white font-bold px-1 py-0.5 rounded">
                              <Shield className="w-2.5 h-2.5 text-studio-red" /> Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium text-studio-gray-darkText">{member.email}</div>
                        <div className="text-studio-gray-text mt-0.5">{member.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-studio-gray-darkText">
                        <div>{member.roleName}</div>
                        <div className="text-[10px] text-studio-gray-text mt-0.5">{member.departmentName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {member.skillTags ? (
                          member.skillTags.split(",").map((s: string) => (
                            <span key={s} className="text-[10px] bg-studio-gray-bg border border-studio-gray-border px-1.5 py-0.5 rounded text-studio-black font-medium">
                              {s.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-studio-gray-text italic">No skills</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-center">{member.activeProjectsCount}</TableCell>
                    <TableCell className="text-xs font-bold text-green-600 text-center">{member.monthlyCompletedTasks} tasks</TableCell>
                    <TableCell className="text-xs font-black text-studio-red text-center">{member.monthlyWorkingHours} hours</TableCell>
                    <TableCell>
                      <Badge variant={member.status === "Active" ? "green" : "gray"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="p-1.5" onClick={() => handleOpenEdit(member)} title="Edit Member">
                            <Edit className="w-4 h-4 text-studio-gray-text hover:text-studio-black" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1.5"
                            onClick={() => handleToggleStatus(member)}
                            title={member.status === "Active" ? "Deactivate Member" : "Activate Member"}
                          >
                            {member.status === "Active" ? (
                              <UserX className="w-4 h-4 text-red-500" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1.5"
                            onClick={() => handleDelete(member)}
                            title="Delete Member Permanently"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
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

      {/* Add / Edit Team Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? "Edit Team Member Details" : "Add New Team Member"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              required
              placeholder="Farhana Yasmin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="farhana@ims.studio"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+8801712345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="roleName">Studio Role</Label>
              <Select
                id="roleName"
                options={roles.map((r) => ({ label: r.name, value: r.name }))}
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="departmentName">Department</Label>
              <Select
                id="departmentName"
                options={departments.map((d) => ({ label: d.name, value: d.name }))}
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="skillTags">Skill Tags (comma-separated)</Label>
            <Input
              id="skillTags"
              placeholder="3D Modeling, Rendering, CAD, Motion Design..."
              value={formData.skillTags}
              onChange={(e) => setFormData({ ...formData, skillTags: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="status">Member Status</Label>
            <Select
              id="status"
              options={["Active", "Inactive"].map((s) => ({ label: s, value: s }))}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>

          {!editingMember && (
            <div className="bg-zinc-50 border border-studio-gray-border p-3 rounded text-[11px] text-studio-gray-text leading-normal">
              New team members are assigned a default password of <span className="font-mono font-bold text-studio-black">password123</span> to login. They can change it in settings once logged in.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-studio-gray-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Saving..." : editingMember ? "Update Details" : "Add Member"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
