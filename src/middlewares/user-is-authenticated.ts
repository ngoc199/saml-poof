import { Request, Response, NextFunction } from "express";

export const userIsAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  const searchParams = new URLSearchParams({
    return_to: req.originalUrl,
  });
  return res.redirect(`/login?${searchParams.toString()}`);
};
