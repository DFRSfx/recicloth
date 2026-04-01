// backend/src/utils/saveTranslations.ts
import pool from '../config/database.js';
import { translate, translateBatch } from './translationService.js';

interface Color { hex: string; name: string; }

// ── Produto ────────────────────────────────────────────────────────────────────
export async function saveProductTranslations(
  productId: number,
  name: string,
  description: string,
  sourceLang: 'en' | 'pt' = 'en'
): Promise<void> {
  const targetLang = sourceLang === 'en' ? 'pt' : 'en';

  const [translatedName, translatedDesc] = await Promise.all([
    translate(name, sourceLang, targetLang),
    translate(description, sourceLang, targetLang),
  ]);

  const rows: [number, string, string, string][] = [
    [productId, sourceLang, name, description],
    [productId, targetLang, translatedName, translatedDesc],
  ];

  for (const [pid, lang, n, d] of rows) {
    await pool.query(
      `INSERT INTO product_translations (product_id, lang, name, description)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (product_id, lang) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description`,
      [pid, lang, n, d]
    );
  }
  console.log(`✅ Traduções do produto ${productId} guardadas (${sourceLang} + ${targetLang})`);
}

// ── Cores ──────────────────────────────────────────────────────────────────────
export async function saveColorTranslations(
  productId: number,
  colors: Color[],
  sourceLang: 'en' | 'pt' = 'en'
): Promise<void> {
  if (!colors?.length) return;
  const targetLang = sourceLang === 'en' ? 'pt' : 'en';

  const originalNames = colors.map(c => c.name);
  const translatedNames = await translateBatch(originalNames, sourceLang, targetLang);

  for (let i = 0; i < colors.length; i++) {
    const { hex } = colors[i];

    // Guarda língua original
    await pool.query(
      `INSERT INTO color_translations (product_id, hex, lang, name)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (product_id, hex, lang) DO UPDATE SET name = EXCLUDED.name`,
      [productId, hex, sourceLang, originalNames[i]]
    );

    // Guarda tradução
    await pool.query(
      `INSERT INTO color_translations (product_id, hex, lang, name)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (product_id, hex, lang) DO UPDATE SET name = EXCLUDED.name`,
      [productId, hex, targetLang, translatedNames[i]]
    );
  }
  console.log(`✅ Traduções de ${colors.length} cores do produto ${productId} guardadas`);
}

// ── Categoria ──────────────────────────────────────────────────────────────────
export async function saveCategoryTranslations(
  categoryId: number,
  name: string,
  description: string | null,
  sourceLang: 'en' | 'pt' = 'en'
): Promise<void> {
  const targetLang = sourceLang === 'en' ? 'pt' : 'en';

  // Save source language first, independent of translation API
  await pool.query(
    `INSERT INTO category_translations (category_id, lang, name, description)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (category_id, lang) DO UPDATE
       SET name = EXCLUDED.name, description = EXCLUDED.description`,
    [categoryId, sourceLang, name, description]
  );

  let translatedName = name;
  let translatedDesc = description;
  try {
    [translatedName, translatedDesc] = await Promise.all([
      translate(name, sourceLang, targetLang),
      description ? translate(description, sourceLang, targetLang) : Promise.resolve(null),
    ]) as [string, string | null];
  } catch (err) {
    console.error(`⚠️ Translation failed for category ${categoryId}, saving original text as ${targetLang}:`, err);
  }

  await pool.query(
    `INSERT INTO category_translations (category_id, lang, name, description)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (category_id, lang) DO UPDATE
       SET name = EXCLUDED.name, description = EXCLUDED.description`,
    [categoryId, targetLang, translatedName, translatedDesc]
  );

  console.log(`✅ Traduções da categoria ${categoryId} guardadas`);
}
