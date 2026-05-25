import { UserRole } from '../../models/User.model';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
      email: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};