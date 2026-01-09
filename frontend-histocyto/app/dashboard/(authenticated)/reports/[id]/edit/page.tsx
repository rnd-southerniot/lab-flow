"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { reportsService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";

export default function EditReportPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const reportId = parseInt(params.id as string, 10);

  const [formData, setFormData] = useState({
    report_type: "Histopathology",
    specimen: "",
    gross_examination: "",
    microscopic_examination: "",
    diagnosis: "",
    icd_code: "",
    special_stains: "",
    immunohistochemistry: "",
    comments: "",
  });

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const report = await reportsService.getById(reportId, token);

        if (report.status !== "draft" && report.status !== "pending_verification") {
          router.push(`/dashboard/reports/${reportId}`);
          return;
        }

        setInvoiceNo(report.invoice_no);
        setFormData({
          report_type: report.report_type || "Histopathology",
          specimen: report.specimen || "",
          gross_examination: report.gross_examination || "",
          microscopic_examination: report.microscopic_examination || "",
          diagnosis: report.diagnosis || "",
          icd_code: report.icd_code || "",
          special_stains: report.special_stains || "",
          immunohistochemistry: report.immunohistochemistry || "",
          comments: report.comments || "",
        });
      } catch (error) {
        console.error("Failed to fetch report:", error);
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token, reportId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError("");

    try {
      await reportsService.update(reportId, formData, token);
      router.push(`/dashboard/reports/${reportId}`);
    } catch (err: any) {
      setError(err.message || "Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/reports/${reportId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Report</h1>
            <p className="text-muted-foreground">{invoiceNo}</p>
          </div>
        </div>
        <Badge variant="secondary">Draft</Badge>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Report Type */}
            <div className="space-y-2">
              <Label htmlFor="report_type">Report Type *</Label>
              <Select
                id="report_type"
                name="report_type"
                value={formData.report_type}
                onChange={handleChange}
                required
              >
                <option value="Histopathology">Histopathology</option>
                <option value="Cytopathology">Cytopathology</option>
              </Select>
            </div>

            {/* Specimen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="specimen">Specimen *</Label>
                <VoiceInputButton
                  fieldType="specimen"
                  fieldName="Specimen"
                  currentValue={formData.specimen}
                  onTranscriptionComplete={(text) =>
                    setFormData((prev) => ({ ...prev, specimen: text }))
                  }
                />
              </div>
              <Textarea
                id="specimen"
                name="specimen"
                value={formData.specimen}
                onChange={handleChange}
                rows={3}
                required
                placeholder="Describe the specimen received..."
              />
            </div>

            {/* Gross Examination */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gross_examination">Gross Examination</Label>
                <VoiceInputButton
                  fieldType="gross_examination"
                  fieldName="Gross Examination"
                  currentValue={formData.gross_examination}
                  onTranscriptionComplete={(text) =>
                    setFormData((prev) => ({ ...prev, gross_examination: text }))
                  }
                />
              </div>
              <Textarea
                id="gross_examination"
                name="gross_examination"
                value={formData.gross_examination}
                onChange={handleChange}
                rows={4}
                placeholder="Macroscopic findings..."
              />
            </div>

            {/* Microscopic Examination */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="microscopic_examination">Microscopic Examination</Label>
                <VoiceInputButton
                  fieldType="microscopic_examination"
                  fieldName="Microscopic Examination"
                  currentValue={formData.microscopic_examination}
                  onTranscriptionComplete={(text) =>
                    setFormData((prev) => ({ ...prev, microscopic_examination: text }))
                  }
                />
              </div>
              <Textarea
                id="microscopic_examination"
                name="microscopic_examination"
                value={formData.microscopic_examination}
                onChange={handleChange}
                rows={6}
                placeholder="Microscopic findings..."
              />
            </div>

            {/* Diagnosis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <VoiceInputButton
                  fieldType="diagnosis"
                  fieldName="Diagnosis"
                  currentValue={formData.diagnosis}
                  onTranscriptionComplete={(text) =>
                    setFormData((prev) => ({ ...prev, diagnosis: text }))
                  }
                />
              </div>
              <Textarea
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Final diagnosis..."
              />
            </div>

            {/* ICD Code */}
            <div className="space-y-2">
              <Label htmlFor="icd_code">ICD Code</Label>
              <Input
                id="icd_code"
                name="icd_code"
                value={formData.icd_code}
                onChange={handleChange}
                placeholder="e.g., C50.9"
              />
            </div>

            {/* Optional Fields */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Additional Information</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="special_stains">Special Stains</Label>
                    <VoiceInputButton
                      fieldType="special_stains"
                      fieldName="Special Stains"
                      currentValue={formData.special_stains}
                      onTranscriptionComplete={(text) =>
                        setFormData((prev) => ({ ...prev, special_stains: text }))
                      }
                    />
                  </div>
                  <Textarea
                    id="special_stains"
                    name="special_stains"
                    value={formData.special_stains}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Special staining results..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="immunohistochemistry">Immunohistochemistry</Label>
                    <VoiceInputButton
                      fieldType="immunohistochemistry"
                      fieldName="Immunohistochemistry"
                      currentValue={formData.immunohistochemistry}
                      onTranscriptionComplete={(text) =>
                        setFormData((prev) => ({ ...prev, immunohistochemistry: text }))
                      }
                    />
                  </div>
                  <Textarea
                    id="immunohistochemistry"
                    name="immunohistochemistry"
                    value={formData.immunohistochemistry}
                    onChange={handleChange}
                    rows={2}
                    placeholder="IHC results..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="comments">Comments</Label>
                    <VoiceInputButton
                      fieldType="comments"
                      fieldName="Comments"
                      currentValue={formData.comments}
                      onTranscriptionComplete={(text) =>
                        setFormData((prev) => ({ ...prev, comments: text }))
                      }
                    />
                  </div>
                  <Textarea
                    id="comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Additional comments or notes..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href={`/dashboard/reports/${reportId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
