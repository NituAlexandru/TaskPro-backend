import mongoose from "mongoose";
import Joi from "joi";
import { emailRegexp, passwordRegexp, nameRegexp, deadlineRegexp } from "../utils/validators.js";
import { handleSaveError } from "../hooks/handleSaveErrors.js";
import { setUpdateOptions } from "../hooks/setUpdateOptions.js";

// Constants
const THEME_LIST = ["dark", "light", "violet"];

// Mongoose Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      match: [nameRegexp, "Please enter a valid name"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [emailRegexp, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      match: [passwordRegexp, "Password must meet the required criteria"],
    },
    avatarURL: {
      type: String,
      default: "default",
    },
    theme: {
      type: String,
      enum: THEME_LIST,
      default: "dark",
    },
    googleId: String,
  },
  { versionKey: false, timestamps: true }
);

// Middleware
userSchema.post("save", handleSaveError);
userSchema.pre("findOneAndUpdate", setUpdateOptions);
userSchema.post("findOneAndUpdate", handleSaveError);

// Mongoose Model
const User = mongoose.model("User", userSchema);
export default User;

// Validation Schemas
// Auth Router
export const signUpSchema = Joi.object({
  name: Joi.string().pattern(nameRegexp).required().messages({
    "string.empty": "Name must not be empty",
    "any.required": "Name is a required field",
    "string.pattern.base": "Invalid name format",
  }),
  email: Joi.string().pattern(emailRegexp).required().messages({
    "string.empty": "Email must not be empty",
    "any.required": "Email is a required field",
    "string.pattern.base": "Invalid email format",
  }),
  password: Joi.string().pattern(passwordRegexp).min(8).required().messages({
    "string.empty": "Password must not be empty",
    "any.required": "Password is a required field",
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base": "Invalid password format",
  }),
});

export const signInSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required().messages({
    "string.empty": "Email must not be empty",
    "any.required": "Email is a required field",
    "string.pattern.base": "Invalid email format",
  }),
  password: Joi.string().pattern(passwordRegexp).min(8).required().messages({
    "string.empty": "Password must not be empty",
    "any.required": "Password is a required field",
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base": "Invalid password format",
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "string.empty": "Refresh token must not be empty",
    "any.required": "Refresh token is a required field",
  }),
});

// Users Router
export const updateThemeSchema = Joi.object({
  theme: Joi.string().valid(...THEME_LIST).required().messages({
    "any.only": `Theme must be one of ${THEME_LIST.join(", ")}`,
    "any.required": "Theme is a required field",
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().pattern(nameRegexp).messages({
    "string.pattern.base": "Invalid name format",
  }),
  email: Joi.string().pattern(emailRegexp).messages({
    "string.pattern.base": "Invalid email format",
  }),
  password: Joi.string().pattern(passwordRegexp).min(8).messages({
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base": "Invalid password format",
  }),
});

export const helpRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email must not be empty",
    "any.required": "Email is a required field",
    "string.email": "Invalid email format",
  }),
  message: Joi.string().min(10).required().messages({
    "string.empty": "Message must not be empty",
    "any.required": "Message is a required field",
    "string.min": "Message must be at least 10 characters long",
  }),
});

// Tasks Router
export const taskSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title must not be empty",
    "any.required": "Title is a required field",
  }),
  description: Joi.string().optional(),
  deadline: Joi.string().pattern(deadlineRegexp).required().messages({
    "string.empty": "Deadline must not be empty",
    "any.required": "Deadline is a required field",
    "string.pattern.base": "Invalid deadline format. Use DD/MM/YYYY",
  }),
});
