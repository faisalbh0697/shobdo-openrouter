import type { Metadata } from "next";
import { Transcriber } from "@/components/transcriber";

const title = "Shobdo — OpenRouter ট্রান্সক্রিপশন";
const description =
  "অডিও আপলোড করুন। OpenRouter API key দিয়ে যেকোনো speech-to-text মডেল দিয়ে শব্দে শব্দে ট্রান্সক্রিপশন।";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "bn_BD",
      url: "/",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Shobdo OpenRouter",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description,
  inLanguage: "bn",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex flex-1 flex-col bg-[#f3f0e8] text-stone-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
          <header className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              OpenRouter · speech-to-text
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shobdo</h1>
            <p className="max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
              OpenRouter API key দিন, মডেল বেছে নিন, অডিও আপলোড করুন — প্রতিটা শব্দ সময়সহ
              দেখাবে।
            </p>
          </header>
          <Transcriber />
        </div>
      </main>
    </>
  );
}
