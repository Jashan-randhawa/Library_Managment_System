import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color =
      status >= 500 ? "\x1b[31m" : // red
      status >= 400 ? "\x1b[33m" : // yellow
      status >= 200 ? "\x1b[32m" : // green
      "\x1b[0m";
    console.log(
      `${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${status} ${duration}ms\x1b[0m`
    );
  });
  next();
};
