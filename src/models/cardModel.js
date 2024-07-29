import mongoose from "mongoose";
import { handleSaveError } from "../hooks/handleSaveErrors.js";
import { setUpdateOptions } from "../hooks/setUpdateOptions.js";
import Joi from "joi";

const priorityCard = ["without", "low", "medium", "high"];

export const cardSchema = new mongoose.Schema(
  {
    titleCard: {
      type: String,
      required: [true, "Set title for card"],
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
      enum: priorityCard,
      default: "without",
    },
    priorityColor: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "column",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "board",
      required: true,
    },
    collaborator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { versionKey: false, timestamps: true }
);

cardSchema.post("save", handleSaveError);
cardSchema.pre("findOneAndUpdate", setUpdateOptions);

export const cardAddSchema = Joi.object({
  titleCard: Joi.string().required(),
  description: Joi.string().allow(""),
  priority: Joi.string().valid(...priorityCard),
  priorityColor: Joi.string().required(),
  deadline: Joi.date().iso(),
  columnId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  collaborator: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
}).messages({
  "string.pattern.base": `Column not valid`,
  "any.required": `Missing field {#label}`,
});

export const cardUpdateSchema = Joi.object({
  titleCard: Joi.string(),
  description: Joi.string().allow(""),
  priority: Joi.string().valid(...priorityCard),
  priorityColor: Joi.string(),
  deadline: Joi.date().iso(),
  collaborator: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

export const cardPatchSchema = Joi.object({
  columnId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
}).messages({
  "string.pattern.base": `Column not valid`,
  "any.required": `Missing field {#label}`,
});

const Card = mongoose.model("card", cardSchema);

export default Card;
