import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import createError from '../utils/error.js';
import User from '../models/userModel.js';
import Session from '../models/sessionModel.js';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);

  if (!authHeader) {
    console.log('No authorization header present');
    return next(createError(401, 'Authorization header is missing'));
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted token:', token);

  if (!token) {
    console.log('No token found in authorization header');
    return next(createError(401, 'Token is missing'));
  }

  try {
    const { id, sid } = jwt.verify(token, SECRET_KEY);
    console.log('Decoded token:', { id, sid });

    const user = await User.findById(id);
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found');
      return next(createError(401, 'Unauthorized: Invalid user ID'));
    }

    const session = await Session.findById(sid);
    console.log('Found session:', session);

    if (!session) {
      console.log('Session not found');
      return next(createError(401, 'Unauthorized: Invalid session ID'));
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.log('Token verification error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError(401, 'Invalid token'));
    }
    next(createError(500, 'Internal server error'));
  }
};

export default authMiddleware;
