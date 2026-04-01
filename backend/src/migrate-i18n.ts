// backend/src/migrate-i18n.ts
// Executa: npx ts-node src/migrate-i18n.ts
// Traduz todos os produtos e categorias existentes para PT e EN (uma única vez)

import 'dotenv/config';
import pool from './config/database.js';
import {
  saveProductTranslations,
  saveColorTranslations,
  saveCategoryTranslations,
} from './utils/saveTranslations.js';

async function migrateAll() {
  console.log('🚀 A iniciar migração de traduções...\n');

  // ── Produtos ──────────────────────────────────────────────────────────────────
  const [products]: any = await pool.query(
    'SELECT id, name, description, colors FROM products ORDER BY id ASC'
  );
  console.log(`📦 ${products.length} produtos encontrados`);

  for (const p of products) {
    console.log(`  → Produto ${p.id}: "${p.name}"`);
    await saveProductTranslations(p.id, p.name, p.description, 'en');

    const colorsRaw = p.colors;
    const colors = Array.isArray(colorsRaw)
      ? colorsRaw
      : typeof colorsRaw === 'string'
        ? JSON.parse(colorsRaw)
        : [];

    if (Array.isArray(colors) && colors.length > 0) {
      await saveColorTranslations(p.id, colors, 'en');
    }

    // Pausa entre produtos para não rebentar com rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  // ── Categorias ────────────────────────────────────────────────────────────────
  const [categories]: any = await pool.query(
    'SELECT id, name, description FROM categories ORDER BY id ASC'
  );
  console.log(`\n🗂️  ${categories.length} categorias encontradas`);

  for (const c of categories) {
    console.log(`  → Categoria ${c.id}: "${c.name}"`);
    await saveCategoryTranslations(c.id, c.name, c.description || null);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n✅ Migração concluída!');
  process.exit(0);
}

migrateAll().catch(err => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});
