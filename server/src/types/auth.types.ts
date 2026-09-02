import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
