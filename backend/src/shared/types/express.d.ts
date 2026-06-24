declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        email: string;
        rating: number;
      };
    }
  }
}

export {};