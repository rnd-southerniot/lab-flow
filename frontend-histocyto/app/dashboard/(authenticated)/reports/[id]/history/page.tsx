"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams } from "next/navigation";
import { reportsService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

interface ReportVersion {
  id: number;
  report_id: number;
  version_number: number;
  content: {
    specimen?: string;
    gross_examination?: string;
    microscopic_examination?: string;
    diagnosis?: string;
    special_stains?: string;
    immunohistochemistry?: string;
    comments?: string;
    status?: string;
  };
  changed_by: number;
  change_reason: string | null;
  created_at: string;
}

export default function ReportHistoryPage() {
  const { token } = useAuth();
  const params = useParams();
  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const reportId = parseInt(params.id as string, 10);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await reportsService.getVersions(reportId, token);
        setVersions(data);
      } catch (error) {
        console.error("Failed to fetch versions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [token, reportId]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return "-";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/reports/${reportId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Report
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Version History</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      ) : versions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No Version History</h3>
            <p className="text-muted-foreground">
              This report has no recorded changes yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Version {version.version_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(version.created_at)}
                    </p>
                  </div>
                  {version.content.status && (
                    <Badge variant="outline">
                      {getStatusLabel(version.content.status)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {version.change_reason && (
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <strong>Reason:</strong> {version.change_reason}
                  </div>
                )}

                <div className="grid gap-4 text-sm">
                  {version.content.specimen && (
                    <div>
                      <strong className="text-muted-foreground">Specimen:</strong>
                      <p className="mt-1 whitespace-pre-wrap">
                        {version.content.specimen.substring(0, 200)}
                        {version.content.specimen.length > 200 && "..."}
                      </p>
                    </div>
                  )}

                  {version.content.diagnosis && (
                    <div>
                      <strong className="text-muted-foreground">Diagnosis:</strong>
                      <p className="mt-1 whitespace-pre-wrap">
                        {version.content.diagnosis.substring(0, 200)}
                        {version.content.diagnosis.length > 200 && "..."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
