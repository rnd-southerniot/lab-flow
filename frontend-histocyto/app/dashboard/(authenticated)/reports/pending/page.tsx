"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { reportsService, patientsService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Report {
  id: number;
  invoice_no: string;
  patient_id: number;
  report_type: string;
  specimen: string | null;
  diagnosis: string | null;
  created_at: string;
}

export default function PendingReportsPage() {
  const { token, isAdmin } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard/reports");
      return;
    }

    const fetchPending = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await reportsService.getPending(token);
        setReports(data);
      } catch (error) {
        console.error("Failed to fetch pending reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [token, isAdmin, router]);

  const handleVerify = async (reportId: number) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await reportsService.verify(reportId, token);
      setReports(reports.filter((r) => r.id !== reportId));
    } catch (error: any) {
      alert(error.message || "Failed to verify report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !selectedReport || !rejectReason) return;
    setActionLoading(true);
    try {
      await reportsService.reject(selectedReport.id, rejectReason, token);
      setReports(reports.filter((r) => r.id !== selectedReport.id));
      setRejectDialogOpen(false);
      setSelectedReport(null);
      setRejectReason("");
    } catch (error: any) {
      alert(error.message || "Failed to reject report");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Reports Pending Verification</h1>
        <Badge variant="warning">{reports.length} Pending</Badge>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground">
              No reports pending verification
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {report.invoice_no}
                      </h3>
                      <Badge variant="outline">{report.report_type}</Badge>
                    </div>

                    {report.specimen && (
                      <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Specimen: </span>
                        {report.specimen.substring(0, 150)}
                        {report.specimen.length > 150 && "..."}
                      </div>
                    )}

                    {report.diagnosis && (
                      <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Diagnosis: </span>
                        {report.diagnosis.substring(0, 150)}
                        {report.diagnosis.length > 150 && "..."}
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Submitted: {formatDate(report.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/dashboard/reports/${report.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleVerify(report.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSelectedReport(report);
                        setRejectReason("");
                        setRejectDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent onClose={() => setRejectDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this report. It will be sent back to draft status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this report is being rejected..."
                rows={3}
                required
              />
            </div>
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
              {actionLoading ? "Rejecting..." : "Reject Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
