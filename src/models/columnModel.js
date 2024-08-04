
import mongoose from "mongoose";
import { handleSaveError } from "../hooks/handleSaveErrors.js";
import { setUpdateOptions } from "../hooks/setUpdateOptions.js";
import Joi from "joi";
import { cardSchema } from "./cardModel.js";

// Mongoose Schema
export const columnSchema = new mongoose.Schema(
  {
    titleColumn: {
      type: String,
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'board',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'user',
    },
    cards: [cardSchema],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Middleware
columnSchema.post('save', handleSaveError);
columnSchema.pre('findOneAndUpdate', setUpdateOptions);
columnSchema.post('findOneAndUpdate', handleSaveError);

// Joi Validation Schemas
export const schemaAddColumn = Joi.object({
  titleColumn: Joi.string().required().min(1).max(150),
  boardId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
}).messages({
  'string.pattern.base': `Board not valid`,
  'any.required': `Missing field {#label}`,
});

export const schemaUpdateColumn = Joi.object({
  titleColumn: Joi.string().min(1).max(150),
});

// Mongoose Model
const Column = mongoose.model("Column", columnSchema);

export default Column;
