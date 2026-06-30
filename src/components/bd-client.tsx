"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { SessionUser } from "@/lib/auth";
import { createTeamMemberAction } from "@/app/actions/team";
import {
  createSubmissionAction,
  updateSubmissionAction,
  updateSubmissionStatusAction,
  deleteSubmissionAction,
  cloneSubmissionAction,
} from "@/app/actions/submissions";
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
  ClipboardList,
  Copy,
  Download,
  Trash2,
  Edit2,
  DollarSign,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Archive,
  Star,
} from "lucide-react";

interface BDClientProps {
  currentUser: SessionUser;
  bdRepresentatives: any[];
  projects: any[]; // Project briefs with bdSource
  submissions: any[];
  allProjects: any[];
}

export const BDClient: React.FC<BDClientProps> = ({
  currentUser,
  bdRepresentatives,
  projects,
  submissions = [],
  allProjects = [],
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tracker" | "submissions" | "library" | "representatives">("submissions");

  // Briefs Tracker Filtering States (Existing)
  const [search, setSearch] = useState("");
  const [bdFilter, setBdFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [selectedBrief, setSelectedBrief] = useState<any | null>(null);

  // Submissions Filtering States
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("All");
  const [subRepFilter, setSubRepFilter] = useState("All");

  // Reusable Library Filtering States
  const [libSearch, setLibSearch] = useState("");
  const [libReusabilityFilter, setLibReusabilityFilter] = useState("All");
  const [libTagFilter, setLibTagFilter] = useState("All");

  // Modal States
  const [isAddRepOpen, setIsAddRepOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  // Submission Form State (Log & Edit)
  const [subFormMode, setSubFormMode] = useState<"create" | "edit">("create");
  const [subFormId, setSubFormId] = useState("");
  const [subForm, setSubForm] = useState({
    title: "",
    clientName: "",
    eventName: "",
    eventDate: "",
    submissionDate: new Date().toISOString().split("T")[0],
    status: "Draft",
    budget: "",
    presentationUrl: "",
    attachmentUrl: "",
    reusableTags: "",
    bdRepId: currentUser.roleName === "BD Representative" ? currentUser.id : bdRepresentatives[0]?.id || "",
    projectIds: [] as string[],
  });

  // Outcome Form State
  const [outcomeForm, setOutcomeForm] = useState({
    status: "Won",
    lossReason: "",
    reusabilityScore: "High",
    notes: "",
    reusableTags: "",
  });

  // Clone Form State
  const [cloneForm, setCloneForm] = useState({
    title: "",
    clientName: "",
    eventName: "",
    submissionDate: new Date().toISOString().split("T")[0],
    eventDate: "",
    cloneProjects: true,
  });

  // Rep Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repForm, setRepForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const isAdmin = currentUser.roleName === "Admin";
  const isBDRep = currentUser.roleName === "BD Representative";
  const isManagement = currentUser.roleName === "Admin" || currentUser.roleName === "Sr. Studio Manager";

  // Filtered briefs (all projects with BD information - Briefs Tracker)
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

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.title.toLowerCase().includes(subSearch.toLowerCase()) ||
        sub.clientName.toLowerCase().includes(subSearch.toLowerCase()) ||
        sub.eventName.toLowerCase().includes(subSearch.toLowerCase());

      const matchesStatus = subStatusFilter === "All" || sub.status === subStatusFilter;
      const matchesRep = subRepFilter === "All" || sub.bdRepId === subRepFilter;

      return matchesSearch && matchesStatus && matchesRep;
    });
  }, [submissions, subSearch, subStatusFilter, subRepFilter]);

  // Extract all unique tags in Library for tag filtering
  const allLibraryTags = useMemo(() => {
    const tagsSet = new Set<string>();
    submissions.forEach((s) => {
      if (s.reusableTags) {
        s.reusableTags.split(",").forEach((t: string) => {
          const trimmed = t.trim();
          if (trimmed) tagsSet.add(trimmed);
        });
      }
    });
    return Array.from(tagsSet);
  }, [submissions]);

  // Filtered Reusable Library
  const filteredLibrary = useMemo(() => {
    return submissions.filter((sub) => {
      // Must be either Won, Lost, or has a set Reusability Rating
      if (!sub.reusabilityScore && sub.status !== "Won" && sub.status !== "Lost") return false;

      const matchesSearch =
        sub.title.toLowerCase().includes(libSearch.toLowerCase()) ||
        sub.clientName.toLowerCase().includes(libSearch.toLowerCase()) ||
        sub.reusableTags.toLowerCase().includes(libSearch.toLowerCase());

      const matchesReusability = libReusabilityFilter === "All" || sub.reusabilityScore === libReusabilityFilter;
      
      let matchesTag = true;
      if (libTagFilter !== "All") {
        matchesTag = sub.reusableTags.split(",").map((t: string) => t.trim().toLowerCase()).includes(libTagFilter.toLowerCase());
      }

      return matchesSearch && matchesReusability && matchesTag;
    });
  }, [submissions, libSearch, libReusabilityFilter, libTagFilter]);

  // Aggregate Brief Stats
  const briefStats = useMemo(() => {
    const list = projects.filter((p) => p.bdSource);
    const total = list.length;
    const pendingClarification = list.filter((p) => p.bdSource.brief_status === "Need Clarification").length;
    const confirmed = list.filter((p) => p.bdSource.brief_status === "Confirmed").length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyIntake = list.filter((p) => new Date(p.briefReceivedDate) >= startOfMonth).length;

    return { total, pendingClarification, confirmed, monthlyIntake };
  }, [projects]);

  // Aggregate Submissions Stats
  const submissionStats = useMemo(() => {
    const total = submissions.length;
    const won = submissions.filter((s) => s.status === "Won").length;
    const lost = submissions.filter((s) => s.status === "Lost").length;
    const pending = submissions.filter((s) => s.status === "Submitted" || s.status === "In Prep" || s.status === "Draft").length;
    
    // Win Rate (Won / Won + Lost)
    const winRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;
    const reusableCount = submissions.filter((s) => s.reusabilityScore === "High" || s.reusabilityScore === "Medium").length;

    // Total Budget
    const totalRevenue = submissions.filter((s) => s.status === "Won").reduce((acc, curr) => acc + (curr.budget || 0), 0);

    return { total, won, lost, pending, winRate, reusableCount, totalRevenue };
  }, [submissions]);

  // Form Handlers
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
        window.location.reload();
      } else {
        toast(res.error || "Failed to add representative", "error");
      }
    } catch (e) {
      toast("Error creating profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLogSubmission = () => {
    setSubFormMode("create");
    setSubForm({
      title: "",
      clientName: "",
      eventName: "",
      eventDate: "",
      submissionDate: new Date().toISOString().split("T")[0],
      status: "Draft",
      budget: "",
      presentationUrl: "",
      attachmentUrl: "",
      reusableTags: "",
      bdRepId: currentUser.roleName === "BD Representative" ? currentUser.id : bdRepresentatives[0]?.id || "",
      projectIds: [],
    });
    setIsSubmissionModalOpen(true);
  };

  const openEditSubmission = (sub: any) => {
    setSubFormMode("edit");
    setSubFormId(sub.id);
    setSubForm({
      title: sub.title,
      clientName: sub.clientName,
      eventName: sub.eventName,
      eventDate: sub.eventDate ? new Date(sub.eventDate).toISOString().split("T")[0] : "",
      submissionDate: new Date(sub.submissionDate).toISOString().split("T")[0],
      status: sub.status,
      budget: sub.budget?.toString() || "",
      presentationUrl: sub.presentationUrl || "",
      attachmentUrl: sub.attachmentUrl || "",
      reusableTags: sub.reusableTags || "",
      bdRepId: sub.bdRepId,
      projectIds: sub.projects ? sub.projects.map((p: any) => p.id) : [],
    });
    setIsSubmissionModalOpen(true);
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...subForm,
      budget: subForm.budget ? parseFloat(subForm.budget) : undefined,
    };

    try {
      let res;
      if (subFormMode === "create") {
        res = await createSubmissionAction(payload);
      } else {
        res = await updateSubmissionAction(subFormId, payload);
      }

      if (res.success) {
        toast(`Submission ${subFormMode === "create" ? "logged" : "updated"} successfully`, "success");
        setIsSubmissionModalOpen(false);
        window.location.reload();
      } else {
        toast(res.error || "Failed to save submission", "error");
      }
    } catch (err) {
      toast("Error saving submission", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOutcomeModal = (sub: any) => {
    setSelectedSubmission(sub);
    setOutcomeForm({
      status: sub.status === "Won" || sub.status === "Lost" ? sub.status : "Won",
      lossReason: sub.lossReason || "",
      reusabilityScore: sub.reusabilityScore || "High",
      notes: sub.notes || "",
      reusableTags: sub.reusableTags || "",
    });
    setIsOutcomeModalOpen(true);
  };

  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await updateSubmissionStatusAction(selectedSubmission.id, outcomeForm);
      if (res.success) {
        toast("Submission outcome updated successfully", "success");
        setIsOutcomeModalOpen(false);
        window.location.reload();
      } else {
        toast(res.error || "Failed to update outcome", "error");
      }
    } catch (err) {
      toast("Error updating outcome", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCloneModal = (sub: any) => {
    setSelectedSubmission(sub);
    setCloneForm({
      title: `${sub.title} (Cloned)`,
      clientName: "",
      eventName: sub.eventName,
      submissionDate: new Date().toISOString().split("T")[0],
      eventDate: sub.eventDate ? new Date(sub.eventDate).toISOString().split("T")[0] : "",
      cloneProjects: true,
    });
    setIsCloneModalOpen(true);
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await cloneSubmissionAction(selectedSubmission.id, cloneForm);
      if (res.success) {
        toast("Submission and associated 3D jobs cloned successfully!", "success");
        setIsCloneModalOpen(false);
        window.location.reload();
      } else {
        toast(res.error || "Failed to clone", "error");
      }
    } catch (err) {
      toast("Error cloning submission", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this submission tracker? Linked projects will NOT be deleted, but will be unlinked.")) {
      return;
    }

    try {
      const res = await deleteSubmissionAction(id);
      if (res.success) {
        toast("Submission tracker deleted", "success");
        window.location.reload();
      } else {
        toast(res.error || "Failed to delete", "error");
      }
    } catch (err) {
      toast("Error deleting submission", "error");
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

  const getSubStatusBadge = (status: string) => {
    switch (status) {
      case "Won":
        return <Badge variant="green" className="gap-1"><ThumbsUp className="w-3 h-3" /> Won</Badge>;
      case "Lost":
        return <Badge variant="red" className="gap-1"><ThumbsDown className="w-3 h-3" /> Lost</Badge>;
      case "Submitted":
        return <Badge variant="blue">Submitted</Badge>;
      case "In Prep":
        return <Badge variant="yellow">In Prep</Badge>;
      case "Draft":
        return <Badge variant="gray">Draft</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getReusabilityBadge = (score: string) => {
    switch (score) {
      case "High":
        return <Badge variant="green" className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1"><Star className="w-3 h-3 fill-emerald-800" /> High Reusability</Badge>;
      case "Medium":
        return <Badge variant="blue" className="bg-blue-100 text-blue-800 border-blue-200 gap-1"><Star className="w-3 h-3 fill-blue-800" /> Medium</Badge>;
      case "Low":
        return <Badge variant="gray" className="bg-zinc-100 text-zinc-800 border-zinc-200">Low Reusability</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Head */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-studio-black">Business Development Hub</h2>
          <p className="text-sm text-studio-gray-text">
            Track pitch submissions workflows, project outcomes, costing budgets, and explore the Reusable Design Asset Library.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white rounded-md border border-studio-gray-border p-0.5 shadow-sm">
            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "submissions"
                  ? "bg-zinc-900 text-white"
                  : "text-studio-gray-text hover:text-studio-black"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Submissions Tracker
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "library"
                  ? "bg-zinc-900 text-white"
                  : "text-studio-gray-text hover:text-studio-black"
              }`}
            >
              <Archive className="w-3.5 h-3.5" /> Reusable Library
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "tracker"
                  ? "bg-zinc-900 text-white"
                  : "text-studio-gray-text hover:text-studio-black"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Briefs Intake
            </button>
            <button
              onClick={() => setActiveTab("representatives")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "representatives"
                  ? "bg-zinc-900 text-white"
                  : "text-studio-gray-text hover:text-studio-black"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> BD Performance
            </button>
          </div>

          {activeTab === "submissions" && (
            <Button onClick={openLogSubmission} className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
              <Plus className="w-4 h-4" /> Log New Pitch
            </Button>
          )}

          {isAdmin && activeTab === "representatives" && (
            <Button onClick={() => setIsAddRepOpen(true)} className="gap-2 bg-studio-red hover:bg-studio-red-hover text-white">
              <Plus className="w-4 h-4" /> Add BD Representative
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTab === "tracker" ? (
          <>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Total Briefs</p>
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
                  <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Intake (Month)</p>
                  <h3 className="text-2xl font-black text-studio-black">{briefStats.monthlyIntake} Briefs</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-zinc-600" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Total Pitches Logged</p>
                  <h3 className="text-2xl font-black text-studio-black">{submissionStats.total} Pitches</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-zinc-700" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Submission Win Rate</p>
                  <h3 className="text-2xl font-black text-green-600">{submissionStats.winRate}% Success</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Won Pitch Costing/Revenue</p>
                  <h3 className="text-2xl font-black text-studio-red">
                    ৳{submissionStats.totalRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-studio-red" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-studio-gray-text uppercase tracking-wider">Reusable Designs Library</p>
                  <h3 className="text-2xl font-black text-blue-600">{submissionStats.reusableCount} Designs</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* TABS CONTAINER */}

      {/* TAB 1: BRIEF INTAKE (Existing code) */}
      {activeTab === "tracker" && (
        <>
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

          <Card>
            <CardContent className="p-0 overflow-x-auto">
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
      )}

      {/* TAB 2: SUBMISSIONS TRACKER */}
      {activeTab === "submissions" && (
        <>
          {/* Submissions Filter */}
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-studio-gray-text" />
                <Input
                  placeholder="Search pitch, client, event..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select
                  options={[
                    { label: "All Pitch Statuses", value: "All" },
                    { label: "Draft", value: "Draft" },
                    { label: "In Prep", value: "In Prep" },
                    { label: "Submitted", value: "Submitted" },
                    { label: "Won", value: "Won" },
                    { label: "Lost", value: "Lost" },
                  ]}
                  value={subStatusFilter}
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                />
              </div>

              <div>
                <Select
                  options={[
                    { label: "All BD Representatives", value: "All" },
                    ...bdRepresentatives.map(r => ({ label: r.name, value: r.id }))
                  ]}
                  value={subRepFilter}
                  onChange={(e) => setSubRepFilter(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 text-sm text-studio-gray-text">
                  No pitch submissions tracked yet. Click "Log New Pitch" to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pitch Title / Client</TableHead>
                      <TableHead>BD Rep</TableHead>
                      <TableHead>Submission / Event Date</TableHead>
                      <TableHead>Costing / Budget</TableHead>
                      <TableHead>Associated 3D Jobs (Studio)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((sub) => {
                      return (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <span className="font-bold text-studio-black block">{sub.title}</span>
                            <span className="text-[10px] text-studio-gray-text block">Client: {sub.clientName} | Event: {sub.eventName}</span>
                            {sub.reusableTags && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {sub.reusableTags.split(",").map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 border-zinc-200 bg-zinc-50 text-zinc-600">
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-studio-gray-darkText">
                            {sub.bdRep?.name || "Unassigned"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>Sub: <span className="font-medium text-studio-black">{new Date(sub.submissionDate).toLocaleDateString()}</span></div>
                            {sub.eventDate && (
                              <div className="text-studio-gray-text text-[10px]">Event: {new Date(sub.eventDate).toLocaleDateString()}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-studio-black">
                            {sub.budget ? `৳${sub.budget.toLocaleString()}` : "৳0"}
                          </TableCell>
                          <TableCell>
                            {sub.projects && sub.projects.length > 0 ? (
                              <div className="space-y-1">
                                {sub.projects.map((proj: any) => (
                                  <div key={proj.id} className="flex items-center gap-1.5 text-[10px]">
                                    <Link href={`/projects/${proj.id}`} className="font-bold hover:underline text-studio-black max-w-[120px] truncate block">
                                      {proj.name}
                                    </Link>
                                    <span className="opacity-75">({proj.status})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-400 italic">No 3D Jobs linked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getSubStatusBadge(sub.status)}
                            {sub.reusabilityScore && (
                              <div className="mt-1">
                                <Badge className="text-[8px] bg-emerald-50 text-emerald-800 border-emerald-100">
                                  {sub.reusabilityScore} Reuse
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-2"
                                title="Update Outcome"
                                onClick={() => openOutcomeModal(sub)}
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Outcome
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="px-2"
                                title="Clone Pitch"
                                onClick={() => openCloneModal(sub)}
                              >
                                <Copy className="w-3.5 h-3.5 text-blue-600" /> Clone
                              </Button>

                              <Button
                                size="sm"
                                variant="secondary"
                                className="px-2"
                                title="Edit Pitch Details"
                                onClick={() => openEditSubmission(sub)}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-zinc-700" />
                              </Button>

                              {isManagement && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-2 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  title="Delete Pitch"
                                  onClick={() => handleDeleteSubmission(sub.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </Button>
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
        </>
      )}

      {/* TAB 3: REUSABLE ASSET LIBRARY */}
      {activeTab === "library" && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-studio-gray-text" />
                <Input
                  placeholder="Search design tags, clients, or concept titles..."
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select
                  options={[
                    { label: "All Reusability Ratings", value: "All" },
                    { label: "High Reusability", value: "High" },
                    { label: "Medium Reusability", value: "Medium" },
                    { label: "Low Reusability", value: "Low" },
                  ]}
                  value={libReusabilityFilter}
                  onChange={(e) => setLibReusabilityFilter(e.target.value)}
                />
              </div>

              <div>
                <Select
                  options={[
                    { label: "All Tag Categories", value: "All" },
                    ...allLibraryTags.map((tag) => ({ label: tag, value: tag })),
                  ]}
                  value={libTagFilter}
                  onChange={(e) => setLibTagFilter(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Library Cards Grid */}
          {filteredLibrary.length === 0 ? (
            <div className="text-center py-12 text-sm text-studio-gray-text bg-white border border-studio-gray-border rounded-lg">
              No design assets cataloged in the library yet. Log pitches and mark outcomes (Won/Lost) with reusability tags to build the catalog.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLibrary.map((sub) => {
                return (
                  <Card key={sub.id} className="flex flex-col border border-zinc-200 hover:shadow-md transition-shadow">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Client: {sub.clientName}</span>
                          <CardTitle className="text-base font-bold text-zinc-900 mt-1 leading-snug">{sub.title}</CardTitle>
                        </div>
                        {getSubStatusBadge(sub.status)}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sub.reusableTags ? (
                          sub.reusableTags.split(",").map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 border-zinc-200 bg-zinc-50 text-zinc-600">
                              {tag.trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">No tags</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="p-3 bg-zinc-50 rounded border border-zinc-100 text-xs">
                          <p className="font-semibold text-zinc-800">Presentation Pitch Feedback / Notes:</p>
                          <p className="text-zinc-600 italic mt-1 leading-relaxed">
                            {sub.notes || "No design documentation added."}
                          </p>
                          {sub.lossReason && (
                            <div className="mt-2 text-red-700 bg-red-50 border border-red-100 p-2 rounded">
                              <span className="font-bold">Reason Not Obtained:</span> {sub.lossReason}
                            </div>
                          )}
                        </div>

                        {/* Costing indicator */}
                        <div className="flex justify-between items-center text-xs border-b border-zinc-100 pb-2">
                          <span className="text-zinc-500 font-medium">Estimated Budget:</span>
                          <span className="font-bold text-zinc-900">৳{sub.budget ? sub.budget.toLocaleString() : "0"}</span>
                        </div>

                        {/* Associated 3D jobs */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Associated 3D Assets:</span>
                          <div className="space-y-1.5 mt-1.5">
                            {sub.projects && sub.projects.length > 0 ? (
                              sub.projects.map((proj: any) => (
                                <div key={proj.id} className="flex justify-between items-center bg-white border border-zinc-150 p-2 rounded text-xs shadow-sm hover:border-zinc-300">
                                  <div>
                                    <Link href={`/projects/${proj.id}`} className="font-bold text-zinc-800 hover:text-studio-red hover:underline block truncate max-w-[150px]">
                                      {proj.name}
                                    </Link>
                                    <span className="text-[9px] text-zinc-500">{proj.projectType}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] font-semibold bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                                      {proj.status}
                                    </span>
                                    {proj.referenceLink && (
                                      <a
                                        href={proj.referenceLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] font-bold text-studio-red block hover:underline mt-1"
                                      >
                                        Source Assets <ExternalLink className="w-2.5 h-2.5 inline" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-zinc-400 italic">No studio project linked to this pitch</p>
                            )}
                          </div>
                        </div>

                        {/* Presentation File URLs */}
                        {(sub.presentationUrl || sub.attachmentUrl) && (
                          <div className="flex flex-col gap-1.5 pt-2">
                            {sub.presentationUrl && (
                              <a
                                href={sub.presentationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-studio-red font-semibold hover:underline"
                              >
                                <Download className="w-3.5 h-3.5" /> Pitch Slide Deck (PPT)
                              </a>
                            )}
                            {sub.attachmentUrl && (
                              <a
                                href={sub.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-studio-red font-semibold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" /> Project Costing / Excel Attachment
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick Re-use Action */}
                      <div className="flex justify-between items-center pt-4 border-t border-zinc-200 mt-4">
                        {getReusabilityBadge(sub.reusabilityScore)}
                        <Button
                          size="sm"
                          className="bg-zinc-900 hover:bg-zinc-800 text-white gap-1.5 text-xs font-bold shadow-sm"
                          onClick={() => openCloneModal(sub)}
                        >
                          <Copy className="w-3.5 h-3.5" /> Clone Pitch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 4: BD PERFORMANCE METRICS */}
      {activeTab === "representatives" && (
        <Card>
          <CardHeader>
            <CardTitle>Business Development Team Metrics</CardTitle>
            <CardDescription>Intake activity, conversions, and pending pipeline details per BD member</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {bdRepresentatives.length === 0 ? (
              <p className="text-sm text-studio-gray-text italic text-center py-6">No representatives registered</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Representative Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Total intake briefs</TableHead>
                    <TableHead>Pitches Logged</TableHead>
                    <TableHead>Pitches Won</TableHead>
                    <TableHead>Pitches Lost</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Completed Projects</TableHead>
                    <TableHead>Roster Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bdRepresentatives.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-bold text-studio-black">{rep.name}</TableCell>
                      <TableCell className="text-xs font-semibold text-studio-gray-darkText">{rep.email}</TableCell>
                      <TableCell className="text-xs font-medium text-center">{rep.totalReceived} briefs</TableCell>
                      <TableCell className="text-xs font-bold text-center text-zinc-950">{rep.totalSubmissions || 0} pitches</TableCell>
                      <TableCell className="text-xs font-black text-green-600 text-center">{rep.wonCount || 0} won</TableCell>
                      <TableCell className="text-xs font-black text-red-600 text-center">{rep.lostCount || 0} lost</TableCell>
                      <TableCell className="text-xs font-black text-center text-studio-red">
                        {rep.winRate || 0}%
                      </TableCell>
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

      {/* MODALS */}

      {/* Log / Edit Submission Modal */}
      <Modal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        title={subFormMode === "create" ? "Log New Presentation Pitch" : "Edit Pitch Details"}
        size="lg"
      >
        <form onSubmit={handleSubmissionSubmit} className="space-y-4 text-xs font-semibold text-studio-black">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="subTitle">Pitch Title *</Label>
              <Input
                id="subTitle"
                required
                placeholder="DHL Gala Night 2026 Presentation"
                value={subForm.title}
                onChange={(e) => setSubForm({ ...subForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subClient">Target Client *</Label>
              <Input
                id="subClient"
                required
                placeholder="DHL Bangladesh"
                value={subForm.clientName}
                onChange={(e) => setSubForm({ ...subForm, clientName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="subEvent">Event Name *</Label>
              <Input
                id="subEvent"
                required
                placeholder="DHL Annual Gala Dinner"
                value={subForm.eventName}
                onChange={(e) => setSubForm({ ...subForm, eventName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subBudget">Pitch Costing / Budget (৳)</Label>
              <Input
                id="subBudget"
                type="number"
                placeholder="500000"
                value={subForm.budget}
                onChange={(e) => setSubForm({ ...subForm, budget: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="subDate">Submission / Pitch Date *</Label>
              <Input
                id="subDate"
                type="date"
                required
                value={subForm.submissionDate}
                onChange={(e) => setSubForm({ ...subForm, submissionDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subEventDate">Expected Event Date</Label>
              <Input
                id="subEventDate"
                type="date"
                value={subForm.eventDate}
                onChange={(e) => setSubForm({ ...subForm, eventDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="subStatus">Pipeline Status</Label>
              <Select
                id="subStatus"
                options={[
                  { label: "Draft", value: "Draft" },
                  { label: "In Prep", value: "In Prep" },
                  { label: "Submitted", value: "Submitted" },
                  { label: "Won", value: "Won" },
                  { label: "Lost", value: "Lost" },
                ]}
                value={subForm.status}
                onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subRep">BD Representative Owner</Label>
              <Select
                id="subRep"
                disabled={isBDRep}
                options={bdRepresentatives.map(r => ({ label: r.name, value: r.id }))}
                value={subForm.bdRepId}
                onChange={(e) => setSubForm({ ...subForm, bdRepId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="subPpt">PPT Presentation URL (PPT/Drive)</Label>
              <Input
                id="subPpt"
                placeholder="https://drive.google.com/file/d/pitch-slide-ppt"
                value={subForm.presentationUrl}
                onChange={(e) => setSubForm({ ...subForm, presentationUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subExcel">Excel Costing Sheet URL</Label>
              <Input
                id="subExcel"
                placeholder="https://drive.google.com/file/d/costing-sheet-xls"
                value={subForm.attachmentUrl}
                onChange={(e) => setSubForm({ ...subForm, attachmentUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="subTags">Reusability Search Tags (Comma separated) *</Label>
            <Input
              id="subTags"
              required
              placeholder="LED Tunnel, Gala Dinner, Cyberpunk Stage, Corporate"
              value={subForm.reusableTags}
              onChange={(e) => setSubForm({ ...subForm, reusableTags: e.target.value })}
            />
          </div>

          {/* Link Associated 3D jobs (Projects) */}
          <div className="space-y-2 border-t border-zinc-150 pt-3">
            <Label>Link Associated 3D Jobs (Studio Projects)</Label>
            <div className="max-h-[140px] overflow-y-auto border border-zinc-200 rounded p-2.5 bg-zinc-50 space-y-1.5">
              {allProjects.length === 0 ? (
                <p className="text-zinc-400 italic text-[11px]">No projects exist to link.</p>
              ) : (
                allProjects.map((p) => {
                  const isChecked = subForm.projectIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-zinc-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          let updated = [...subForm.projectIds];
                          if (isChecked) {
                            updated = updated.filter((id) => id !== p.id);
                          } else {
                            updated.push(p.id);
                          }
                          setSubForm({ ...subForm, projectIds: updated });
                        }}
                      />
                      <span>
                        <span className="font-bold">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 ml-1">(Client: {p.clientName} | Status: {p.status})</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
            <Button type="button" variant="outline" onClick={() => setIsSubmissionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Saving..." : "Save Pitch"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Outcome Modal */}
      <Modal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        title={selectedSubmission ? `Update Outcome: ${selectedSubmission.title}` : "Update Outcome"}
        size="md"
      >
        <form onSubmit={handleOutcomeSubmit} className="space-y-4 text-xs font-semibold text-studio-black">
          <div className="space-y-1">
            <Label htmlFor="outStatus">Pitch Outcome</Label>
            <Select
              id="outStatus"
              options={[
                { label: "Won", value: "Won" },
                { label: "Lost", value: "Lost" },
                { label: "Submitted", value: "Submitted" },
                { label: "In Prep", value: "In Prep" },
                { label: "Draft", value: "Draft" },
              ]}
              value={outcomeForm.status}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, status: e.target.value })}
            />
          </div>

          {outcomeForm.status === "Lost" && (
            <div className="space-y-1">
              <Label htmlFor="outLossReason">Reason for Loss *</Label>
              <Input
                id="outLossReason"
                required
                placeholder="Competitor price lower / Concept not matched / Event cancelled"
                value={outcomeForm.lossReason}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, lossReason: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="outReusability">Reusability Score</Label>
              <Select
                id="outReusability"
                options={[
                  { label: "High Reusability", value: "High" },
                  { label: "Medium Reusability", value: "Medium" },
                  { label: "Low Reusability", value: "Low" },
                ]}
                value={outcomeForm.reusabilityScore}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, reusabilityScore: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="outTags">Update Design Tags</Label>
              <Input
                id="outTags"
                placeholder="LED Tunnel, Gala, Stage, Cyberpunk"
                value={outcomeForm.reusableTags}
                onChange={(e) => setOutcomeForm({ ...outcomeForm, reusableTags: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="outNotes">Outcome Feedback & Archive Notes</Label>
            <Textarea
              id="outNotes"
              placeholder="Client loved the 3D LED tunnel visual, but competitor offered a cheaper package. The 3D tunnel designs are 100% reusable for corporate dinner pitches."
              value={outcomeForm.notes}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
            <Button type="button" variant="outline" onClick={() => setIsOutcomeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Updating..." : "Update Outcome"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Clone Submission Modal */}
      <Modal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        title={selectedSubmission ? `Clone Submission: ${selectedSubmission.title}` : "Clone Submission"}
        size="md"
      >
        <form onSubmit={handleCloneSubmit} className="space-y-4 text-xs font-semibold text-studio-black">
          <div className="bg-zinc-50 border border-zinc-150 p-3 rounded leading-normal mb-2 text-zinc-600">
            You are cloning this pitch and its metadata (reusable tags, budgets, and presentation files) for a new event or client.
          </div>

          <div className="space-y-1">
            <Label htmlFor="cloneTitle">New Pitch Title *</Label>
            <Input
              id="cloneTitle"
              required
              placeholder="e.g. Robi Gala 3D Presentation"
              value={cloneForm.title}
              onChange={(e) => setCloneForm({ ...cloneForm, title: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cloneClient">New Target Client Name *</Label>
            <Input
              id="cloneClient"
              required
              placeholder="e.g. Robi Axiata"
              value={cloneForm.clientName}
              onChange={(e) => setCloneForm({ ...cloneForm, clientName: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cloneEvent">New Event Name *</Label>
            <Input
              id="cloneEvent"
              required
              placeholder="e.g. Robi Annual Retailer Gala"
              value={cloneForm.eventName}
              onChange={(e) => setCloneForm({ ...cloneForm, eventName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cloneSubDate">Submission Date *</Label>
              <Input
                id="cloneSubDate"
                type="date"
                required
                value={cloneForm.submissionDate}
                onChange={(e) => setCloneForm({ ...cloneForm, submissionDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cloneEventDate">Expected Event Date</Label>
              <Input
                id="cloneEventDate"
                type="date"
                value={cloneForm.eventDate}
                onChange={(e) => setCloneForm({ ...cloneForm, eventDate: e.target.value })}
              />
            </div>
          </div>

          {/* Option to clone projects */}
          {selectedSubmission?.projects && selectedSubmission.projects.length > 0 && (
            <div className="p-3 bg-red-50/50 border border-studio-red/20 rounded mt-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={cloneForm.cloneProjects}
                  onChange={(e) => setCloneForm({ ...cloneForm, cloneProjects: e.target.checked })}
                />
                <div>
                  <span className="font-bold text-zinc-950 block">Clone Associated 3D Jobs at IMS Studio ({selectedSubmission.projects.length})</span>
                  <span className="text-[10px] text-zinc-500 block leading-normal mt-0.5">
                    This will duplicate the {selectedSubmission.projects.length} digital content creation projects in the studio, setting their status to "Not Started" so visualizers can work on the new customized version of this concept.
                  </span>
                </div>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
            <Button type="button" variant="outline" onClick={() => setIsCloneModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-studio-red hover:bg-studio-red-hover text-white">
              {isSubmitting ? "Cloning..." : "Clone & Start Workflow"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Brief Detail Modal (Existing) */}
      <Modal
        isOpen={!!selectedBrief}
        onClose={() => setSelectedBrief(null)}
        title="Business Development Brief Overview"
        size="md"
      >
        {selectedBrief && (
          <div className="space-y-4 text-xs font-semibold text-studio-black">
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

      {/* Add BD Representative Modal (Existing) */}
      <Modal isOpen={isAddRepOpen} onClose={() => setIsAddRepOpen(false)} title="Register BD Representative" size="sm">
        <form onSubmit={handleAddRepSubmit} className="space-y-4 text-xs font-semibold text-studio-black">
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

