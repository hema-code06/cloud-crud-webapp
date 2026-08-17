import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.sf?.accessToken) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }
  next();
}