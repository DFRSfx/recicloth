import express from 'express';
import pool from '../config/database.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { BUSINESS_RULES } from '../config/businessRules.js';

const router = express.Router();

router.use(optionalAuth);

const getUserOrSession = (req: AuthRequest) => {
  const userId = req.user?.id || null;
  const sessionId = (req.headers['x-session-id'] as string) || null;
  return { userId, sessionId };
};

const calculateTotals = (items: any[]) => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const vatAmount = Number((subtotal * BUSINESS_RULES.VAT_RATE).toFixed(2));
  const total = Number((subtotal + vatAmount).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), vatAmount, total };
};

const fetchCartItems = async (userId: number | null, sessionId: string | null) => {
  const identifier = userId ?? sessionId;
  const whereClause = userId ? 'ci.user_id = ?' : 'ci.session_id = ?';
  const [items] = await pool.query(
    `
      SELECT
        ci.id,
        ci.product_id,
        ci.quantity,
        ci.color,
        ci.size,
        p.name as product_name,
        p.price,
        p.stock,
        p.stock_mode,
        p.size_stock,
        p.colors,
        p.category_id,
        p.images
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ${whereClause}
      ORDER BY ci.created_at DESC
    `,
    [identifier]
  );
  return items as any[];
};

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);

    if (!userId && !sessionId) {
      res.json({
        items: [],
        totals: { subtotal: 0, vatRate: BUSINESS_RULES.VAT_RATE, vatAmount: 0, total: 0, currency: BUSINESS_RULES.CURRENCY }
      });
      return;
    }

    const items = await fetchCartItems(userId, sessionId);
    const formattedItems = items.map(item => ({
      ...item,
      price: Number(item.price),
      images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
      colors: item.colors ? (typeof item.colors === 'string' ? JSON.parse(item.colors) : item.colors) : [],
      size_stock: item.size_stock ? (typeof item.size_stock === 'string' ? JSON.parse(item.size_stock) : item.size_stock) : [],
    }));

    const totals = calculateTotals(formattedItems);

    res.json({
      items: formattedItems,
      totals: {
        subtotal: totals.subtotal,
        vatRate: BUSINESS_RULES.VAT_RATE,
        vatAmount: totals.vatAmount,
        total: totals.total,
        currency: BUSINESS_RULES.CURRENCY
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Erro ao obter carrinho' });
  }
});

