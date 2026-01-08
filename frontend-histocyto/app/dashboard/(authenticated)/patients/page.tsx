"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { patientsService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: number;
  invoice_no: string;
  patient_name: string;
  age: number;
  age_unit: string;
  sex: string;
  consultant_name: string;
  investigation_type: string;
  verification_status: string;
  receive_date: string;
  reporting_date: string | null;
}

export default function PatientsPage() {
  const { token, isAdmin } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchPatients = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await patientsService.getAll(token, {
        search: search || undefined,
        verification_status: verificationFilter || undefined,
        investigation_type: typeFilter || undefined,
      });
      setPatients(data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token, verificationFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link href="/dashboard/patients/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Patient
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <Input
            placeholder="Search by name, invoice, consultant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </Select>

        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Types</option>
          <option value="Histopathology">Histopathology</option>
          <option value="Cytopathology">Cytopathology</option>
        </Select>
      </div>

      {/* Admin Verification Queue Link */}
      {isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-yellow-800">Verification Queue</h3>
              <p className="text-sm text-yellow-600">
                Review and verify patient registrations
              </p>
            </div>
            <Link href="/dashboard/patients/verification">
              <Button variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                View Queue
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Age/Sex</TableHead>
              <TableHead>Consultant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Receive Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.invoice_no}</TableCell>
                  <TableCell>{patient.patient_name}</TableCell>
                  <TableCell>
                    {patient.age} {patient.age_unit} / {patient.sex}
                  </TableCell>
                  <TableCell>{patient.consultant_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.investigation_type}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(patient.receive_date)}</TableCell>
                  <TableCell>{getStatusBadge(patient.verification_status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/patients/${patient.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {patient.verification_status !== "verified" && (
                        <Link href={`/dashboard/patients/${patient.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
