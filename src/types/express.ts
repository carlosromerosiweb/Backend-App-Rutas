import { Request } from 'express';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
}; 