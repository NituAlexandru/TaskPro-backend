import mongoose from 'mongoose';
import { handleSaveError } from '../hooks/handleSaveErrors.js';
import { setUpdateOptions } from '../hooks/setUpdateOptions.js';
import Joi from 'joi';
import { columnSchema } from './columnModel.js';

// Constants
const BACKGROUND_NAMES = [
  "block", "abstractSpheres", "balloonFestival", "cherryBlossomTree", "cloudySky",
  "crescentMoon", "desertArch", "hotAirBalloon", "milkyWayCamp", "moonEclipse",
  "palmLeaves", "pinkFlowers", "rockyCoast", "sailboat", "turquoiseBay", "starryMountains"
];
const ICON_NAMES = [
  "loadingIcon", "colorsIcon", "containerIcon", "hexagonIcon", "lightningIcon",
  "projectIcon", "puzzlePieceIcon", "starIcon"
];

// Mongoose Schema
const boardSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    titleBoard: {
      type: String,
      required: [true, 'Title cannot be empty'],
    },
    background: {
      type: String,
      enum: {
        values: BACKGROUND_NAMES,
        message: `Background value must be in the list: ${BACKGROUND_NAMES.join(', ')}`,
      }
    },
    icon: {
      type: String,
      enum: {
        values: ICON_NAMES,
        message: `Icon value must be in the list: ${ICON_NAMES.join(', ')}`,
      }
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    columns: [columnSchema],
  },
  { 
    versionKey: false, 
    timestamps: true 
  }
);

// Middleware
boardSchema.post('save', handleSaveError);
boardSchema.pre('findOneAndUpdate', setUpdateOptions);

// Joi Validation Schemas
export const addBoardSchema = Joi.object({
  titleBoard: Joi.string().required(),
  background: Joi.string().valid(...BACKGROUND_NAMES),
  icon: Joi.string().valid(...ICON_NAMES),
  collaborators: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ),
});

export const updateBoardSchema = Joi.object({
  titleBoard: Joi.string(),
  background: Joi.string().valid(...BACKGROUND_NAMES),
  icon: Joi.string().valid(...ICON_NAMES),
  collaborators: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ),
});

// Mongoose Model
const Board = mongoose.model('Board', boardSchema);

export default Board;
