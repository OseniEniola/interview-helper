import {Request, Response, NextFunction } from "express";
import { TokenExpiredError } from "jsonwebtoken";

const jwt = require('jsonwebtoken');

// Middleware to verify JWT
export const authenticateJWT = (req: any, res: Response, next: NextFunction)  => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err:any, user:any) => {
      if(err instanceof TokenExpiredError){
        res.sendStatus(401);
      }
      if (err) {
        return res.sendStatus(403); // Invalid token
      }
      req.user = user; // Attach decoded user info to request
      next();
    });
  } else {
    res.sendStatus(401); // No token provided
  }
};