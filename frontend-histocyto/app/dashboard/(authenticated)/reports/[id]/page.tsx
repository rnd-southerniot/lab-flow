"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { reportsService, patientsService, pdfService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  PenTool,
  Globe,
  Download,
  FileEdit,
  History,
} from "lucide-react";
import Link from "next/link";

interface Report {
  id: number;
  patient_id: number;
  invoice_no: string;
  report_type: string;
  specimen: string | null;
  gross_examination: string | null;
  microscopic_examination: string | null;
  diagnosis: string | null;
  icd_code: string | null;
  special_stains: string | null;
  immunohistochemistry: string | null;
  comments: string | null;
  status: string;
  is_amended: boolean;
  amendment_reason: string | null;
  original_report_id: number | null;
  created_at: string;
  verified_at: string | null;
  signed_at: string | null;
  published_at: string | null;
}

interface Patient {
  id: number;
  invoice_no: string;
  patient_name: string;
  age: number;
  age_unit: string;
  sex: string;
  consultant_name: string;
  investigation_type: string;
  receive_date: string;
}

export default function ReportDetailPage() {
  const { token, isAdmin, isDoctor } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [amendDialogOpen, setAmendDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [signPassword, setSignPassword] = useState("");
  const [amendReason, setAmendReason] = useState("");

  const reportId = parseInt(params.id as string, 10);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const reportData = await reportsService.getById(reportId, token);
        setReport(reportData);

        // Fetch patient info
        const patientData = await patientsService.getByInvoice(
          reportData.invoice_no,
          token
        );
        setPatient(patientData);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, reportId]);

  const handleSubmit = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const updated = await reportsService.submit(reportId, token);
      setReport(updated);
      setSubmitDialogOpen(false);
    } catch (error: any) {
      alert(error.message || "Failed to submit report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const updated = await reportsService.verify(reportId, token);
      setReport(updated);
    } catch (error: any) {
      alert(error.message || "Failed to verify report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectReason) return;
    setActionLoading(true);
    try {
      const updated = await reportsService.reject(reportId, rejectReason, token);
      setReport(updated);
      setRejectDialogOpen(false);
      setRejectReason("");
    } catch (error: any) {
      alert(error.message || "Failed to reject report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSign = async () => {
    if (!token || !signPassword) return;
    setActionLoading(true);
    try {
      const updated = await reportsService.sign(reportId, signPassword, token);
      setReport(updated);
      setSignDialogOpen(false);
      setSignPassword("");
    } catch (error: any) {
      alert(error.message || "Failed to sign report");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const updated = await reportsService.publish(reportId, token);
      setReport(updated);
    } catch (error: any) {
      alert(error.message || "Failed to publish report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAmend = async () => {
    if (!token || !amendReason) return;
    setActionLoading(true);
    try {
      const amended = await reportsService.amend(reportId, amendReason, token);
      router.push(`/dashboard/reports/${amended.id}/edit`);
    } catch (error: any) {
      alert(error.message || "Failed to create amendment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token) return;
    try {
      const blob = await pdfService.getReportPdf(reportId, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${report?.invoice_no}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert("Failed to download PDF");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "signed":
        return <Badge variant="info">Signed</Badge>;
      case "verified":
        return <Badge variant="info">Verified</Badge>;
      case "pending_verification":
        return <Badge variant="warning">Pending Verification</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Report not found</p>
        <Link href="/dashboard/reports">
          <Button className="mt-4">Back to Reports</Button>
        </Link>
      </div>
    );
  }

  const canEdit = report.status === "draft" || report.status === "pending_verification";
  const canSubmit = report.status === "draft";
  const canVerify = isAdmin && report.status === "pending_verification";
  const canSign = isDoctor && report.status === "verified";
  const canPublish = report.status === "signed";
  const canAmend = report.status === "published";
  const canDownload = report.status === "published";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{report.report_type} Report</h1>
            <p className="text-muted-foreground">{report.invoice_no}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          {report.is_amended && <Badge variant="warning">Amendment</Badge>}
        </div>
      </div>

      {/* Workflow Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Link href={`/dashboard/reports/${report.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}

            {canSubmit && (
              <Button onClick={() => setSubmitDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Verification
              </Button>
            )}

            {canVerify && (
              <>
                <Button onClick={handleVerify} disabled={actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}

            {canSign && (
              <Button onClick={() => setSignDialogOpen(true)}>
                <PenTool className="h-4 w-4 mr-2" />
                Sign Report
              </Button>
            )}

            {canPublish && (
              <Button onClick={handlePublish} disabled={actionLoading}>
                <Globe className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}

            {canDownload && (
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}

            {canAmend && (
              <Button variant="outline" onClick={() => setAmendDialogOpen(true)}>
                <FileEdit className="h-4 w-4 mr-2" />
                Create Amendment
              </Button>
            )}

            <Link href={`/dashboard/reports/${report.id}/history`}>
              <Button variant="ghost">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Patient Info */}
      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Invoice No.</Label>
                <p className="font-medium">{patient.invoice_no}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Patient Name</Label>
                <p className="font-medium">{patient.patient_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Age/Sex</Label>
                <p className="font-medium">
                  {patient.age} {patient.age_unit} / {patient.sex}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Consultant</Label>
                <p className="font-medium">{patient.consultant_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {report.specimen && (
            <div>
              <Label className="text-muted-foreground font-semibold">Specimen</Label>
              <p className="mt-1 whitespace-pre-wrap">{report.specimen}</p>
            </div>
          )}

          {report.gross_examination && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground font-semibold">Gross Examination</Label>
              <p className="mt-1 whitespace-pre-wrap">{report.gross_examination}</p>
            </div>
          )}

          {report.microscopic_examination && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground font-semibold">Microscopic Examination</Label>
              <p className="mt-1 whitespace-pre-wrap">{report.microscopic_examination}</p>
            </div>
          )}

          {report.diagnosis && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground font-semibold">Diagnosis</Label>
              <p className="mt-1 whitespace-pre-wrap">{report.diagnosis}</p>
            </div>
          )}

          {report.icd_code && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground font-semibold">ICD Code</Label>
              <p className="mt-1">{report.icd_code}</p>
            </div>
          )}

          {report.special_stains && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground font-semibold">Special Stains</Label>
              <p className="mt-1 whitespace-pre-wrap">{report.special_stains}</p>
            </div>
          )}

          {report.immunohistochemistry && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground font-semibold">Immunohistochemistry</Label>
              <p className="mt-1 whitespace-pre-wrap">{report.immunohistochemistry}</p>
            </div>
          )}

          {report.comments && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground font-semibold">Comments</Label>
              <p className="mt-1 whitespace-pre-wrap">{report.comments}</p>
            </div>
          )}

          {report.amendment_reason && (
            <div className="border-t pt-4 bg-yellow-50 -mx-6 -mb-6 p-6">
              <Label className="text-yellow-800 font-semibold">Amendment Reason</Label>
              <p className="mt-1 text-yellow-700">{report.amendment_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p>{formatDate(report.created_at)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Verified</Label>
              <p>{formatDate(report.verified_at)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Signed</Label>
              <p>{formatDate(report.signed_at)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Published</Label>
              <p>{formatDate(report.published_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent onClose={() => setSubmitDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Submit for Verification</DialogTitle>
            <DialogDescription>
              Submit this report for admin verification. Make sure all required
              fields are filled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent onClose={() => setRejectDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The report will be sent back to draft.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Rejection Reason *</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this report is being rejected..."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason}
            >
              {actionLoading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent onClose={() => setSignDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Sign Report</DialogTitle>
            <DialogDescription>
              Enter your signature password to digitally sign this report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Signature Password *</Label>
            <Input
              type="password"
              value={signPassword}
              onChange={(e) => setSignPassword(e.target.value)}
              placeholder="Enter your signature password"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={actionLoading || !signPassword}>
              {actionLoading ? "Signing..." : "Sign Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amend Dialog */}
      <Dialog open={amendDialogOpen} onOpenChange={setAmendDialogOpen}>
        <DialogContent onClose={() => setAmendDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Amendment</DialogTitle>
            <DialogDescription>
              Create an amended version of this report. The original will remain
              unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Amendment Reason *</Label>
            <Textarea
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
              placeholder="Explain why this report needs to be amended..."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAmend} disabled={actionLoading || !amendReason}>
              {actionLoading ? "Creating..." : "Create Amendment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
