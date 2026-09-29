import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { users, type Role, type UserRecord } from "../services/store";

const secret = process.env.SESSION_SECRET ?? "rentalhub-development-secret";
export const accessCookie = "rentalhub_access";
export const refreshCookie = "rentalhub_refresh";

export function issueToken(user: UserRecord, expiresIn: string | number = "2h") {
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}
export function setAuthCookies(res: Response, user: UserRecord) {
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
  res.cookie(accessCookie, issueToken(user), { ...options, maxAge: 2 * 60 * 60 * 1000 });
  res.cookie(refreshCookie, issueToken(user, "30d"), { ...options, maxAge: 30 * 24 * 60 * 60 * 1000 });
}
export function getUserFromRequest(req: Request) {
  const token = req.cookies?.[accessCookie] as string | undefined;
  if (!token) return undefined;
  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    return users.find((user) => user.id === payload.sub && user.status === "active");
  } catch { return undefined; }
}
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.locals.user = user;
  next();
}
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as UserRecord | undefined;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "You do not have access to this resource" });
      return;
    }
    next();
  };
}