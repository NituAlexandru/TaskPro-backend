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

//changeTheme

const changeTheme = async (req, res) => {
  try {
    const userId = req.user._id; // Ensure user ID is correctly accessed
    console.log('Request user ID for theme update:', userId);

    const { theme } = req.body;

    const { error } = updateThemeSchema.validate({ theme });
    if (error) {
      throw createError(400, error.details[0].message);
    }

    const user = await User.findByIdAndUpdate(userId, { theme }, { new: true });
    console.log('Updated user theme:', user.theme);

    res.status(200).json({
      message: "Theme updated successfully",
      user: {
        id: user._id,
        theme: user.theme,
      },
    });
  } catch (error) {
    console.log('Error in updateTheme:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

usersRouter.post('/theme', authMiddleware, ctrlWrapper(changeTheme));

//get currentUser

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id; // Ensure user ID is correctly accessed
    console.log('Request user ID:', userId);

    const user = await User.findById(userId);
    console.log('Found user:', user);

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
    console.log('Error in getUser:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
usersRouter.get('/current', authMiddleware, ctrlWrapper(getCurrentUser));

//changeAvatar

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

//updateProfile

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

//needHelp

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

// Get user by email

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