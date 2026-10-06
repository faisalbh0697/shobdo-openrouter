# Shobdo (OpenRouter)

অডিও আপলোড + **OpenRouter** speech-to-text। UI-তে নিজের OpenRouter API key দিলেই ট্রান্সক্রাইব হয় — সার্ভারে key লাগে না।

ডিফল্ট মডেল: `google/gemini-3.5-transcribe`  
অন্যান্য: Whisper Large V3, MAI-Transcribe 2, GPT Transcribe, Chirp 3, ইত্যাদি।

## চালানো

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) → [OpenRouter keys](https://openrouter.ai/keys) থেকে `sk-or-...` পেস্ট করুন।

## Vercel

1. এই রিপো Import করুন  
2. Env লাগে না  
3. Deploy  

অডিও ব্রাউজার থেকে সরাসরি OpenRouter-এ যায় (Vercel body-limit এড়ায়)।

## API

`POST https://openrouter.ai/api/v1/audio/transcriptions`  
`response_format: verbose_json` + word timestamps (মডেল সাপোর্ট করলে)।
