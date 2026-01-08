"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { reportsService } from "@/services/api";
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
import { Plus, Search, Eye, Edit, FileText, Download } from "lucide-react";
import Link from "next/link";

interface Report {
  id: number;
  invoice_no: string;
  patient_id: number;
  report_type: string;
  status: string;
  specimen: string | null;
  diagnosis: string | null;
  created_at: string;
  signed_at: string | null;
  published_at: string | null;
}

export default function ReportsPage() {
  const { token, isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchReports = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await reportsService.getAll(token, {
        status: statusFilter || undefined,
        report_type: typeFilter || undefined,
        invoice_no: search || undefined,
      });
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token, statusFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
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

  const canEdit = (status: string) => {
    return status === "draft" || status === "pending_verification";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lab Reports</h1>
        <Link href="/dashboard/reports/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <Input
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="signed">Signed</option>
          <option value="published">Published</option>
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

      {/* Admin Pending Reports Link */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-blue-800">Reports Pending Verification</h3>
              <p className="text-sm text-blue-600">
                Review and verify submitted reports
              </p>
            </div>
            <Link href="/dashboard/reports/pending">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Pending
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Specimen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.invoice_no}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.report_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {report.specimen || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{formatDate(report.created_at)}</TableCell>
                  <TableCell>{formatDate(report.published_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/reports/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {canEdit(report.status) && (
                        <Link href={`/dashboard/reports/${report.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      {report.status === "published" && (
                        <Link href={`/dashboard/reports/${report.id}/pdf`}>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
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
