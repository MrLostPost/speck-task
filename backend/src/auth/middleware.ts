import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
}

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) throw new Error("Missing JWT_SECRET env var");

const SECRET: jwt.Secret = rawSecret;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.signedCookies?.session as string | undefined;
    if (!token) return res.status(401).json({ error: "Unauthenticated" });

    const decoded = jwt.verify(token, SECRET);

    if (typeof decoded !== "object" || decoded === null || !("userId" in decoded)) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.auth = { userId: (decoded as AuthPayload).userId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

export function createSessionCookie(payload: AuthPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}