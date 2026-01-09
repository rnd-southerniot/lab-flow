import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://histo-backend:8001";

async function proxyRequest(request: NextRequest, path: string) {
  // Preserve query string
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";
  const url = `${BACKEND_URL}/api/v1/${path}${queryString}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Forward authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    redirect: "follow", // Follow redirects server-side
  };

  // Forward body for POST/PUT/PATCH requests
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    try {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch {
      // No body
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Handle 204 No Content
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      { status: 503 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}
