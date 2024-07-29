import express from 'express';
import Column from '../models/columnModel.js';
import Board from '../models/boardModel.js';
import { schemaAddColumn, schemaUpdateColumn } from '../models/columnModel.js';
import authMiddleware from '../middleware/auth.js';

const columnsRouter = express.Router({ mergeParams: true }); // Enable merging of params

// Add a new column

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

// Update a column

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

// Delete a column

export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    await Column.findByIdAndDelete(columnId);
    res.json({ message: 'Column deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all columns for a board

export const getColumnsForBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const columns = await Column.find({ boardId });
    res.json(columns);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

columnsRouter.post('/', authMiddleware, addColumn); // Fix route
columnsRouter.put('/:columnId', authMiddleware, updateColumn); // Fix route
columnsRouter.delete('/:columnId', authMiddleware, deleteColumn); // Fix route
columnsRouter.get('/', authMiddleware, getColumnsForBoard); // Fix route

export default columnsRouter;
