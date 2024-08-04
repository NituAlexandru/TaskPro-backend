import express from "express";
import mongoose from "mongoose";
import createError from "../utils/error.js";
import User, { helpRequestSchema, updateThemeSchema, updateProfileSchema } from "../models/userModel.js";
import authMiddleware from "../middleware/auth.js";
import ctrlWrapper from "../utils/ctrlWrapper.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../config/multer.js";
import * as fs from 'node:fs/promises';
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';

const usersRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing users
 */

/**
 * @swagger
 * /api/users/theme:
 *   post:
 *     summary: Change user theme
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               theme:
 *                 type: string
 *     responses:
 *       200:
 *         description: Theme updated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const changeTheme = async (req, res) => {
  try {
    const userId = req.user._id; // Ensure user ID is correctly accessed

    const { theme } = req.body;

    const { error } = updateThemeSchema.validate({ theme });
    if (error) {
      throw createError(400, error.details[0].message);
    }

    const user = await User.findByIdAndUpdate(userId, { theme }, { new: true });

    res.status(200).json({
      message: "Theme updated successfully",
      user: {
        id: user._id,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

usersRouter.post('/theme', authMiddleware, ctrlWrapper(changeTheme));

/**
 * @swagger
 * /api/users/current:
 *   get:
 *     summary: Get current user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id; // Ensure user ID is correctly accessed

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
usersRouter.get('/current', authMiddleware, ctrlWrapper(getCurrentUser));

/**
 * @swagger
 * /api/users/avatar:
 *   patch:
 *     summary: Change user avatar
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const changeAvatar = async (req, res) => {
  if (!req.file) {
    throw createError(400, "No file uploaded");
  }

  try {
    // Upload the file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'avatars', // Optional: specify a folder for organization
      transformation: [{ width: 150, height: 150, crop: "limit" }]
    });

    const userId = req.user._id;
    const avatarURL = result.secure_url; // Cloudinary provides a secure URL for the image

    const user = await User.findByIdAndUpdate(
      userId,
      { avatarURL },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw createError(404, "User not found");
    }

    // Delete the file from the local filesystem
    await fs.unlink(req.file.path);

    res.status(200).json({
      message: "Avatar updated successfully",
      avatarURL: user.avatarURL,
    });
  } catch (error) {
    // Ensure the file is deleted if there is an error
    if (fs.existsSync(req.file.path)) {
      await fs.unlink(req.file.path);
    }
    throw createError(500, `Cloudinary upload failed: ${error.message}`);
  }
};

usersRouter.patch('/avatar', authMiddleware, upload.single('avatar'), ctrlWrapper(changeAvatar));

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               theme:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const updateProfile = async (req, res) => {
  // Validate the request body against the schema
  const { error } = updateProfileSchema.validate(req.body);

  if (error) {
    throw createError(400, error.details[0].message);
  }

  const userId = req.user._id;
  const updates = req.body;

  // Hash the password before updating if it is being changed
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 12);
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });

  if (!user) {
    throw createError(404, "User not found");
  }

  res.status(200).json({
    message: "Profile updated successfully",
    user: {
      name: user.name,
      email: user.email,
      theme: user.theme,
      avatarURL: user.avatarURL,
    },
  });
};

usersRouter.patch("/profile", authMiddleware, ctrlWrapper(updateProfile));

/**
 * @swagger
 * /api/users/help-request:
 *   post:
 *     summary: Request help
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Help request submitted successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Error sending email
 */
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const requestHelp = async (req, res) => {
  const { error } = helpRequestSchema.validate(req.body);
  if (error) {
    throw createError(400, error.details[0].message);
  }

  const { email, message } = req.body;

  // Define the email options
  const mailOptions = {
    from: `"Support" <${process.env.EMAIL_USER}>`, // sender address
    to: process.env.EMAIL_USER, // list of receivers (you can add multiple emails separated by commas)
    subject: "Help Request", // Subject line
    text: `Help request from (${email}):\n\n${message}`, // plain text body
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Help request submitted successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    throw createError(500, "Error sending email");
  }
};

usersRouter.post("/help-request", ctrlWrapper(requestHelp));

/**
 * @swagger
 * /api/users/details-by-email/{email}:
 *   get:
 *     summary: Get user details by email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The email of the user
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
usersRouter.get('/details-by-email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ userId: user._id, name: user.name, avatar: user.avatarURL });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/users/get-users-by-ids:
 *   post:
 *     summary: Get users by their IDs
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Some IDs are invalid
 *       500:
 *         description: Internal server error
 */
usersRouter.post('/get-users-by-ids', async (req, res) => {
  const { ids } = req.body;

  try {
    // Filter out invalid IDs
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      return res.status(400).json({ message: 'Some IDs are invalid' });
    }

    const users = await User.find({ _id: { $in: validIds } });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

export default usersRouter;
