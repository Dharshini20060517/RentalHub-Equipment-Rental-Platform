import type { Response } from "express";

export function badRequest(res: Response, message: string) { return res.status(400).json({ error: message }); }
export function notFound(res: Response, message = "Resource not found") { return res.status(404).json({ error: message }); }
export function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
export function parsePage(value: unknown, fallback = 1) { return Math.max(1, Math.floor(parseNumber(value, fallback))); }
export function parseLimit(value: unknown, fallback = 12) { return Math.min(50, Math.max(1, Math.floor(parseNumber(value, fallback)))); }