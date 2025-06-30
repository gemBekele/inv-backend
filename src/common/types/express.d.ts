import { User } from '@/database/entities';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}