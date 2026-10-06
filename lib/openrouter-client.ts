import {
  audioFormatFromFilename,
  blobToBase64,
  parseOpenRouterTranscript,
  type OpenRouterTranscription,
  type OpenRouterUsage,
} from "@/lib/openrouter";
import {
  normalizeWords,
  wordsToText,
  type Transcript,
} from "@/lib/transcript";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/audio/transcriptions";

function mapError(status: number, message: string): string {
  if (status === 401 || status === 403 || /api key|unauthorized/i.test(message)) {
    return "OpenRouter API key কাজ করছে না। openrouter.ai/keys থেকে যাচাই করুন।";
  }
  if (status === 429) {
    return "রেট লিমিট। একটু পরে আবার চেষ্টা করুন।";
  }
  if (status === 402 || /credit|balance|payment/i.test(message)) {
    return "OpenRouter ক্রেডিট শেষ বা অপর্যাপ্ত। অ্যাকাউন্টে ব্যালেন্স যোগ করুন।";
  }
  return message || "ট্রান্সক্রিপশন হয়নি।";
}

function providerOptionsForModel(model: string): Record<string, unknown> | undefined {
  // Keep fillers (umm / uh / aaa) — Gemini SMART / Azure "clean" strip them.
  if (model.startsWith("google/gemini") || model.includes("gemini-3.5-transcribe")) {
    return {
      "google-ai-studio": {
        audioTranscriptionConfig: {
          mode: "VERBATIM",
          wordTimestamp: true,
        },
      },
    };
  }
  if (model.startsWith("microsoft/mai-transcribe")) {
    return {
      azure: {
        enhancedMode: {
          modelOptions: {
            // verbatim keeps disfluencies; clean removes them
            transcribeStyle: "verbatim",
          },
        },
      },
    };
  }
  return undefined;
}

function buildRequestBody(options: {
  model: string;
  data: string;
  format: string;
  language?: string;
  responseFormat: "verbose_json" | "json";
}) {
  const providerOptions = providerOptionsForModel(options.model);
  return {
    model: options.model,
    input_audio: { data: options.data, format: options.format },
    ...(options.language ? { language: options.language } : {}),
    response_format: options.responseFormat,
    ...(options.responseFormat === "verbose_json"
      ? { timestamp_granularities: ["word", "segment"] }
      : {}),
    ...(providerOptions ? { provider: { options: providerOptions } } : {}),
  };
}

export type TranscribeResult = Transcript & { usage?: OpenRouterUsage };

/** Browser → OpenRouter STT (avoids Vercel body limit). */
export async function transcribeChunkWithOpenRouter(options: {
  apiKey: string;
  blob: Blob;
  filename: string;
  model: string;
  language?: string;
}): Promise<TranscribeResult> {
  const { apiKey, blob, filename, model, language } = options;
  const format = audioFormatFromFilename(filename);
  const data = await blobToBase64(blob);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.origin : "https://shobdo.app",
      "X-Title": "Shobdo OpenRouter",
    },
    body: JSON.stringify(
      buildRequestBody({
        model,
        data,
        format,
        language,
        responseFormat: "verbose_json",
      }),
    ),
  });

  const raw = await response.text();
  let payload: OpenRouterTranscription;
  try {
    payload = JSON.parse(raw) as OpenRouterTranscription;
  } catch {
    throw new Error("OpenRouter থেকে অপ্রত্যাশিত উত্তর এসেছে।");
  }

  if (!response.ok) {
    const message =
      payload.error?.message ?? payload.message ?? raw.slice(0, 200);
    throw new Error(mapError(response.status, message));
  }

  // Some models reject verbose_json — retry once as plain json.
  if (!payload.text && !payload.words?.length && !payload.segments?.length) {
    const plain = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          typeof window !== "undefined" ? window.location.origin : "https://shobdo.app",
        "X-Title": "Shobdo OpenRouter",
      },
      body: JSON.stringify(
        buildRequestBody({
          model,
          data,
          format,
          language,
          responseFormat: "json",
        }),
      ),
    });
    const plainRaw = await plain.text();
    let plainPayload: OpenRouterTranscription;
    try {
      plainPayload = JSON.parse(plainRaw) as OpenRouterTranscription;
    } catch {
      throw new Error("OpenRouter থেকে অপ্রত্যাশিত উত্তর এসেছে।");
    }
    if (!plain.ok) {
      throw new Error(
        mapError(plain.status, plainPayload.error?.message ?? plainPayload.message ?? ""),
      );
    }
    payload = plainPayload;
  }

  const parsed = parseOpenRouterTranscript(payload);
  // Don't collapse filler runs like "um um um" the same way as Whisper loops.
  const words = normalizeWords(parsed.words, { preserveFillers: true });
  const text = parsed.text || wordsToText(words);
  const duration =
    parsed.duration ?? (words.length > 0 ? words.at(-1)!.end : undefined);

  return {
    text,
    words,
    ...(parsed.language ? { language: parsed.language } : {}),
    ...(typeof duration === "number" ? { duration } : {}),
    ...(parsed.usage ? { usage: parsed.usage } : {}),
  };
}
