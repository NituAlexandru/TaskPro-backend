import express from 'express';
import Card from '../models/cardModel.js';
import { cardAddSchema, cardUpdateSchema, cardPatchSchema } from '../models/cardModel.js';
import authMiddleware from "../middleware/auth.js"

const cardsRouter = express.Router();

// Add a new card

export const addCard = async (req, res) => {
  const { error } = cardAddSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const userId = req.user.id;
    const { titleCard, description, priority, deadline, columnId, boardId, collaborator } = req.body;
    const newCard = new Card({ titleCard, description, priority, deadline, columnId, owner: userId, boardId, collaborator });
    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

cardsRouter.post('/:columnId/cards', authMiddleware, addCard);

// Update a card

export const updateCard = async (req, res) => {
  const { error } = cardUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const { cardId } = req.params;
    const { titleCard, description, priority, deadline, collaborator } = req.body;
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { titleCard, description, priority, deadline, collaborator },
      { new: true }
    );
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

cardsRouter.put('/:cardId', authMiddleware, updateCard);

// Move a card to a different column

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
    res.status(500).json({ error: 'Server error' });
  }
};

cardsRouter.patch('/:cardId/move', authMiddleware, moveCard);

// Delete a card

export const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    await Card.findByIdAndDelete(cardId);
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

cardsRouter.delete('/:cardId', authMiddleware, deleteCard);

// Get all cards for a column

export const getCardsForColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const cards = await Card.find({ columnId }).populate('collaborator');
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

cardsRouter.get('/:columnId/cards', authMiddleware, getCardsForColumn);


// nu cred ca este utila caci filtrarea se face in getBoardData

// // Filter cards by priority

// export const filterCardsByPriority = async (req, res) => {
//   try {
//     const { priority } = req.query;
//     const userId = req.user.id;
//     const cards = await Card.find({ owner: userId, priority }).populate('collaborator');
//     res.json(cards);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// cardsRouter.get('/filter', authMiddleware, filterCardsByPriority);

export default cardsRouter;