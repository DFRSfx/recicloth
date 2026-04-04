import express from 'express';
import pool from '../config/database.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Apply optional auth to all favorites routes (works for both logged in and anonymous users)
router.use(optionalAuth);

// Middleware to get user ID or session ID
const getUserOrSession = (req: AuthRequest) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] as string || null;
  return { userId, sessionId };
};

// Get favorites (authenticated or by session)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);

    if (!userId && !sessionId) {
      res.json({ favorites: [] });
      return;
    }

    const query = `
      SELECT
        f.id,
        f.product_id,
        f.created_at,
        p.name as product_name,
        p.description,
        p.price,
        p.stock,
        p.stock_mode,
        p.size_stock,
        p.colors,
        p.category_id,
        c.name as category,
        p.featured,
        p.images
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${userId ? 'f.user_id = ?' : 'f.session_id = ?'}
      ORDER BY f.created_at DESC
    `;

    const [favorites] = await pool.query(query, [userId || sessionId]);

    const formattedFavorites = (favorites as any[]).map(item => ({
      id: item.id,
      product_id: String(item.product_id),
      product_name: item.product_name,
      description: item.description,
      price: parseFloat(item.price),
      stock: item.stock,
      stock_mode: item.stock_mode || 'unit',
      size_stock: item.size_stock
        ? (typeof item.size_stock === 'string' ? JSON.parse(item.size_stock) : item.size_stock)
        : [],
      colors: item.colors
        ? (typeof item.colors === 'string' ? JSON.parse(item.colors) : item.colors)
        : [],
      category_id: item.category_id,
      category: item.category || '',
      featured: item.featured,
      created_at: item.created_at,
      images: item.images
        ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images)
        : []
    }));

    res.json({ favorites: formattedFavorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Erro ao obter favoritos' });
  }
});

// Add item to favorites
router.post('/add', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Product ID é obrigatório' });
      return;
    }

    if (!userId && !sessionId) {
      res.status(400).json({ error: 'Sessão inválida' });
      return;
    }

    // Check if product exists
    const [products]: any = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    // Check if item already exists in favorites
    const [existingFavorites]: any = await pool.query(
      `SELECT id FROM favorites WHERE product_id = ? AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [productId, userId || sessionId]
    );

    if (existingFavorites.length > 0) {
      res.json({ message: 'Produto já está nos favoritos', favoriteId: existingFavorites[0].id });
      return;
    }

    // Insert new favorite
    // Only set user_id OR session_id, not both (due to constraint)
    const [result]: any = await pool.query(
      'INSERT INTO favorites (user_id, session_id, product_id) VALUES (?, ?, ?)',
      [userId || null, userId ? null : sessionId, productId]
    );

    res.json({ message: 'Produto adicionado aos favoritos', favoriteId: result.insertId });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Erro ao adicionar aos favoritos' });
  }
});

// Remove item from favorites
router.delete('/:favoriteId', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { favoriteId } = req.params;

    // Verify ownership before deleting
    const result: any = await pool.query(
      `DELETE FROM favorites WHERE id = ? AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [favoriteId, userId || sessionId]
    );

    if (result[0].affectedRows === 0) {
      res.status(404).json({ error: 'Favorito não encontrado' });
      return;
    }

    res.json({ message: 'Produto removido dos favoritos' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Erro ao remover dos favoritos' });
  }
});

// Remove by product ID (alternative endpoint)
router.delete('/product/:productId', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { productId } = req.params;

    // Delete favorite by product ID
    const result: any = await pool.query(
      `DELETE FROM favorites WHERE product_id = ? AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [productId, userId || sessionId]
    );

    if (result[0].affectedRows === 0) {
      res.status(404).json({ error: 'Favorito não encontrado' });
      return;
    }

    res.json({ message: 'Produto removido dos favoritos' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Erro ao remover dos favoritos' });
  }
});

// Clear all favorites
router.delete('/', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);

    if (!userId && !sessionId) {
      res.json({ message: 'Favoritos já estão vazios' });
      return;
    }

    await pool.query(
      `DELETE FROM favorites WHERE ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [userId || sessionId]
    );

    res.json({ message: 'Favoritos limpos' });
  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({ error: 'Erro ao limpar favoritos' });
  }
});

// Merge session favorites to user favorites (called on login)
router.post('/merge', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!sessionId) {
      res.json({ message: 'Nenhuma sessão para merge' });
      return;
    }

    // Get session favorites
    const [sessionFavorites]: any = await pool.query(
      'SELECT product_id FROM favorites WHERE session_id = ?',
      [sessionId]
    );

    if (sessionFavorites.length === 0) {
      res.json({ message: 'Favoritos de sessão vazios' });
      return;
    }

    // Merge each favorite
    for (const favorite of sessionFavorites) {
      // Check if user already has this product in favorites
      const [existingFavorites]: any = await pool.query(
        'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
        [userId, favorite.product_id]
      );

      if (existingFavorites.length === 0) {
        // Insert new favorite for user
        await pool.query(
          'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
          [userId, favorite.product_id]
        );
      }
      // If already exists, skip (don't duplicate)
    }

    // Delete session favorites
    await pool.query('DELETE FROM favorites WHERE session_id = ?', [sessionId]);

    res.json({ message: 'Favoritos sincronizados com sucesso' });
  } catch (error) {
    console.error('Merge favorites error:', error);
    res.status(500).json({ error: 'Erro ao sincronizar favoritos' });
  }
});

// Check if product is favorited
router.get('/check/:productId', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { productId } = req.params;

    if (!userId && !sessionId) {
      res.json({ isFavorite: false });
      return;
    }

    const [favorites]: any = await pool.query(
      `SELECT id FROM favorites WHERE product_id = ? AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [productId, userId || sessionId]
    );

    res.json({ isFavorite: favorites.length > 0 });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Erro ao verificar favorito' });
  }
});

export default router;
