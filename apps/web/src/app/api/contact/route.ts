import { NextRequest, NextResponse } from "next/server";

// TODO: Wire Resend (or another provider) to send contact form emails.
// For MVP we log server-side and return 200.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body as { name?: string; email?: string; message?: string };

    // Log server-side for MVP (e.g. in production you might log to a service)
    console.log("[Contact form submission]", {
      name: name ?? "(missing)",
      email: email ?? "(missing)",
      message: message ?? "(missing)",
      at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
