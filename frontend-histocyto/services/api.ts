/**
 * API Service Layer
 * Centralized API calls for the HistoCyto Lab System
 */
import { getBasePath, AUTH_CONFIG } from "@/lib/config";

/**
 * Core API request function
 */
export const apiRequest = async (
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  body: object | null = null,
  token: string | null = null
): Promise<any> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const url = `${getBasePath()}${path}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

/**
 * Authentication Service
 */
export const authService = {
  login: async (username: string, password: string) => {
    return apiRequest("/histo_auth/login", "POST", { username, password });
  },

  getMe: async (token: string) => {
    return apiRequest("/histo_auth/me", "GET", null, token);
  },

  register: async (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) => {
    return apiRequest("/histo_auth/register", "POST", userData);
  },

  logout: async (token: string) => {
    return apiRequest("/histo_auth/logout", "POST", null, token);
  },

  refresh: async (token: string) => {
    return apiRequest("/histo_auth/refresh", "POST", null, token);
  },
};

/**
 * Users Service (Admin only)
 */
export const usersService = {
  getAll: async (token: string, params?: { role?: string; is_active?: boolean }) => {
    let path = "/histo_users/";
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.role) searchParams.append("role", params.role);
      if (params.is_active !== undefined) searchParams.append("is_active", String(params.is_active));
      if (searchParams.toString()) path += `?${searchParams.toString()}`;
    }
    return apiRequest(path, "GET", null, token);
  },

  getById: async (id: number, token: string) => {
    return apiRequest(`/histo_users/${id}`, "GET", null, token);
  },

  create: async (userData: object, token: string) => {
    return apiRequest("/histo_users/", "POST", userData, token);
  },

  update: async (id: number, userData: object, token: string) => {
    return apiRequest(`/histo_users/${id}`, "PUT", userData, token);
  },

  delete: async (id: number, token: string) => {
    return apiRequest(`/histo_users/${id}`, "DELETE", null, token);
  },

  getActivity: async (userId: number, token: string) => {
    return apiRequest(`/histo_users/${userId}/activity`, "GET", null, token);
  },
};

/**
 * Patients Service
 */
export const patientsService = {
  getAll: async (
    token: string,
    params?: {
      verification_status?: string;
      investigation_type?: string;
      search?: string;
      skip?: number;
      limit?: number;
    }
  ) => {
    let path = "/patients/";
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.verification_status) searchParams.append("verification_status", params.verification_status);
      if (params.investigation_type) searchParams.append("investigation_type", params.investigation_type);
      if (params.search) searchParams.append("search", params.search);
      if (params.skip !== undefined) searchParams.append("skip", String(params.skip));
      if (params.limit !== undefined) searchParams.append("limit", String(params.limit));
      if (searchParams.toString()) path += `?${searchParams.toString()}`;
    }
    return apiRequest(path, "GET", null, token);
  },

  getById: async (id: number, token: string) => {
    return apiRequest(`/patients/${id}`, "GET", null, token);
  },

  getByInvoice: async (invoiceNo: string, token: string) => {
    return apiRequest(`/patients/invoice/${invoiceNo}`, "GET", null, token);
  },

  getPendingVerification: async (token: string) => {
    return apiRequest("/patients/pending-verification", "GET", null, token);
  },

  create: async (patientData: object, token: string) => {
    return apiRequest("/patients/", "POST", patientData, token);
  },

  update: async (id: number, patientData: object, token: string) => {
    return apiRequest(`/patients/${id}`, "PUT", patientData, token);
  },

  delete: async (id: number, token: string) => {
    return apiRequest(`/patients/${id}`, "DELETE", null, token);
  },

  verify: async (id: number, notes: string | null, token: string) => {
    return apiRequest(`/patients/${id}/verify`, "POST", { notes }, token);
  },

  reject: async (id: number, notes: string, token: string) => {
    return apiRequest(`/patients/${id}/reject`, "POST", { notes }, token);
  },

  // Referring Doctors
  getReferringDoctors: async (token: string, isActive?: boolean) => {
    let path = "/patients/referring-doctors/";
    if (isActive !== undefined) path += `?is_active=${isActive}`;
    return apiRequest(path, "GET", null, token);
  },

  createReferringDoctor: async (doctorData: object, token: string) => {
    return apiRequest("/patients/referring-doctors/", "POST", doctorData, token);
  },
};

/**
 * Reports Service
 */
export const reportsService = {
  getAll: async (
    token: string,
    params?: {
      status?: string;
      report_type?: string;
      invoice_no?: string;
      skip?: number;
      limit?: number;
    }
  ) => {
    let path = "/reports/";
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append("status", params.status);
      if (params.report_type) searchParams.append("report_type", params.report_type);
      if (params.invoice_no) searchParams.append("invoice_no", params.invoice_no);
      if (params.skip !== undefined) searchParams.append("skip", String(params.skip));
      if (params.limit !== undefined) searchParams.append("limit", String(params.limit));
      if (searchParams.toString()) path += `?${searchParams.toString()}`;
    }
    return apiRequest(path, "GET", null, token);
  },

  getById: async (id: number, token: string) => {
    return apiRequest(`/reports/${id}`, "GET", null, token);
  },

  getByPatient: async (invoiceNo: string, token: string) => {
    return apiRequest(`/reports/patient/${invoiceNo}`, "GET", null, token);
  },

  getPending: async (token: string) => {
    return apiRequest("/reports/pending", "GET", null, token);
  },

  create: async (reportData: object, token: string) => {
    return apiRequest("/reports/", "POST", reportData, token);
  },

  update: async (id: number, reportData: object, token: string) => {
    return apiRequest(`/reports/${id}`, "PUT", reportData, token);
  },

  delete: async (id: number, token: string) => {
    return apiRequest(`/reports/${id}`, "DELETE", null, token);
  },

  // Workflow
  submit: async (id: number, token: string) => {
    return apiRequest(`/reports/${id}/submit`, "POST", {}, token);
  },

  verify: async (id: number, token: string) => {
    return apiRequest(`/reports/${id}/verify`, "POST", {}, token);
  },

  reject: async (id: number, reason: string, token: string) => {
    return apiRequest(`/reports/${id}/reject`, "POST", { reason }, token);
  },

  sign: async (id: number, signaturePassword: string, token: string) => {
    return apiRequest(`/reports/${id}/sign`, "POST", { signature_password: signaturePassword }, token);
  },

  publish: async (id: number, token: string) => {
    return apiRequest(`/reports/${id}/publish`, "POST", {}, token);
  },

  amend: async (id: number, reason: string, token: string) => {
    return apiRequest(`/reports/${id}/amend`, "POST", { reason }, token);
  },

  getVersions: async (id: number, token: string) => {
    return apiRequest(`/reports/${id}/versions`, "GET", null, token);
  },
};

/**
 * PDF Service
 */
export const pdfService = {
  getReportPdf: async (reportId: number, token: string) => {
    const url = `${getBasePath()}/pdf/report/${reportId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to generate PDF");
    return response.blob();
  },

  previewReport: async (reportId: number, token: string) => {
    return apiRequest(`/pdf/report/${reportId}/preview`, "GET", null, token);
  },
};

/**
 * Unified API export
 */
export const api = {
  auth: authService,
  users: usersService,
  patients: patientsService,
  reports: reportsService,
  pdf: pdfService,
};
