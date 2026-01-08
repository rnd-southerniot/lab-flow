"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { patientsService, reportsService } from "@/services/api";
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
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface Patient {
  id: number;
  invoice_no: string;
  receive_date: string;
  reporting_date: string | null;
  patient_name: string;
  age: number;
  age_unit: string;
  sex: string;
  consultant_name: string;
  consultant_designation: string | null;
  investigation_type: string;
  clinical_information: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  verification_status: string;
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string;
}

interface Report {
  id: number;
  invoice_no: string;
  report_type: string;
  status: string;
  created_at: string;
}

export default function PatientDetailPage() {
  const { token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const patientId = parseInt(params.id as string, 10);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const patientData = await patientsService.getById(patientId, token);
        setPatient(patientData);

        // Fetch reports for this patient
        const reportsData = await reportsService.getByPatient(
          patientData.invoice_no,
          token
        );
        setReports(reportsData);
      } catch (error) {
        console.error("Failed to fetch patient:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, patientId]);

  const handleVerify = async () => {
    if (!token || !patient) return;
    setActionLoading(true);
    try {
      await patientsService.verify(patient.id, verifyNotes || null, token);
      setPatient({ ...patient, verification_status: "verified" });
      setVerifyDialogOpen(false);
    } catch (error) {
      console.error("Failed to verify patient:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !patient || !rejectNotes) return;
    setActionLoading(true);
    try {
      await patientsService.reject(patient.id, rejectNotes, token);
      setPatient({ ...patient, verification_status: "rejected" });
      setRejectDialogOpen(false);
    } catch (error) {
      console.error("Failed to reject patient:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending Verification</Badge>;
    }
  };

  const getReportStatusBadge = (status: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found</p>
        <Link href="/dashboard/patients">
          <Button className="mt-4">Back to Patients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{patient.patient_name}</h1>
            <p className="text-muted-foreground">{patient.invoice_no}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(patient.verification_status)}

          {isAdmin && patient.verification_status === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-green-600 border-green-600"
                onClick={() => setVerifyDialogOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-600"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {patient.verification_status !== "verified" && (
            <Link href={`/dashboard/patients/${patient.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Patient Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground">Invoice No.</Label>
              <p className="font-medium">{patient.invoice_no}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Receive Date</Label>
              <p className="font-medium">{formatDate(patient.receive_date)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Reporting Date</Label>
              <p className="font-medium">{formatDate(patient.reporting_date)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Investigation Type</Label>
              <p className="font-medium">{patient.investigation_type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{patient.patient_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Age</Label>
              <p className="font-medium">
                {patient.age} {patient.age_unit}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Sex</Label>
              <p className="font-medium">{patient.sex}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{patient.phone || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Consultant / Referred by</Label>
              <p className="font-medium">
                {patient.consultant_name}
                {patient.consultant_designation && `, ${patient.consultant_designation}`}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{patient.email || "-"}</p>
            </div>
          </div>

          {patient.clinical_information && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-muted-foreground">Clinical Information</Label>
              <p className="mt-1 whitespace-pre-wrap">{patient.clinical_information}</p>
            </div>
          )}

          {patient.address && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-muted-foreground">Address</Label>
              <p className="mt-1">{patient.address}</p>
            </div>
          )}

          {patient.verification_notes && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-muted-foreground">Verification Notes</Label>
              <p className="mt-1">{patient.verification_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reports</CardTitle>
          {patient.verification_status === "verified" && (
            <Link
              href={`/dashboard/reports/new?patient_id=${patient.id}&invoice_no=${patient.invoice_no}&investigation_type=${patient.investigation_type}`}
            >
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No reports yet</p>
              {patient.verification_status !== "verified" && (
                <p className="text-sm">Patient must be verified before creating a report</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{report.report_type} Report</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDate(report.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getReportStatusBadge(report.status)}
                    <Link href={`/dashboard/reports/${report.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent onClose={() => setVerifyDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Verify Patient</DialogTitle>
            <DialogDescription>
              Confirm that patient details are correct
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Verification Notes (Optional)</Label>
              <Textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={actionLoading}>
              {actionLoading ? "Verifying..." : "Verify Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent onClose={() => setRejectDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Reject Patient</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Explain why this patient registration is being rejected..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectNotes}
            >
              {actionLoading ? "Rejecting..." : "Reject Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
