import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import createError from '../utils/error.js';
import User from '../models/userModel.js';
import Session from '../models/sessionModel.js';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(createError(401, 'Authorization header is missing'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(createError(401, 'Token is missing'));
  }

  try {
    const { id, sid } = jwt.verify(token, SECRET_KEY);

    const user = await User.findById(id);
    if (!user) {
      return next(createError(401, 'Unauthorized: Invalid user ID'));
    }

    const session = await Session.findById(sid);
    if (!session) {
      return next(createError(401, 'Unauthorized: Invalid session ID'));
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError(401, 'Invalid token'));
    }
    next(createError(500, 'Internal server error'));
  }
};

export default authMiddleware;
