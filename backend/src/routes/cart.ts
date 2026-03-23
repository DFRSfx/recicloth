import express from 'express';
import pool from '../config/database.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Apply optional auth to all cart routes (works for both logged in and anonymous users)
router.use(optionalAuth);

// Middleware to get user ID or session ID
const getUserOrSession = (req: AuthRequest) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] as string || null;
  return { userId, sessionId };
};

// Get cart items (authenticated or by session)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);

    if (!userId && !sessionId) {
      res.json({ items: [] });
      return;
    }

    const query = `
      SELECT
        ci.id,
        ci.product_id,
        ci.quantity,
        p.name as product_name,
        p.price,
        p.stock,
        p.category_id,
        p.images
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ${userId ? 'ci.user_id = ?' : 'ci.session_id = ?'}
      ORDER BY ci.created_at DESC
    `;

    const [items] = await pool.query(query, [userId || sessionId]);

    const formattedItems = (items as any[]).map(item => ({
      ...item,
      price: parseFloat(item.price),
      images: item.images
        ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images)
        : []
    }));

    res.json({ items: formattedItems });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Erro ao obter carrinho' });
  }
});

// Add item to cart
router.post('/add', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Product ID é obrigatório' });
      return;
    }

    if (!userId && !sessionId) {
      res.status(400).json({ error: 'Sessão inválida' });
      return;
    }

    // Check if product exists and has stock
    const [products]: any = await pool.query(
      'SELECT id, stock FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    if (products[0].stock < quantity) {
      res.status(400).json({ error: 'Stock insuficiente' });
      return;
    }

    // Check if item already exists in cart
    const [existingItems]: any = await pool.query(
      `SELECT id, quantity FROM cart_items WHERE product_id = ? AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [productId, userId || sessionId]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;

      if (products[0].stock < newQuantity) {
        res.status(400).json({ error: 'Stock insuficiente' });
        return;
      }

      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );

      res.json({ message: 'Quantidade atualizada', cartItemId: existingItems[0].id });
    } else {
      // Insert new item
      // Only set user_id OR session_id, not both (due to constraint)
      const [result]: any = await pool.query(
        'INSERT INTO cart_items (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, ?)',
        [userId || null, userId ? null : sessionId, productId, quantity]
      );

      res.json({ message: 'Item adicionado ao carrinho', cartItemId: result.insertId });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
  }
});

// Update cart item quantity
router.put('/:itemId', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({ error: 'Quantidade inválida' });
      return;
    }

    // Verify ownership and get product info
    const [items]: any = await pool.query(
      `SELECT ci.*, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND ${userId ? 'ci.user_id = ?' : 'ci.session_id = ?'}`,
      [itemId, userId || sessionId]
    );

    if (items.length === 0) {
      res.status(404).json({ error: 'Item não encontrado no carrinho' });
      return;
    }

    if (items[0].stock < quantity) {
      res.status(400).json({ error: 'Stock insuficiente' });
      return;
    }

    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, itemId]
    );

    res.json({ message: 'Quantidade atualizada' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Erro ao atualizar carrinho' });
  }
});

// Remove item from cart
router.delete('/:itemId', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { itemId } = req.params;

    // Verify ownership before deleting
    const result: any = await pool.query(
      `DELETE FROM cart_items WHERE id = ? AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [itemId, userId || sessionId]
    );

    if (result[0].affectedRows === 0) {
      res.status(404).json({ error: 'Item não encontrado no carrinho' });
      return;
    }

    res.json({ message: 'Item removido do carrinho' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Erro ao remover do carrinho' });
  }
});

// Clear cart
router.delete('/', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);

    if (!userId && !sessionId) {
      res.json({ message: 'Carrinho já está vazio' });
      return;
    }

    await pool.query(
      `DELETE FROM cart_items WHERE ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [userId || sessionId]
    );

    res.json({ message: 'Carrinho limpo' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Erro ao limpar carrinho' });
  }
});

// Merge session cart to user cart (called on login)
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

    // Get session cart items
    const [sessionItems]: any = await pool.query(
      'SELECT product_id, quantity FROM cart_items WHERE session_id = ?',
      [sessionId]
    );

    if (sessionItems.length === 0) {
      res.json({ message: 'Carrinho de sessão vazio' });
      return;
    }

    // Merge each item
    for (const item of sessionItems) {
      // Check if user already has this product
      const [existingItems]: any = await pool.query(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
        [userId, item.product_id]
      );

      if (existingItems.length > 0) {
        // Update quantity (add session quantity to user quantity)
        await pool.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, existingItems[0].id]
        );
      } else {
        // Insert new item for user
        await pool.query(
          'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [userId, item.product_id, item.quantity]
        );
      }
    }

    // Delete session cart items
    await pool.query('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);

    res.json({ message: 'Carrinho sincronizado com sucesso' });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ error: 'Erro ao sincronizar carrinho' });
  }
});

export default router;
