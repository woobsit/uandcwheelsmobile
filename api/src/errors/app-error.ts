// src/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public message: string = "Server error",
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
  }
}

// Usage in services:
throw new AppError();