import express from 'express';
import Card from '../models/cardModel.js';
import Column from '../models/columnModel.js';
import { cardAddSchema, cardUpdateSchema, cardPatchSchema } from '../models/cardModel.js';
import authMiddleware from '../middleware/auth.js';

const cardsRouter = express.Router({ mergeParams: true }); // Ensure mergeParams is true

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: API for managing cards
 */

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}/cards:
 *   post:
 *     summary: Add a new card
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: columnId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the column
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               titleCard:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *               priorityColor:
 *                 type: string
 *               deadline:
 *                 type: string
 *               collaborators:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Card created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Column not found
 *       500:
 *         description: Server error
 */
const addCard = async (req, res) => {
  const { error } = cardAddSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const userId = req.user.id;
    const { titleCard, description, priority, priorityColor, deadline, collaborators } = req.body;
    const columnId = req.params.columnId;
    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    console.log("Received Collaborators: ", collaborators); // Debugging log

    const newCard = new Card({
      titleCard,
      description,
      priority,
      priorityColor,
      deadline,
      columnId,
      owner: userId,
      boardId: column.boardId,
      collaborators,
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}/cards/{cardId}:
 *   put:
 *     summary: Update a card
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the card to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               titleCard:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *               priorityColor:
 *                 type: string
 *               deadline:
 *                 type: string
 *               collaborators:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Card updated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
const updateCard = async (req, res) => {
  const { error } = cardUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const { cardId } = req.params;
    const updatedCard = await Card.findByIdAndUpdate(cardId, req.body, { new: true });
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}/cards/{cardId}:
 *   delete:
 *     summary: Delete a card
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the card to delete
 *     responses:
 *       200:
 *         description: Card deleted successfully
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
export const deleteCard = async (req, res) => {
  try {
    const { columnId, cardId } = req.params;
    const card = await Card.findOneAndDelete({ _id: cardId, columnId });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({ message: "Card deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}/cards:
 *   get:
 *     summary: Get all cards in a column
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: columnId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the column
 *     responses:
 *       200:
 *         description: List of cards
 *       500:
 *         description: Server error
 */
export const getCardsForColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const cards = await Card.find({ columnId });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}/cards/{cardId}:
 *   get:
 *     summary: Get data for a specific card
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the card
 *     responses:
 *       200:
 *         description: Card data
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
export const getCardData = async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/columns/{columnId}/cards/{cardId}/move:
 *   patch:
 *     summary: Move a card to a new column
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the card to move
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               newColumnId:
 *                 type: string
 *                 description: The ID of the new column
 *     responses:
 *       200:
 *         description: Card moved successfully
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
export const moveCard = async (req, res) => {
  const { cardId } = req.params;
  const { newColumnId } = req.body;

  try {
    // Update the card to move it to the new column
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { columnId: newColumnId },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

cardsRouter.patch("/:cardId/move", authMiddleware, moveCard); // Endpoint to move a card to a new column
cardsRouter.post('/', authMiddleware, addCard); // Add a new card
cardsRouter.put('/:cardId', authMiddleware, updateCard); // Update a card
cardsRouter.delete('/:cardId', authMiddleware, deleteCard); // Delete a card
cardsRouter.get('/', authMiddleware, getCardsForColumn); // Get all cards in a column
cardsRouter.get('/:cardId', authMiddleware, getCardData); // Get card data

export default cardsRouter;

