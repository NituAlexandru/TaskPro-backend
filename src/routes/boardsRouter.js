import express from 'express';
import Board from '../models/boardModel.js';
import { addBoardSchema, updateBoardSchema } from '../models/boardModel.js';
import authMiddleware from '../middleware/auth.js';
import Column from '../models/columnModel.js';
import Card from '../models/cardModel.js';

const boardsRouter = express.Router();

// Get all boards for a user

export const getUserBoards = async (req, res) => {
    try {
        const userId = req.user.id;
        const boards = await Board.find({ owner: userId }).populate('collaborators');
        res.json(boards);
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
};

boardsRouter.get('/', authMiddleware, getUserBoards);

// Get all data for a specific board

export const getBoardData = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { priority } = req.query; // Get priority from query parameters
        const board = await Board.findById(boardId).populate('collaborators');
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }
    
        // Get all columns for the board
        const columns = await Column.find({ boardId });
        
        // Get all cards for each column with optional priority filter
        const columnsWithCards = await Promise.all(columns.map(async (column) => {
          const filter = { columnId: column._id };
          if (priority) {
            filter.priority = priority;
          }
          const cards = await Card.find(filter).populate('collaborator');
          return {
            ...column.toObject(),
            cards,
          };
        }));
    
        res.json({
          ...board.toObject(),
          columns: columnsWithCards,
        });
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
};

boardsRouter.get('/:boardId', authMiddleware, getBoardData);

// Add a new board

export const addBoard = async (req, res) => {
    const { error } = addBoardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      const userId = req.user.id;
      const { titleBoard, background, icon, collaborators } = req.body;
      const newBoard = new Board({ owner: userId, titleBoard, background, icon, collaborators });
      await newBoard.save();
      res.status(201).json(newBoard);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
};

boardsRouter.post('/', authMiddleware, addBoard);

// Update a board

export const updateBoard = async (req, res) => {
    const { error } = updateBoardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      const { boardId } = req.params;
      const { titleBoard, background, icon, collaborators } = req.body;
      const updatedBoard = await Board.findByIdAndUpdate(
        boardId,
        { titleBoard, background, icon, collaborators },
        { new: true }
      );
      res.json(updatedBoard);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
};

boardsRouter.put('/:boardId', authMiddleware, updateBoard);

// Delete a board

export const deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    await Board.findByIdAndDelete(boardId);
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

boardsRouter.delete('/:boardId', authMiddleware, deleteBoard);

 export default boardsRouter;
