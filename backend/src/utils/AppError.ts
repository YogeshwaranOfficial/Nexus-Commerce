// ─── utils/AppError.ts ───────────────────────────────────
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, string>[];

  constructor(message: string, statusCode: number, errors?: Record<string, string>[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
