// Lightweight client-side language detection for chat messages.
// Returns a human-readable label + a hint string used to instruct the AI.

export type DetectedLanguage = {
  code: string; // e.g. "en", "hi", "hi-Latn", "es"
  label: string; // human label e.g. "English", "Hindi", "Hinglish"
  flag?: string;
  hint: string; // instruction snippet for the model
};

const SCRIPT_RANGES: { code: string; label: string; flag: string; re: RegExp }[] = [
  { code: "hi", label: "Hindi", flag: "🇮🇳", re: /[\u0900-\u097F]/ },
  { code: "bn", label: "Bengali", flag: "🇧🇩", re: /[\u0980-\u09FF]/ },
  { code: "ta", label: "Tamil", flag: "🇮🇳", re: /[\u0B80-\u0BFF]/ },
  { code: "te", label: "Telugu", flag: "🇮🇳", re: /[\u0C00-\u0C7F]/ },
  { code: "gu", label: "Gujarati", flag: "🇮🇳", re: /[\u0A80-\u0AFF]/ },
  { code: "pa", label: "Punjabi", flag: "🇮🇳", re: /[\u0A00-\u0A7F]/ },
  { code: "ar", label: "Arabic", flag: "🇸🇦", re: /[\u0600-\u06FF]/ },
  { code: "zh", label: "Chinese", flag: "🇨🇳", re: /[\u4E00-\u9FFF]/ },
  { code: "ja", label: "Japanese", flag: "🇯🇵", re: /[\u3040-\u30FF]/ },
  { code: "ko", label: "Korean", flag: "🇰🇷", re: /[\uAC00-\uD7AF]/ },
  { code: "ru", label: "Russian", flag: "🇷🇺", re: /[\u0400-\u04FF]/ },
  { code: "he", label: "Hebrew", flag: "🇮🇱", re: /[\u0590-\u05FF]/ },
  { code: "th", label: "Thai", flag: "🇹🇭", re: /[\u0E00-\u0E7F]/ },
];

// Common Hinglish (Hindi written in Latin script) markers
const HINGLISH_WORDS = [
  "kya", "hai", "hain", "nahi", "nahin", "kyun", "kyon", "mujhe", "mujhko",
  "tum", "tumhe", "aap", "aapko", "main", "mera", "meri", "mere", "tera",
  "teri", "tere", "kaise", "kaisa", "kaisi", "acha", "accha", "theek", "thik",
  "bahut", "bohot", "kuch", "kuchh", "sab", "abhi", "phir", "kar", "kiya",
  "karna", "karo", "raha", "rahi", "rahe", "hoga", "hogi", "hota", "hoti",
  "yaar", "bhai", "bhaiya", "didi", "matlab", "samajh", "pyaar", "dil",
  "dost", "zindagi", "chal", "chalo", "dekho", "suno", "bata", "batao",
];

const SPANISH_WORDS = ["hola", "gracias", "porque", "pero", "estoy", "estás", "como", "muy", "bien", "soy", "eres", "tengo", "qué"];
const FRENCH_WORDS = ["bonjour", "merci", "parce", "mais", "suis", "êtes", "comment", "très", "bien", "avoir", "être", "pourquoi"];
const GERMAN_WORDS = ["hallo", "danke", "weil", "aber", "bin", "bist", "wie", "sehr", "gut", "haben", "sein", "warum", "ich"];
const PORTUGUESE_WORDS = ["olá", "obrigado", "porque", "mas", "estou", "está", "como", "muito", "bem", "sou", "tenho"];

function wordHits(text: string, words: string[]): number {
  const tokens = text.toLowerCase().match(/[a-zà-ÿ]+/gi) ?? [];
  if (!tokens.length) return 0;
  const set = new Set(words);
  let hits = 0;
  for (const t of tokens) if (set.has(t)) hits++;
  return hits;
}

export function detectLanguage(text: string): DetectedLanguage | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1) Script-based detection (highest signal)
  for (const r of SCRIPT_RANGES) {
    if (r.re.test(trimmed)) {
      return {
        code: r.code,
        label: r.label,
        flag: r.flag,
        hint: `Reply in ${r.label} using its native script.`,
      };
    }
  }

  // 2) Latin-script word heuristics
  const tokens = trimmed.toLowerCase().match(/[a-zà-ÿ]+/gi) ?? [];
  const total = tokens.length || 1;

  const hinglish = wordHits(trimmed, HINGLISH_WORDS);
  if (hinglish >= 2 || hinglish / total >= 0.25) {
    return {
      code: "hi-Latn",
      label: "Hinglish",
      flag: "🇮🇳",
      hint: "Reply in Hinglish (Hindi written in Latin/Roman script). Do NOT use Devanagari script.",
    };
  }

  const scores: { lang: DetectedLanguage; score: number }[] = [
    { lang: { code: "es", label: "Spanish", flag: "🇪🇸", hint: "Reply in Spanish." }, score: wordHits(trimmed, SPANISH_WORDS) },
    { lang: { code: "fr", label: "French", flag: "🇫🇷", hint: "Reply in French." }, score: wordHits(trimmed, FRENCH_WORDS) },
    { lang: { code: "de", label: "German", flag: "🇩🇪", hint: "Reply in German." }, score: wordHits(trimmed, GERMAN_WORDS) },
    { lang: { code: "pt", label: "Portuguese", flag: "🇵🇹", hint: "Reply in Portuguese.", }, score: wordHits(trimmed, PORTUGUESE_WORDS) },
  ];
  scores.sort((a, b) => b.score - a.score);
  if (scores[0].score >= 2) return scores[0].lang;

  // 3) Default: English
  return {
    code: "en",
    label: "English",
    flag: "🇬🇧",
    hint: "Reply in English.",
  };
}
