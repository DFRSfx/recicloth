// backend/src/utils/translationService.ts
// Uses native fetch (Node.js 18+) — no external dependencies

const DEEPL_KEY      = process.env.DEEPL_API_KEY  || '';
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || '';

// ── DeepL Free API ────────────────────────────────────────────────────────────
async function translateDeepL(text: string, from: string | null, to: string): Promise<string> {
  if (!DEEPL_KEY) throw new Error('DEEPL_API_KEY não configurada');

  // DeepL usa códigos ligeiramente diferentes dos ISO standard
  const targetMap: Record<string, string> = { pt: 'PT-PT', en: 'EN' };
  const sourceMap: Record<string, string> = { pt: 'PT',    en: 'EN' };

  const isHtml = /<[a-z][\s\S]*>/i.test(text);

  const body = new URLSearchParams({
    text,
    target_lang: targetMap[to] ?? to.toUpperCase(),
    ...(isHtml ? { tag_handling: 'html' } : {}),
  });
  // Omit source_lang to let DeepL auto-detect when from is null
  if (from && from !== 'auto') {
    body.set('source_lang', sourceMap[from] ?? from.toUpperCase());
  }

  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
    },
    body:    body.toString(),
    signal:  AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json() as { translations: { text: string }[] };
  return data.translations?.[0]?.text ?? text;
}

// ── MyMemory (fallback — sem chave necessária) ─────────────────────────────────
async function translateMyMemory(text: string, from: string | null, to: string): Promise<string> {
  const src = (!from || from === 'auto') ? 'autodetect' : from;
  const params = new URLSearchParams({
    q:        text,
    langpair: `${src}|${to}`,
  });
  if (MYMEMORY_EMAIL) params.set('de', MYMEMORY_EMAIL);

  const res = await fetch(
    `https://api.mymemory.translated.net/get?${params.toString()}`,
    { signal: AbortSignal.timeout(8000) }
  );

  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

  const data = await res.json() as {
    responseStatus: number;
    responseMessage: string;
    responseData: { translatedText: string };
  };
  if (data.responseStatus !== 200) throw new Error(data.responseMessage);
  return data.responseData.translatedText ?? text;
}

// ── Exportado: tenta DeepL → cai para MyMemory ───────────────────────────────
export async function translate(text: string, from: string | null, to: string): Promise<string> {
  if (!text?.trim()) return '';
  try {
    return await translateDeepL(text, from, to);
  } catch (deepLErr) {
    console.warn(`⚠️ DeepL falhou, a tentar MyMemory: ${(deepLErr as Error).message}`);
    try {
      return await translateMyMemory(text, from, to);
    } catch (mmErr) {
      console.error(`❌ Todos os providers falharam: ${(mmErr as Error).message}`);
      return text; // último fallback: devolve o original
    }
  }
}

// ── Batch em série (evita rate limits) ───────────────────────────────────────
export async function translateBatch(
  items: string[],
  from: string,
  to: string
): Promise<string[]> {
  const results: string[] = [];
  for (const item of items) {
    results.push(await translate(item, from, to));
  }
  return results;
}
