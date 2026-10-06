import type { TranscriptWord } from "@/lib/transcript";

/** Keep chunks short — OpenRouter upstream STT often times out around 60s processing. */
export const OPENROUTER_MAX_DURATION_SECONDS = 8 * 60;
export const OPENROUTER_CHUNK_SECONDS = 4 * 60;

export const OPENROUTER_MODELS = [
  {
    id: "google/gemini-3.5-transcribe",
    label: "Gemini 3.5 Transcribe",
    note: "শব্দ টাইমস্ট্যাম্প · বাংলা ভালো",
  },
  {
    id: "openai/whisper-large-v3",
    label: "Whisper Large V3",
    note: "ওপেন-সোর্স · মাল্টিলিঙ্গুয়াল",
  },
  {
    id: "openai/whisper-large-v3-turbo",
    label: "Whisper Large V3 Turbo",
    note: "দ্রুত · কম খরচ",
  },
  {
    id: "microsoft/mai-transcribe-2",
    label: "MAI-Transcribe 2",
    note: "৬০ ভাষা · word timestamps",
  },
  {
    id: "openai/gpt-transcribe",
    label: "GPT Transcribe",
    note: "OpenAI লেটেস্ট",
  },
  {
    id: "google/chirp-3",
    label: "Google Chirp 3",
    note: "Google ASR",
  },
] as const;

export type OpenRouterModelId = (typeof OPENROUTER_MODELS)[number]["id"];

export const DEFAULT_OPENROUTER_MODEL: OpenRouterModelId =
  "google/gemini-3.5-transcribe";

export function audioFormatFromFilename(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "wav";
  const map: Record<string, string> = {
    wav: "wav",
    mp3: "mp3",
    mpeg: "mp3",
    mpga: "mp3",
    m4a: "m4a",
    mp4: "m4a",
    aac: "aac",
    ogg: "ogg",
    oga: "ogg",
    flac: "flac",
    webm: "webm",
  };
  return map[ext] ?? "wav";
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type OpenRouterWord = {
  word?: string;
  start?: number;
  end?: number;
};

type OpenRouterSegment = {
  start?: number;
  end?: number;
  text?: string;
};

export type OpenRouterUsage = {
  seconds?: number;
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
};

export type OpenRouterTranscription = {
  text?: string;
  language?: string;
  duration?: number;
  words?: OpenRouterWord[];
  segments?: OpenRouterSegment[];
  usage?: OpenRouterUsage;
  error?: { message?: string; code?: number };
  message?: string;
};

export function parseOpenRouterTranscript(data: OpenRouterTranscription): {
  text: string;
  words: TranscriptWord[];
  language?: string;
  duration?: number;
  usage?: OpenRouterUsage;
} {
  const words: TranscriptWord[] = [];

  for (const item of data.words ?? []) {
    const word = (item.word ?? "").trim();
    if (!word) continue;
    const start = typeof item.start === "number" ? item.start : 0;
    const end = typeof item.end === "number" ? item.end : start;
    words.push({ word, start, end: Math.max(end, start) });
  }

  // Fallback: approximate words from segments when word timestamps missing.
  if (words.length === 0) {
    for (const seg of data.segments ?? []) {
      const text = (seg.text ?? "").trim();
      if (!text) continue;
      const start = typeof seg.start === "number" ? seg.start : 0;
      const end = typeof seg.end === "number" ? seg.end : start;
      const parts = text.split(/\s+/).filter(Boolean);
      if (parts.length === 0) continue;
      const span = Math.max(end - start, 0.01);
      const step = span / parts.length;
      parts.forEach((word, i) => {
        const wStart = start + i * step;
        words.push({ word, start: wStart, end: wStart + step });
      });
    }
  }

  const text = (data.text ?? "").trim() || words.map((w) => w.word).join(" ");

  return {
    text,
    words,
    ...(data.language ? { language: data.language } : {}),
    ...(typeof data.duration === "number" ? { duration: data.duration } : {}),
    ...(data.usage ? { usage: data.usage } : {}),
  };
}
