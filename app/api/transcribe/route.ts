import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Transcription runs in the browser → OpenRouter. Health stub for deploy checks. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: "client-openrouter",
    endpoint: "https://openrouter.ai/api/v1/audio/transcriptions",
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "ট্রান্সক্রিপশন ব্রাউজার থেকে সরাসরি OpenRouter-এ যায়। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।",
    },
    { status: 410 },
  );
}
