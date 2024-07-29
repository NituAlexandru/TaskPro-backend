import express from 'express';
import Card from '../models/cardModel.js';
import Column from '../models/columnModel.js';
import { cardAddSchema, cardUpdateSchema, cardPatchSchema } from '../models/cardModel.js';
import authMiddleware from '../middleware/auth.js';

const cardsRouter = express.Router({ mergeParams: true }); // Ensure mergeParams is true

const addCard = async (req, res) => {
  const { error } = cardAddSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const userId = req.user.id;
    const { titleCard, description, priority, priorityColor, deadline, collaborator } = req.body;
    const columnId = req.params.columnId;
    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const newCard = new Card({
      titleCard,
      description,
      priority,
      priorityColor,
      deadline,
      columnId,
      owner: userId,
      boardId: column.boardId,
      collaborator,
    });
    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

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

const getCardsForColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const cards = await Card.find({ columnId });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const moveCard = async (req, res) => {
  const { error } = cardPatchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const { cardId } = req.params;
    const { columnId } = req.body;
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { columnId },
      { new: true }
    );
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

cardsRouter.patch("/:cardId/move", authMiddleware, moveCard);
cardsRouter.post('/', authMiddleware, addCard);
cardsRouter.put('/:cardId', authMiddleware, updateCard);
cardsRouter.delete('/:cardId', authMiddleware, deleteCard);
cardsRouter.get('/', authMiddleware, getCardsForColumn);

export default cardsRouter;
