import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import UserModel from '../models/User.js';

const router = express.Router();

/**
 * Get all users (Admin only)
 * GET /api/users
 * Query params: role (optional) - filter by 'admin' or 'customer'
 */
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const role = req.query.role as 'admin' | 'customer' | undefined;

    const users = await UserModel.findAll(role);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao obter utilizadores' });
  }
});

/**
 * Get user by ID (Admin only)
 * GET /api/users/:id
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = parseInt(req.params.id);
      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'Utilizador não encontrado' });
        return;
      }

      // Remove password from response
      const safeUser = await UserModel.getSafeUser(user);

      res.json({
        success: true,
        user: safeUser
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Erro ao obter utilizador' });
    }
  }
);

/**
 * Create new user (Admin only)
 * POST /api/users
 * Body: { email, password, name, role, status }
 */
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Email válido é obrigatório'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password deve ter no mínimo 6 caracteres'),
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('role')
      .optional()
      .isIn(['customer', 'admin'])
      .withMessage('Role deve ser "customer" ou "admin"'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Status inválido')
  ],
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, name, role, status } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: 'Email já registado' });
        return;
      }

      // Create user
      const userId = await UserModel.create({
        email,
        password,
        name,
        role: role || 'customer',
        status: status || 'active'
      });

      // Get created user
      const newUser = await UserModel.findById(userId);
      if (!newUser) {
        res.status(500).json({ error: 'Erro ao criar utilizador' });
        return;
      }

      const safeUser = await UserModel.getSafeUser(newUser);

      res.status(201).json({
        success: true,
        message: `Utilizador ${role === 'admin' ? 'administrador' : ''} criado com sucesso`,
        user: safeUser
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Erro ao criar utilizador' });
    }
  }
);

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 * Body: { email?, password?, name?, role?, status? }
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('ID inválido'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password deve ter no mínimo 6 caracteres'),
    body('name').optional().trim().notEmpty().withMessage('Nome não pode estar vazio'),
    body('role')
      .optional()
      .isIn(['customer', 'admin'])
      .withMessage('Role deve ser "customer" ou "admin"'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Status inválido')
  ],
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = parseInt(req.params.id);
      const updateData = req.body;

      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilizador não encontrado' });
        return;
      }

      // Prevent admin from removing their own admin role
      if (userId === req.user?.id && updateData.role && updateData.role !== 'admin') {
        res.status(400).json({
          error: 'Não pode remover a própria permissão de administrador'
        });
        return;
      }

      // If changing email, check if new email is available
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await UserModel.findByEmail(updateData.email);
        if (existingUser) {
          res.status(400).json({ error: 'Email já está em uso' });
          return;
        }
      }

      // Update user
      await UserModel.update(userId, updateData);

      // Get updated user
      const updatedUser = await UserModel.findById(userId);
      if (!updatedUser) {
        res.status(500).json({ error: 'Erro ao atualizar utilizador' });
        return;
      }

      const safeUser = await UserModel.getSafeUser(updatedUser);

      res.json({
        success: true,
        message: 'Utilizador atualizado com sucesso',
        user: safeUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Erro ao atualizar utilizador' });
    }
  }
);

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = parseInt(req.params.id);

      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilizador não encontrado' });
        return;
      }

      // Prevent admin from deleting themselves
      if (userId === req.user?.id) {
        res.status(400).json({
          error: 'Não pode eliminar a própria conta'
        });
        return;
      }

      // Delete user
      await UserModel.delete(userId);

      res.json({
        success: true,
        message: 'Utilizador eliminado com sucesso'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Erro ao eliminar utilizador' });
    }
  }
);

/**
 * Get user statistics (Admin only)
 * GET /api/users/stats/overview
 */
router.get('/stats/overview', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const totalUsers = await UserModel.count();
    const totalCustomers = await UserModel.count('customer');
    const totalAdmins = await UserModel.count('admin');

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalAdmins
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
