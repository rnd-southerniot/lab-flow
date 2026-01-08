"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { patientsService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewPatientPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    receive_date: new Date().toISOString().split("T")[0],
    reporting_date: "",
    patient_name: "",
    age: "",
    age_unit: "years",
    sex: "Male",
    consultant_name: "",
    consultant_designation: "",
    investigation_type: "Histopathology",
    clinical_information: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        reporting_date: formData.reporting_date || null,
      };

      await patientsService.create(payload, token);
      router.push("/dashboard/patients");
    } catch (err: any) {
      setError(err.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Register New Patient</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Row 1: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receive_date">Receive Date *</Label>
                <Input
                  type="date"
                  id="receive_date"
                  name="receive_date"
                  value={formData.receive_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporting_date">Reporting Date</Label>
                <Input
                  type="date"
                  id="reporting_date"
                  name="reporting_date"
                  value={formData.reporting_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Row 2: Name, Age, Sex */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="patient_name">Patient Name *</Label>
                <Input
                  id="patient_name"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-20"
                  />
                  <Select
                    name="age_unit"
                    value={formData.age_unit}
                    onChange={handleChange}
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                    <option value="days">Days</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex *</Label>
                <Select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>

            {/* Row 3: Consultant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultant_name">Consultant / Referred by *</Label>
                <Input
                  id="consultant_name"
                  name="consultant_name"
                  value={formData.consultant_name}
                  onChange={handleChange}
                  required
                  placeholder="Dr. Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultant_designation">Designation</Label>
                <Input
                  id="consultant_designation"
                  name="consultant_designation"
                  value={formData.consultant_designation}
                  onChange={handleChange}
                  placeholder="e.g., M.D., Oncologist"
                />
              </div>
            </div>

            {/* Row 4: Investigation Type */}
            <div className="space-y-2">
              <Label htmlFor="investigation_type">Investigation Type *</Label>
              <Select
                id="investigation_type"
                name="investigation_type"
                value={formData.investigation_type}
                onChange={handleChange}
                required
              >
                <option value="Histopathology">Histopathology</option>
                <option value="Cytopathology">Cytopathology</option>
              </Select>
            </div>

            {/* Row 5: Clinical Information */}
            <div className="space-y-2">
              <Label htmlFor="clinical_information">Clinical Information</Label>
              <Textarea
                id="clinical_information"
                name="clinical_information"
                value={formData.clinical_information}
                onChange={handleChange}
                rows={4}
                placeholder="Relevant clinical history, symptoms, provisional diagnosis..."
              />
            </div>

            {/* Row 6: Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Contact Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Patient address"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/dashboard/patients">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Registering..." : "Register Patient"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
