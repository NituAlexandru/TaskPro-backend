import express from 'express';
import Board from '../models/boardModel.js';
import { addBoardSchema, updateBoardSchema } from '../models/boardModel.js';
import authMiddleware from '../middleware/auth.js';
import Column from '../models/columnModel.js';
import Card from '../models/cardModel.js';

const boardsRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Boards
 *   description: API for managing boards
 */

/**
 * @swagger
 * /api/boards:
 *   get:
 *     summary: Get all boards for the authenticated user
 *     tags: [Boards]
 *     responses:
 *       200:
 *         description: List of user boards
 *       500:
 *         description: Server error
 */
const getUserBoards = async (req, res) => {
  try {
    const userId = req.user.id; 
    const boards = await Board.find({ owner: userId }).populate('collaborators');
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

boardsRouter.get('/', authMiddleware, getUserBoards);

/**
 * @swagger
 * /api/boards/{boardId}:
 *   get:
 *     summary: Get all data for a specific board
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the board
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter cards by priority
 *     responses:
 *       200:
 *         description: Board data including columns and cards
 *       404:
 *         description: Board not found
 *       500:
 *         description: Server error
 */
export const getBoardData = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { priority } = req.query; // Get priority from query parameters

    // Find the board and populate collaborators
    const board = await Board.findById(boardId).populate('collaborators', 'name avatarURL');
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
      const cards = await Card.find(filter).populate('collaborators', 'name avatarURL');
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
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

boardsRouter.get('/:boardId', authMiddleware, getBoardData);

/**
 * @swagger
 * /api/boards:
 *   post:
 *     summary: Add a new board
 *     tags: [Boards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               titleBoard:
 *                 type: string
 *               background:
 *                 type: string
 *               icon:
 *                 type: string
 *               collaborators:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Board created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/boards/{boardId}:
 *   put:
 *     summary: Update a board
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the board to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               titleBoard:
 *                 type: string
 *               background:
 *                 type: string
 *               icon:
 *                 type: string
 *               collaborators:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Board updated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/boards/{boardId}:
 *   delete:
 *     summary: Delete a board
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the board to delete
 *     responses:
 *       200:
 *         description: Board deleted successfully
 *       500:
 *         description: Server error
 */
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
