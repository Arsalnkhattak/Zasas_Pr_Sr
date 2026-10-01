export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details?: any) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized', details?: any) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Forbidden', details?: any) {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Resource not found', details?: any) {
    return new ApiError(404, message, details);
  }

  static conflict(message = 'Resource conflict', details?: any) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Internal Server Error', details?: any) {
    return new ApiError(500, message, details);
  }
}
