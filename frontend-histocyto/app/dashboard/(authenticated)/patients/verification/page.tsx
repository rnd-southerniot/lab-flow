"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { patientsService } from "@/services/api";
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
import { ArrowLeft, CheckCircle, XCircle, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Patient {
  id: number;
  invoice_no: string;
  patient_name: string;
  age: number;
  age_unit: string;
  sex: string;
  consultant_name: string;
  investigation_type: string;
  clinical_information: string | null;
  receive_date: string;
  created_at: string;
}

export default function VerificationQueuePage() {
  const { token, isAdmin } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard/patients");
      return;
    }

    const fetchPending = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await patientsService.getPendingVerification(token);
        setPatients(data);
      } catch (error) {
        console.error("Failed to fetch pending patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [token, isAdmin, router]);

  const handleVerify = async () => {
    if (!token || !selectedPatient) return;
    setActionLoading(true);
    try {
      await patientsService.verify(selectedPatient.id, notes || null, token);
      setPatients(patients.filter((p) => p.id !== selectedPatient.id));
      setVerifyDialogOpen(false);
      setSelectedPatient(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to verify patient:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !selectedPatient || !notes) return;
    setActionLoading(true);
    try {
      await patientsService.reject(selectedPatient.id, notes, token);
      setPatients(patients.filter((p) => p.id !== selectedPatient.id));
      setRejectDialogOpen(false);
      setSelectedPatient(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to reject patient:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Verification Queue</h1>
        <Badge variant="warning">{patients.length} Pending</Badge>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground">
              No patients pending verification
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {patient.patient_name}
                      </h3>
                      <Badge variant="outline">{patient.invoice_no}</Badge>
                      <Badge variant="secondary">
                        {patient.investigation_type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age/Sex: </span>
                        {patient.age} {patient.age_unit} / {patient.sex}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Consultant: </span>
                        {patient.consultant_name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Receive Date: </span>
                        {formatDate(patient.receive_date)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Registered: </span>
                        {formatDateTime(patient.created_at)}
                      </div>
                    </div>
                    {patient.clinical_information && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Clinical Info: </span>
                        {patient.clinical_information.substring(0, 200)}
                        {patient.clinical_information.length > 200 && "..."}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/dashboard/patients/${patient.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setNotes("");
                        setVerifyDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setNotes("");
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

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent onClose={() => setVerifyDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Verify Patient</DialogTitle>
            <DialogDescription>
              Confirm that {selectedPatient?.patient_name}'s details are correct
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Verification Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
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
              Provide a reason for rejecting {selectedPatient?.patient_name}'s
              registration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why this patient registration is being rejected..."
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
              disabled={actionLoading || !notes}
            >
              {actionLoading ? "Rejecting..." : "Reject Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
