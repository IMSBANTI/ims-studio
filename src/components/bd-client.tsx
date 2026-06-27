"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { createTeamMemberAction } from "@/app/actions/team";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  FileText,
  HelpCircle,
  CheckCircle,
  Calendar,
  ExternalLink,
  ChevronRight,
  ClipboardList
} from "lucide-react";

interface BDClientProps {
  currentUser: SessionUser;
  bdRepresentatives: any[];
  projects: any[];
}

export const BDClient: React.FC<BDClientProps> = ({
  currentUser,
  bdRepresentatives,
  projects,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tracker" | "representatives">("tracker");
  
  // Filtering States
  const [search, setSearch] = useState("");
  const [bdFilter, setBdFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  // Detail Modal State
  const [selectedBrief, setSelectedBrief] = useState<any | null>(null);

  // Add Representative Modal State
  const [isAddRepOpen, setIsAddRepOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repForm, setRepForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const isAdmin = currentUser.roleName === "Admin";
  const isManagement = currentUser.roleName === "Admin" || currentUser.roleName === "Sr. Studio Manager";

  // Filtered briefs (all projects with BD information)
  const filteredBriefs = useMemo(() => {
    return projects.filter((project) => {
      const bd = project.bdSource;
      if (!bd) return false;

      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.clientName.toLowerCase().includes(search.toLowerCase());

      const matchesBd = bdFilter === "All" || bd.bd_member_name === bdFilter;
      const matchesStatus = statusFilter === "All" || bd.brief_status === statusFilter;
      const matchesSource = sourceFilter === "All" || bd.project_source === sourceFilter;

      return matchesSearch && matchesBd && matchesStatus && matchesSource;
    });
  }, [projects, search, bdFilter, statusFilter, sourceFilter]);

  // Aggregate stats
  const briefStats = useMemo(() => {
    const list = projects.filter((p) => p.bdSource);
    const total = list.length;
    const pendingClarification = list.filter((p) => p.bdSource.brief_status === "Need Clarification").length;
    const confirmed = list.filter((p) => p.bdSource.brief_status === "Confirmed").length;

    // Received this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyIntake = list.filter((p) => new Date(p.briefReceivedDate) >= startOfMonth).length;

    return { total, pendingClarification, confirmed, monthlyIntake };
  }, [projects]);

  const handleAddRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await createTeamMemberAction({
        ...repForm,
        roleName: "BD Representative",
        departmentName: "Business Development",
        skillTags: "Sales, Presentation, Client Relations",
        status: "Active",
      });

      if (res.success) {
        toast("BD Representative added successfully", "success");
        setIsAddRepOpen(false);
        setRepForm({ name: "", email: "", phone: "" });
      } else {
        toast(res.error || "Failed to add representative", "error");
      }
    } catch (e) {
      toast("Error creating profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBriefStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <Badge variant="green">Confirmed</Badge>;
      case "Need Clarification":
        return <Badge variant="yellow">Need Clarification</Badge>;
      case "Received":
        return <Badge variant="gray">Received</Badge>;
      case "In Progress":
        return <Badge variant="blue">In Progress</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Head */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Business Development Brief Tracking</h2>
          <p className="text-sm text-studio-gray-text">
            Track project brief sources, intake pipelines, client origins, and clarifications pending.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-md border border-studio-gray-border p-0.5">
            <button
              onClick={() => setActiveTab("tracker")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "tracker"
                  ? "bg-studio-red text-white"
                  : "text-studio-gray-text hover:text-studio-black"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Briefs Tracker
            </button>
            <button
              onClick={() => setActiveTab("representatives")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "representatives"
                  ? "bg-studio-red text-white"
                  : "text-studio-gray-text hover:text-studio-black"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> BD Performance
            </button>
          </div>
          {isAdmin && activeTab === "representatives" && (
            <Button onClick={() => setIsAddRepOpen(true)} className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
              <Plus className="w-4 h-4" /> Add BD Representative
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Total Briefs Tracked</p>
              <h3 className="text-2xl font-black text-studio-black">{briefStats.total} Briefs</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-studio-red/10 border border-studio-red/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-studio-red" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Clarifications Pending</p>
              <h3 className="text-2xl font-black text-yellow-600">{briefStats.pendingClarification} Briefs</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Confirmed Briefs</p>
              <h3 className="text-2xl font-black text-green-600">{briefStats.confirmed} Briefs</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Intake Intake (Month)</p>
              <h3 className="text-2xl font-black text-studio-black">{briefStats.monthlyIntake} Briefs</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-zinc-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab === "tracker" ? (
        <>
          {/* Tracker filters */}
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-studio-gray-text" />
                <Input
                  placeholder="Search client or project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select
                  options={[
                    { label: "All BD Representatives", value: "All" },
                    ...bdRepresentatives.map(r => ({ label: r.name, value: r.name }))
                  ]}
                  value={bdFilter}
                  onChange={(e) => setBdFilter(e.target.value)}
                />
              </div>

              <div>
                <Select
                  options={[
                    { label: "All Brief Statuses", value: "All" },
                    ...["Received", "Need Clarification", "Confirmed", "In Progress", "Revised Brief Received"].map(s => ({ label: s, value: s }))
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>

              <div>
                <Select
                  options={[
                    { label: "All Project Sources", value: "All" },
                    ...["Direct Client", "Business Development Team", "Existing Client", "Referral", "Other"].map(s => ({ label: s, value: s }))
                  ]}
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Briefs Table */}
          <Card>
            <CardContent className="p-0">
              {filteredBriefs.length === 0 ? (
                <div className="text-center py-12 text-sm text-studio-gray-text">
                  No briefs logged matching selection parameters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project / Client</TableHead>
                      <TableHead>BD Rep Name</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Project Source</TableHead>
                      <TableHead>Brief Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBriefs.map((project) => {
                      const bd = project.bdSource;
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <Link href={`/projects/${project.id}`} className="font-bold text-studio-black hover:text-studio-red hover:underline">
                              {project.name}
                            </Link>
                            <p className="text-[10px] text-studio-gray-text mt-0.5">Client: {project.clientName}</p>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-xs text-studio-gray-darkText">{bd.bd_member_name}</span>
                            <p className="text-[9px] text-studio-gray-text">{bd.bd_member_email}</p>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {new Date(bd.brief_received_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{bd.project_source}</Badge>
                          </TableCell>
                          <TableCell>{getBriefStatusBadge(bd.brief_status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedBrief({ ...bd, projectName: project.name, clientName: project.clientName })}
                            >
                              View Brief Notes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* TAB: REPRESENTATIVES */
        <Card>
          <CardHeader>
            <CardTitle>Business Development Team Metrics</CardTitle>
            <CardDescription>Intake activity, conversions, and pending pipeline details per BD member</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {bdRepresentatives.length === 0 ? (
              <p className="text-sm text-studio-gray-text italic text-center py-6">No representatives registered</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Representative Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Total intake</TableHead>
                    <TableHead>Intake (Month)</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead>Clarification Pending</TableHead>
                    <TableHead>Completed Projects</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bdRepresentatives.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-bold text-studio-black">{rep.name}</TableCell>
                      <TableCell className="text-xs font-semibold text-studio-gray-darkText">{rep.email}</TableCell>
                      <TableCell className="text-xs text-studio-gray-text">{rep.phone}</TableCell>
                      <TableCell className="text-xs font-bold text-center">{rep.totalReceived} briefs</TableCell>
                      <TableCell className="text-xs font-black text-studio-red text-center">{rep.monthlyCount} briefs</TableCell>
                      <TableCell className="text-xs font-bold text-green-600 text-center">{rep.confirmedCount} briefs</TableCell>
                      <TableCell className="text-xs font-bold text-yellow-600 text-center">{rep.pendingClarification} briefs</TableCell>
                      <TableCell className="text-xs font-black text-studio-black text-center">{rep.completedProjects} projects</TableCell>
                      <TableCell>
                        <Badge variant={rep.status === "Active" ? "green" : "gray"}>
                          {rep.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Brief Detail notes Modal */}
      <Modal
        isOpen={!!selectedBrief}
        onClose={() => setSelectedBrief(null)}
        title="Business Development Brief Overview"
        size="md"
      >
        {selectedBrief && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-studio-gray-text">Project Reference</span>
              <p className="font-bold text-studio-black text-base">{selectedBrief.projectName}</p>
              <p className="text-xs text-studio-gray-text">Client: {selectedBrief.clientName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-studio-gray-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">BD Representative</span>
                <p className="font-semibold text-studio-black mt-0.5">{selectedBrief.bd_member_name}</p>
                <p className="text-xs text-studio-gray-text">{selectedBrief.bd_member_email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Brief Date</span>
                <p className="font-semibold text-studio-black mt-0.5">{new Date(selectedBrief.brief_received_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-b border-studio-gray-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Brief Status</span>
                <p className="font-semibold mt-0.5">{getBriefStatusBadge(selectedBrief.brief_status)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-studio-gray-text">Project Source</span>
                <p className="font-semibold text-studio-black mt-0.5">{selectedBrief.project_source}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-studio-gray-text">Business Development Handover Comments</span>
              <p className="text-studio-gray-darkText italic bg-studio-gray-bg p-3.5 rounded border border-studio-gray-border mt-1 leading-relaxed">
                {selectedBrief.bd_notes || "No notes provided by BD representative"}
              </p>
            </div>

            {selectedBrief.brief_attachment_url && (
              <div className="pt-2">
                <a
                  href={selectedBrief.brief_attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-studio-red font-bold hover:underline"
                >
                  Download Original Brief File <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-studio-gray-border">
              <Button onClick={() => setSelectedBrief(null)} className="bg-studio-black hover:bg-studio-black-hover text-white">
                Dismiss Notes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add BD Representative Modal */}
      <Modal isOpen={isAddRepOpen} onClose={() => setIsAddRepOpen(false)} title="Register BD Representative" size="sm">
        <form onSubmit={handleAddRepSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="repName">Full Name</Label>
            <Input
              id="repName"
              required
              placeholder="John Doe"
              value={repForm.name}
              onChange={(e) => setRepForm({ ...repForm, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="repEmail">Email Address</Label>
            <Input
              id="repEmail"
              type="email"
              required
              placeholder="john@ims.studio"
              value={repForm.email}
              onChange={(e) => setRepForm({ ...repForm, email: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="repPhone">Phone Number</Label>
            <Input
              id="repPhone"
              placeholder="+8801712345686"
              value={repForm.phone}
              onChange={(e) => setRepForm({ ...repForm, phone: e.target.value })}
            />
          </div>

          <div className="bg-zinc-50 border border-studio-gray-border p-3 rounded text-[11px] text-studio-gray-text leading-normal">
            BD representatives will be added to the team roster. Default login password is <span className="font-mono font-bold text-studio-black">password123</span>.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-studio-gray-border">
            <Button type="button" variant="outline" onClick={() => setIsAddRepOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Registering..." : "Add Representative"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
