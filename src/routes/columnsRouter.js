import express from 'express';
import Column from '../models/columnModel.js';
import Board from '../models/boardModel.js';
import { schemaAddColumn, schemaUpdateColumn } from '../models/columnModel.js';
import authMiddleware from '../middleware/auth.js';

const columnsRouter = express.Router({ mergeParams: true }); // Enable merging of params

/**
 * @swagger
 * tags:
 *   name: Columns
 *   description: API for managing columns
 */

/**
 * @swagger
 * /api/boards/{boardId}/columns:
 *   post:
 *     summary: Add a new column
 *     tags: [Columns]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the board
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               titleColumn:
 *                 type: string
 *     responses:
 *       201:
 *         description: Column created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Board not found
 *       500:
 *         description: Server error
 */
export const addColumn = async (req, res) => {
  const { error } = schemaAddColumn.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const userId = req.user.id;
    const { titleColumn } = req.body;
    const { boardId } = req.params; // Get boardId from params
    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const newColumn = new Column({ titleColumn, boardId, owner: userId });
    await newColumn.save();
    res.status(201).json(newColumn);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}:
 *   put:
 *     summary: Update a column
 *     tags: [Columns]
 *     parameters:
 *       - in: path
 *         name: columnId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the column to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               titleColumn:
 *                 type: string
 *     responses:
 *       200:
 *         description: Column updated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export const updateColumn = async (req, res) => {
  const { error } = schemaUpdateColumn.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const { columnId } = req.params;
    const { titleColumn } = req.body;
    const updatedColumn = await Column.findByIdAndUpdate(
      columnId,
      { titleColumn },
      { new: true }
    );
    res.json(updatedColumn);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}:
 *   delete:
 *     summary: Delete a column
 *     tags: [Columns]
 *     parameters:
 *       - in: path
 *         name: columnId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the column to delete
 *     responses:
 *       200:
 *         description: Column deleted successfully
 *       500:
 *         description: Server error
 */
export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    await Column.findByIdAndDelete(columnId);
    res.json({ message: 'Column deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns:
 *   get:
 *     summary: Get all columns for a board
 *     tags: [Columns]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the board
 *     responses:
 *       200:
 *         description: List of columns
 *       500:
 *         description: Server error
 */
export const getColumnsForBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const columns = await Column.find({ boardId });
    res.json(columns);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

columnsRouter.post('/', authMiddleware, addColumn); // Add a new column
columnsRouter.put('/:columnId', authMiddleware, updateColumn); // Update a column
columnsRouter.delete('/:columnId', authMiddleware, deleteColumn); // Delete a column
columnsRouter.get('/', authMiddleware, getColumnsForBoard); // Get all columns for a board

export default columnsRouter;

