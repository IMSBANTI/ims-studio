"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import {
  createDepartmentAction,
  createRoleAction,
  createProjectTypeAction,
  updateProfileAction
} from "@/app/actions/settings";
import { Settings, Shield, Plus, Palette, User, Lock } from "lucide-react";

interface SettingsClientProps {
  currentUser: SessionUser;
  departments: any[];
  roles: any[];
  projectTypes: any[];
  taskStatuses: any[];
}

export const SettingsClient: React.FC<SettingsClientProps> = ({
  currentUser,
  departments,
  roles,
  projectTypes,
  taskStatuses,
}) => {
  const { toast } = useToast();

  const isAdmin = currentUser.roleName === "Admin";

  // Create forms states
  const [newDept, setNewDept] = useState("");
  const [newRole, setNewRole] = useState({ name: "", departmentName: "" });
  const [newProjType, setNewProjType] = useState("");

  const [loadingDept, setLoadingDept] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingProjType, setLoadingProjType] = useState(false);

  // Profile forms states
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check password confirmation if user types a new password
    if (profileForm.newPassword) {
      if (!profileForm.currentPassword) {
        toast("Please enter your current password to set a new password", "warning");
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        toast("New passwords do not match", "error");
        return;
      }
      if (profileForm.newPassword.length < 6) {
        toast("New password must be at least 6 characters long", "warning");
        return;
      }
    }

    setLoadingProfile(true);

    try {
      const res = await updateProfileAction({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone || undefined,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      });

      if (res.success) {
        toast("Profile details updated successfully", "success");
        // Clear password fields
        setProfileForm((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        toast(res.error || "Failed to update profile details", "error");
      }
    } catch (e) {
      toast("Error updating profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    setLoadingDept(true);

    try {
      const res = await createDepartmentAction(newDept.trim());
      if (res.success) {
        toast("Department created successfully", "success");
        setNewDept("");
      } else {
        toast(res.error || "Failed to create department", "error");
      }
    } catch (e) {
      toast("Error creating department", "error");
    } finally {
      setLoadingDept(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) return;
    setLoadingRole(true);

    try {
      const res = await createRoleAction(newRole.name.trim(), newRole.departmentName || undefined);
      if (res.success) {
        toast("Role created successfully", "success");
        setNewRole({ name: "", departmentName: "" });
      } else {
        toast(res.error || "Failed to create role", "error");
      }
    } catch (e) {
      toast("Error creating role", "error");
    } finally {
      setLoadingRole(false);
    }
  };

  const handleCreateProjType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjType.trim()) return;
    setLoadingProjType(true);

    try {
      const res = await createProjectTypeAction(newProjType.trim());
      if (res.success) {
        toast("Project type created successfully", "success");
        setNewProjType("");
      } else {
        toast(res.error || "Failed to create project type", "error");
      }
    } catch (e) {
      toast("Error creating project type", "error");
    } finally {
      setLoadingProjType(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <Settings className="w-6 h-6 text-studio-red" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Studio Configuration Settings</h2>
          <p className="text-sm text-studio-gray-text">
            Update personal profile details, change passwords, and manage organizational studio setups.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2.5 border-b border-studio-gray-border">
              <User className="w-5 h-5 text-studio-red" />
              <div>
                <CardTitle>My Profile Details</CardTitle>
                <CardDescription>Update your personal information and contact settings</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="profileName">Full Name</Label>
                    <Input
                      id="profileName"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="profileEmail">Email Address</Label>
                    <Input
                      id="profileEmail"
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="profilePhone">Phone Number</Label>
                    <Input
                      id="profilePhone"
                      placeholder="e.g. +8801712345678"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Studio Role (Read-only)</Label>
                    <div className="h-10 border border-studio-gray-border bg-zinc-50 rounded-md flex items-center px-3 text-xs font-semibold text-studio-gray-text">
                      {currentUser.roleName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Department (Read-only)</Label>
                    <div className="h-10 border border-studio-gray-border bg-zinc-50 rounded-md flex items-center px-3 text-xs font-semibold text-studio-gray-text">
                      {currentUser.departmentName}
                    </div>
                  </div>
                </div>

                {/* Password modification */}
                <div className="pt-4 border-t border-studio-gray-border space-y-4">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-studio-red" />
                    <h3 className="text-sm font-bold text-studio-black">Change Security Password</h3>
                  </div>
                  <p className="text-[11px] text-studio-gray-text leading-normal">
                    To update your password, fill out the fields below. Leave them blank if you only want to change your profile name or email.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Min 6 characters"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Match new password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-studio-gray-border">
                  <Button type="submit" disabled={loadingProfile} className="bg-studio-red hover:bg-studio-red-hover text-white">
                    {loadingProfile ? "Saving Changes..." : "Save Profile Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Conditional Admin Cards */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Manage Departments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Manage Departments</CardTitle>
                  <CardDescription>Configure organizational units</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateDept} className="flex gap-2">
                    <Input
                      placeholder="Department name..."
                      required
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                    />
                    <Button type="submit" disabled={loadingDept} className="bg-studio-red hover:bg-studio-red-hover text-white shrink-0">
                      Add Dept
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {departments.map((d) => (
                      <Badge key={d.id} variant="outline" className="text-[10px]">
                        {d.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Manage Project Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Manage Project Types</CardTitle>
                  <CardDescription>Delineate creative works categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateProjType} className="flex gap-2">
                    <Input
                      placeholder="e.g. Virtual Reality..."
                      required
                      value={newProjType}
                      onChange={(e) => setNewProjType(e.target.value)}
                    />
                    <Button type="submit" disabled={loadingProjType} className="bg-studio-red hover:bg-studio-red-hover text-white shrink-0">
                      Add Type
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {projectTypes.map((t) => (
                      <Badge key={t.id} variant="outline" className="text-[10px]">
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Manage Roles */}
              <Card className="sm:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Manage Roles</CardTitle>
                  <CardDescription>Define positions and permission hierarchies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateRole} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Role title (e.g. Lead Designer)..."
                      required
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    />
                    <Select
                      options={[
                        { label: "Select Department", value: "" },
                        ...departments.map((d) => ({ label: d.name, value: d.name })),
                      ]}
                      value={newRole.departmentName}
                      onChange={(e) => setNewRole({ ...newRole, departmentName: e.target.value })}
                    />
                    <Button type="submit" disabled={loadingRole} className="bg-studio-red hover:bg-studio-red-hover text-white">
                      Add Role
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {roles.map((r) => (
                      <Badge key={r.id} variant="gray" className="text-[10px]">
                        {r.name} {r.departmentName && <span className="text-[8px] text-zinc-500 font-normal">({r.departmentName})</span>}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
      </div>
    </div>
  );
};
