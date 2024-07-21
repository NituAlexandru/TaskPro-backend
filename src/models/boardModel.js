import mongoose from "mongoose";
import { handleSaveError } from '../hooks/handleSaveErrors.js';
import {setUpdateOptions} from "../hooks/setUpdateOptions.js";
import Joi from 'joi';
import { columnSchema } from "./columnModel.js";

const backgroundNames=["default"];
const iconsNames=["default"];

const boardSchema = new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
      },
      titleBoard: {
        type: String,
        required: [true, 'Title cannot be empty'],
      },
      background: {
        type: String,
        enum: {
          values: backgroundNames,
          message: `Background value must be in list ${backgroundNames}`,
        },
        default: 'default',
      },
      icon: {
        type: String,
        enum: {
          values: iconsNames,
          message: `Icon value must be in list ${iconsNames}`,
        },
        default: 'default',
      },
      collaborators: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'user',
        },
      ],
      columns: [columnSchema],
    },
    { versionKey: false, timestamps: true }
  );
  
  boardSchema.post('save', handleSaveError);
  boardSchema.pre('findOneAndUpdate', setUpdateOptions);

  export const addBoardSchema = Joi.object({
    titleBoard: Joi.string().required(),
    background: Joi.string().valid(...backgroundNames),
    icon: Joi.string().valid(...iconsNames),
    collaborators: Joi.array().items(
      Joi.string().regex(/^[0-9a-fA-F]{24}$/)
    ),
  });
  export const updateBoardSchema = Joi.object({
    titleBoard: Joi.string(),
    background: Joi.string().valid(...backgroundNames),
    icon: Joi.string().valid(...iconsNames),
    collaborators: Joi.array().items(
      Joi.string().regex(/^[0-9a-fA-F]{24}$/)
    ),
  });

  const Board = mongoose.model('Board', boardSchema);

  export default Board;