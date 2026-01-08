/**
 * Application Configuration
 */

export const APP_CONFIG = {
  NAME: "HistoCyto Lab System",
  DESCRIPTION: "Histopathology and Cytopathology Lab Report System",
  LOGO_PATH: "/logo.png",
} as const;

export const API_CONFIG = {
  BASE_PATH: "/api/proxy",
  TIMEOUT_MS: 30000,
} as const;

export const AUTH_CONFIG = {
  TOKEN_KEY: "histo_auth_token",
  USER_KEY: "histo_user_data",
  COOKIE_NAME: "histo_auth_token",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PATIENTS: "/dashboard/patients",
  REPORTS: "/dashboard/reports",
  USERS: "/dashboard/users",
} as const;

export function getBasePath(): string {
  return API_CONFIG.BASE_PATH;
}
