import express from 'express';
import { z } from 'zod';
import { query } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
});

// Get all tags
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      'SELECT * FROM trade_tags WHERE user_id = $1 ORDER BY name',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create tag
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, color } = createTagSchema.parse(req.body);

    const result = await query(
      'INSERT INTO trade_tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, color]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Tag name already exists' });
    }
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tag
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const tagId = req.params.id;
    const { name, color } = createTagSchema.partial().parse(req.body);

    const result = await query(
      `UPDATE trade_tags
       SET name = COALESCE($1, name), color = COALESCE($2, color)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [name, color, tagId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Tag name already exists' });
    }
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete tag
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const tagId = req.params.id;

    const result = await query(
      'DELETE FROM trade_tags WHERE id = $1 AND user_id = $2 RETURNING id',
      [tagId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