const addToCartHandler = async (req: AuthRequest, res: any) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { productId, quantity = 1, color = null, size = null } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Product ID é obrigatório' });
      return;
    }

    if (!userId && !sessionId) {
      res.status(400).json({ error: 'Sessão inválida' });
      return;
    }

    const [products]: any = await pool.query('SELECT id, stock FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    if (Number(products[0].stock) <= 0) {
      res.status(400).json({ error: 'Produto sem stock' });
      return;
    }

    if (Number(products[0].stock) < Number(quantity)) {
      res.status(400).json({ error: 'Stock insuficiente' });
      return;
    }

    // Match by product + color + size so each variant is a separate cart row
    const [existingItems]: any = await pool.query(
      `SELECT id, quantity FROM cart_items
       WHERE product_id = ?
         AND COALESCE(color, '') = COALESCE(?, '')
         AND COALESCE(size, '') = COALESCE(?, '')
         AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [productId, color, size, userId || sessionId]
    );

    let cartItemId: number;
    if (existingItems.length > 0) {
      const newQuantity = Number(existingItems[0].quantity) + Number(quantity);
      if (Number(products[0].stock) < newQuantity) {
        res.status(400).json({ error: 'Stock insuficiente' });
        return;
      }

      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existingItems[0].id]);
      cartItemId = Number(existingItems[0].id);
    } else {
      const [result]: any = await pool.query(
        'INSERT INTO cart_items (user_id, session_id, product_id, quantity, color, size) VALUES (?, ?, ?, ?, ?, ?)',
        [userId || null, userId ? null : sessionId, productId, quantity, color, size]
      );
      cartItemId = Number(result.insertId);
    }

    const items = await fetchCartItems(userId, sessionId);
    const formattedItems = items.map(item => ({
      ...item,
      price: Number(item.price),
      images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
      colors: item.colors ? (typeof item.colors === 'string' ? JSON.parse(item.colors) : item.colors) : [],
      size_stock: item.size_stock ? (typeof item.size_stock === 'string' ? JSON.parse(item.size_stock) : item.size_stock) : [],
    }));
    const totals = calculateTotals(formattedItems);

    res.json({
      message: 'Carrinho atualizado',
      cartItemId,
      items: formattedItems,
      totals: {
        subtotal: totals.subtotal,
        vatRate: BUSINESS_RULES.VAT_RATE,
        vatAmount: totals.vatAmount,
        total: totals.total,
        currency: BUSINESS_RULES.CURRENCY
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
  }
};

router.post('/', addToCartHandler);
router.post('/add', addToCartHandler);

router.put('/:itemId', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
      res.status(400).json({ error: 'Quantidade inválida' });
      return;
    }

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

    if (Number(items[0].stock) < Number(quantity)) {
      res.status(400).json({ error: 'Stock insuficiente' });
      return;
    }

    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);

    const freshItems = await fetchCartItems(userId, sessionId);
    const totals = calculateTotals(freshItems);

    res.json({
      message: 'Quantidade atualizada',
      totals: {
        subtotal: totals.subtotal,
        vatRate: BUSINESS_RULES.VAT_RATE,
        vatAmount: totals.vatAmount,
        total: totals.total,
        currency: BUSINESS_RULES.CURRENCY
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Erro ao atualizar carrinho' });
  }
});

router.delete('/:itemId', async (req: AuthRequest, res) => {
  try {
    const { userId, sessionId } = getUserOrSession(req);
    const { itemId } = req.params;

    const [result]: any = await pool.query(
      `DELETE FROM cart_items WHERE id = ? AND ${userId ? 'user_id = ?' : 'session_id = ?'}`,
      [itemId, userId || sessionId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Item não encontrado no carrinho' });
      return;
    }

    const items = await fetchCartItems(userId, sessionId);
    const totals = calculateTotals(items);

    res.json({
      message: 'Item removido do carrinho',
      totals: {
        subtotal: totals.subtotal,
        vatRate: BUSINESS_RULES.VAT_RATE,
        vatAmount: totals.vatAmount,
        total: totals.total,
        currency: BUSINESS_RULES.CURRENCY
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Erro ao remover do carrinho' });
  }
});

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

    res.json({
      message: 'Carrinho limpo',
      totals: { subtotal: 0, vatRate: BUSINESS_RULES.VAT_RATE, vatAmount: 0, total: 0, currency: BUSINESS_RULES.CURRENCY }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Erro ao limpar carrinho' });
  }
});

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

    const [sessionItems]: any = await pool.query(
      'SELECT product_id, quantity, color, size FROM cart_items WHERE session_id = ?',
      [sessionId]
    );

    if (sessionItems.length === 0) {
      res.json({ message: 'Carrinho de sessão vazio' });
      return;
    }

    for (const item of sessionItems) {
      const [existingItems]: any = await pool.query(
        `SELECT id, quantity FROM cart_items
         WHERE user_id = ? AND product_id = ?
           AND COALESCE(color, '') = COALESCE(?, '')
           AND COALESCE(size, '') = COALESCE(?, '')`,
        [userId, item.product_id, item.color, item.size]
      );

      if (existingItems.length > 0) {
        await pool.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [item.quantity, existingItems[0].id]);
      } else {
        await pool.query(
          'INSERT INTO cart_items (user_id, product_id, quantity, color, size) VALUES (?, ?, ?, ?, ?)',
          [userId, item.product_id, item.quantity, item.color, item.size]
        );
      }
    }

    await pool.query('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);
    res.json({ message: 'Carrinho sincronizado com sucesso' });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ error: 'Erro ao sincronizar carrinho' });
  }
});

export default router;
