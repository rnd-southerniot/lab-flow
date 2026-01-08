"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { reportsService, patientsService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Search } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: number;
  invoice_no: string;
  patient_name: string;
  age: number;
  age_unit: string;
  sex: string;
  investigation_type: string;
  verification_status: string;
}

export default function NewReportPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchingPatient, setSearchingPatient] = useState(false);

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

  // Pre-fill from URL params (when coming from patient detail)
  useEffect(() => {
    const patientId = searchParams.get("patient_id");
    const invoiceNo = searchParams.get("invoice_no");
    const investigationType = searchParams.get("investigation_type");

    if (patientId && invoiceNo && token) {
      // Fetch the patient
      patientsService.getById(parseInt(patientId, 10), token).then((patient) => {
        if (patient.verification_status === "verified") {
          setSelectedPatient(patient);
          setFormData((prev) => ({
            ...prev,
            report_type: investigationType || patient.investigation_type,
          }));
        }
      });
    }
  }, [searchParams, token]);

  const handleSearchPatient = async () => {
    if (!token || !patientSearch) return;
    setSearchingPatient(true);
    try {
      const data = await patientsService.getAll(token, {
        search: patientSearch,
        verification_status: "verified",
        limit: 10,
      });
      setPatients(data);
    } catch (error) {
      console.error("Failed to search patients:", error);
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPatient) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        patient_id: selectedPatient.id,
        invoice_no: selectedPatient.invoice_no,
        ...formData,
      };

      const report = await reportsService.create(payload, token);
      router.push(`/dashboard/reports/${report.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create New Report</h1>
      </div>

      {/* Patient Selection */}
      {!selectedPatient ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or invoice number..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchPatient()}
              />
              <Button onClick={handleSearchPatient} disabled={searchingPatient}>
                <Search className="h-4 w-4 mr-2" />
                {searchingPatient ? "Searching..." : "Search"}
              </Button>
            </div>

            {patients.length > 0 && (
              <div className="border rounded-lg divide-y">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setSelectedPatient(patient);
                      setFormData((prev) => ({
                        ...prev,
                        report_type: patient.investigation_type,
                      }));
                      setPatients([]);
                    }}
                  >
                    <div>
                      <p className="font-medium">{patient.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.invoice_no} | {patient.age} {patient.age_unit} | {patient.sex}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {patient.investigation_type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Note: Only verified patients can have reports created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selected Patient Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedPatient.patient_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.invoice_no} | {selectedPatient.age}{" "}
                    {selectedPatient.age_unit} | {selectedPatient.sex}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Change Patient
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Form */}
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
                  <Label htmlFor="specimen">Specimen *</Label>
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
                  <Label htmlFor="gross_examination">Gross Examination</Label>
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
                  <Label htmlFor="microscopic_examination">Microscopic Examination</Label>
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
                  <Label htmlFor="diagnosis">Diagnosis *</Label>
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
                      <Label htmlFor="special_stains">Special Stains</Label>
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
                      <Label htmlFor="immunohistochemistry">Immunohistochemistry</Label>
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
                      <Label htmlFor="comments">Comments</Label>
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
                  <Link href="/dashboard/reports">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Creating..." : "Create Report"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </>
      )}
    </div>
  );
}
