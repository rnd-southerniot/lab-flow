"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { patientsService, reportsService } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  ClipboardList,
  Activity,
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalPatients: number;
  pendingPatients: number;
  draftReports: number;
  pendingReports: number;
  publishedReports: number;
}

interface RecentReport {
  id: number;
  invoice_no: string;
  report_type: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, token, isAdmin, isDoctor } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    pendingPatients: 0,
    draftReports: 0,
    pendingReports: 0,
    publishedReports: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [
          allPatients,
          pendingPatients,
          draftReports,
          pendingReports,
          publishedReports,
          recent,
        ] = await Promise.all([
          patientsService.getAll(token, { limit: 1000 }),
          patientsService.getPendingVerification(token),
          reportsService.getAll(token, { status: "draft", limit: 1000 }),
          reportsService.getPending(token),
          reportsService.getAll(token, { status: "published", limit: 1000 }),
          reportsService.getAll(token, { limit: 5 }),
        ]);

        setStats({
          totalPatients: allPatients.length,
          pendingPatients: pendingPatients.length,
          draftReports: draftReports.length,
          pendingReports: pendingReports.length,
          publishedReports: publishedReports.length,
        });

        setRecentReports(recent);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      description: "Registered patients",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/dashboard/patients",
    },
    {
      title: "Draft Reports",
      value: stats.draftReports,
      description: "Work in progress",
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/dashboard/reports?status=draft",
    },
    {
      title: "Published Reports",
      value: stats.publishedReports,
      description: "Completed & signed",
      icon: ClipboardList,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/dashboard/reports?status=published",
    },
    {
      title: "Pending Verification",
      value: stats.pendingPatients + stats.pendingReports,
      description: "Needs admin review",
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: isAdmin ? "/dashboard/patients/verification" : "/dashboard/reports",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "signed":
        return <Badge variant="info">Signed</Badge>;
      case "verified":
        return <Badge variant="info">Verified</Badge>;
      case "pending_verification":
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name || user?.username}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Admin Alerts */}
      {isAdmin && (stats.pendingPatients > 0 || stats.pendingReports > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.pendingPatients > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        {stats.pendingPatients} Patient{stats.pendingPatients > 1 ? "s" : ""} Pending Verification
                      </p>
                      <p className="text-sm text-yellow-600">
                        Review and verify patient registrations
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/patients/verification">
                    <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-700">
                      Review
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.pendingReports > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">
                        {stats.pendingReports} Report{stats.pendingReports > 1 ? "s" : ""} Pending Verification
                      </p>
                      <p className="text-sm text-blue-600">
                        Review and verify submitted reports
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/reports/pending">
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-700">
                      Review
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/patients/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Register New Patient
              </Button>
            </Link>
            <Link href="/dashboard/reports/new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Create New Report
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/dashboard/patients/verification">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verification Queue
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Latest report activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : recentReports.length === 0 ? (
              <div className="text-sm text-muted-foreground">No reports yet</div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-sm">{report.invoice_no}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.report_type} - {formatDate(report.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(report.status)}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your Role: <Badge variant="outline">{user?.role?.toUpperCase()}</Badge>
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "You have full administrative access"
              : "You can create and sign reports"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "As an Admin, you can manage users, verify patient details, and oversee all reports in the system."
              : "As a Doctor, you can register patients, create detailed lab reports, and digitally sign completed reports for publication."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
