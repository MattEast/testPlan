import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseUrl, apiKey, endpoint, query } = body as {
      baseUrl: string;
      apiKey: string;
      endpoint: string;
      query?: Record<string, string | number | boolean>;
    };

    if (!baseUrl || !apiKey || !endpoint) {
      return NextResponse.json({ error: "Missing TestMo configuration." }, { status: 400 });
    }

    const url = new URL(endpoint, baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data?.error || "TestMo request failed." }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "TestMo request failed." }, { status: 500 });
  }
}
