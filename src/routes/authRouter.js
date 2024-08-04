import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import createError from '../utils/error.js';
import User from '../models/userModel.js';
import Session from '../models/sessionModel.js';
import ctrlWrapper from '../utils/ctrlWrapper.js';
import queryString from 'query-string';
import axios from 'axios';
import { signUpSchema, signInSchema, refreshTokenSchema } from '../models/userModel.js';

dotenv.config();

const { SECRET_KEY, GOOGLE_CLIENT_ID, BACKEND_URL, GOOGLE_CLIENT_SECRET, FRONT_URL } = process.env;

const authRouter = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 *         avatarURL:
 *           type: string
 *           description: The user's avatar URL
 *         theme:
 *           type: string
 *           description: The user's theme
 *       example:
 *         name: John Doe
 *         email: john.doe@example.com
 *         password: password123
 *         avatarURL: default
 *         theme: dark
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The authentication managing API
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Conflict - email already exists
 */
const signUp = async (req, res, next) => {
  const { error } = signUpSchema.validate(req.body);

  if (error) {
    throw createError(400, error.details[0].message);
  }

  const { name, email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    throw createError(409, "Provided email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
  });

  const newSession = await Session.create({
    uid: newUser._id,
  });

  const payload = {
    id: newUser._id,
    sid: newSession._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "20h" });
  const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });

  res.status(201).json({
    message: "Successful operation",
    token,
    refreshToken,
    user: {
      name: newUser.name,
      email: newUser.email,
      theme: newUser.theme,
      avatarURL: newUser.avatarURL,
    },
  });
};

authRouter.post('/register', ctrlWrapper(signUp));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
 *               password:
 *                 type: string
 *                 description: The user's password
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       403:
 *         description: Invalid email or password
 */
const signIn = async (req, res, next) => {
  const { error } = signInSchema.validate(req.body);

  if (error) {
    throw createError(400, error.details[0].message);
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw createError(403, "Invalid email or password");
  }

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw createError(403, "Invalid email or password");
  }

  const newSession = await Session.create({
    uid: user._id,
  });

  const payload = {
    id: user._id,
    sid: newSession._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "20h" });
  const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });

  res.json({
    message: "Successful operation",
    token,
    refreshToken,
    user: {
      name: user.name,
      email: user.email,
      theme: user.theme,
      avatarURL: user.avatarURL,
    },
  });
};

authRouter.post('/login', ctrlWrapper(signIn));

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       403:
 *         description: Invalid refresh token
 */
const refreshToken = async (req, res) => {
  const { error } = refreshTokenSchema.validate(req.body);

  if (error) {
    throw createError(403, error.details[0].message);
  }

  const { refreshToken: requestToken } = req.body;

  try {
    const { id, sid } = jwt.verify(requestToken, SECRET_KEY);

    const user = await User.findById(id);
    if (!user) {
      throw createError(403, "Invalid refresh token");
    }

    const session = await Session.findById(sid);
    if (!session) {
      throw createError(403, "Invalid refresh token");
    }

    const payload = {
      id,
      sid,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "20h" });
    const newRefreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });

    res.status(200).json({
      message: "Token refreshed successfully",
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    throw createError(403, "Invalid refresh token");
  }
};

authRouter.post('/refresh-token', ctrlWrapper(refreshToken));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: Logout successful
 *       403:
 *         description: Invalid refresh token
 */
const logOut = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    throw createError(403, "Refresh token is required");
  }

  try {
    const { sid } = jwt.verify(requestToken, SECRET_KEY);

    const session = await Session.findById(sid);
    if (!session) {
      throw createError(403, "Invalid refresh token");
    }

    await Session.findByIdAndDelete(sid);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    throw createError(403, "Invalid refresh token");
  }
};

authRouter.post('/logout', ctrlWrapper(logOut));

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Redirect to Google authentication
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google authentication
 */
const googleAuth = (req, res) => {
  const stringifiedParams = queryString.stringify({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google-redirect`,
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ].join(" "),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });

  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
  );
};

authRouter.get('/google', ctrlWrapper(googleAuth));

/**
 * @swagger
 * /api/auth/google-redirect:
 *   get:
 *     summary: Handle Google authentication redirect
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to front-end with tokens and session info
 *       500:
 *         description: Internal server error
 */
const googleRedirect = async (req, res) => {
  try {
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const urlParams = queryString.parse(fullUrl.split('?')[1]);

    const code = urlParams.code;

    const tokenResponse = await axios({
      method: 'post',
      url: `https://oauth2.googleapis.com/token`,
      data: queryString.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BACKEND_URL}/api/auth/google-redirect`,
        grant_type: 'authorization_code',
        code,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, id_token } = tokenResponse.data;

    const userInfoResponse = await axios({
      method: 'get',
      url: `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    });

    const { email, name, picture } = userInfoResponse.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        avatarURL: picture,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 12),
      });
    }

    const newSession = await Session.create({
      uid: user._id,
    });

    const payload = {
      id: user._id,
      sid: newSession._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '20h' });
    const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });

    // Redirect to front-end with tokens and session info
    res.redirect(`${FRONT_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&sid=${newSession._id}`);
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).send('Internal Server Error');
  }
};

authRouter.get('/google-redirect', ctrlWrapper(googleRedirect));

export default authRouter;
