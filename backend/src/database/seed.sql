INSERT INTO categories (name, slug, description, image) VALUES
('Homem', 'homem', 'Roupa reciclada e segunda-mao para homem', NULL),
('Mulher', 'mulher', 'Moda sustentavel para mulher', NULL),
('Acessórios', 'acessorios', 'Acessorios unicos e sustentaveis', NULL),
('Upcycled', 'upcycled', 'Pecas transformadas com criatividade', NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, weight, category_id, stock, featured, colors, images)
SELECT * FROM (
  VALUES
  ('Casaco Denim Rework', 'Estado: Bom estado. Material: 100% algodao organico. Tipo: Upcycled.', 34.90, 650, (SELECT id FROM categories WHERE slug = 'upcycled'), 1, TRUE, '["Azul"]'::jsonb, '["https://picsum.photos/seed/recicloth-1/800/800"]'::jsonb),
  ('Camisa Vintage Linen', 'Estado: Muito bom estado. Material: Linho reciclado. Tipo: Segunda-mao.', 24.50, 180, (SELECT id FROM categories WHERE slug = 'homem'), 1, FALSE, '["Bege"]'::jsonb, '["https://picsum.photos/seed/recicloth-2/800/800"]'::jsonb),
  ('Calcas Chino Eco', 'Estado: Bom estado. Material: Algodao reciclado. Tipo: Segunda-mao.', 21.90, 420, (SELECT id FROM categories WHERE slug = 'homem'), 1, FALSE, '["Caqui"]'::jsonb, '["https://picsum.photos/seed/recicloth-3/800/800"]'::jsonb),
  ('Vestido Floral Renew', 'Estado: Excelente estado. Material: Viscose reciclada. Tipo: Reciclado.', 29.90, 380, (SELECT id FROM categories WHERE slug = 'mulher'), 1, TRUE, '["Verde"]'::jsonb, '["https://picsum.photos/seed/recicloth-4/800/800"]'::jsonb),
  ('Blusa Terra Organica', 'Estado: Muito bom estado. Material: 100% algodao organico. Tipo: Segunda-mao.', 19.90, 160, (SELECT id FROM categories WHERE slug = 'mulher'), 1, FALSE, '["Terracota"]'::jsonb, '["https://picsum.photos/seed/recicloth-5/800/800"]'::jsonb),
  ('Saia Midi Circular', 'Estado: Bom estado. Material: Poliester reciclado. Tipo: Reciclado.', 22.90, 350, (SELECT id FROM categories WHERE slug = 'mulher'), 1, FALSE, '["Preto"]'::jsonb, '["https://picsum.photos/seed/recicloth-6/800/800"]'::jsonb),
  ('Mala Tote Recycled', 'Estado: Excelente estado. Material: Lona reaproveitada. Tipo: Upcycled.', 26.00, 580, (SELECT id FROM categories WHERE slug = 'acessorios'), 1, TRUE, '["Castanho"]'::jsonb, '["https://picsum.photos/seed/recicloth-7/800/800"]'::jsonb),
  ('Cinto Couro Vintage', 'Estado: Bom estado. Material: Couro reutilizado. Tipo: Segunda-mao.', 14.90, 85, (SELECT id FROM categories WHERE slug = 'acessorios'), 1, FALSE, '["Castanho Escuro"]'::jsonb, '["https://picsum.photos/seed/recicloth-8/800/800"]'::jsonb),
  ('Mochila Patchwork', 'Estado: Muito bom estado. Material: Retalhos de algodao. Tipo: Upcycled.', 32.00, 720, (SELECT id FROM categories WHERE slug = 'upcycled'), 1, TRUE, '["Multicolor"]'::jsonb, '["https://picsum.photos/seed/recicloth-9/800/800"]'::jsonb),
  ('Sweat Oversized Reborn', 'Estado: Bom estado. Material: Algodao reciclado + fleece. Tipo: Reciclado.', 27.50, 540, (SELECT id FROM categories WHERE slug = 'upcycled'), 1, FALSE, '["Cinza"]'::jsonb, '["https://picsum.photos/seed/recicloth-10/800/800"]'::jsonb),
  ('T-Shirt Minimal Green', 'Estado: Excelente estado. Material: 100% algodao organico. Tipo: Segunda-mao.', 12.90, 140, (SELECT id FROM categories WHERE slug = 'homem'), 1, FALSE, '["Branco"]'::jsonb, '["https://picsum.photos/seed/recicloth-11/800/800"]'::jsonb),
  ('Top Crop Upcycled', 'Estado: Muito bom estado. Material: Algodao reaproveitado. Tipo: Upcycled.', 16.90, 120, (SELECT id FROM categories WHERE slug = 'mulher'), 1, FALSE, '["Verde floresta"]'::jsonb, '["https://picsum.photos/seed/recicloth-12/800/800"]'::jsonb)
) AS p(name, description, price, weight, category_id, stock, featured, colors, images)
WHERE category_id IS NOT NULL;
