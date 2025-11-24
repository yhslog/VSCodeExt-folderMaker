/**
 * Base error class for template-related errors
 */
export class TemplateError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TemplateError";
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

/**
 * Error thrown when user cancels an operation
 */
export class UserCancelledError extends Error {
  constructor(message: string = "Operation cancelled by user") {
    super(message);
    this.name = "UserCancelledError";
    Object.setPrototypeOf(this, UserCancelledError.prototype);
  }
}

/**
 * Error thrown when a path security violation is detected
 */
export class PathSecurityError extends TemplateError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "PATH_SECURITY_ERROR", context);
    this.name = "PathSecurityError";
    Object.setPrototypeOf(this, PathSecurityError.prototype);
  }
}

/**
 * Error thrown when template validation fails
 */
export class TemplateValidationError extends TemplateError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "TEMPLATE_VALIDATION_ERROR", context);
    this.name = "TemplateValidationError";
    Object.setPrototypeOf(this, TemplateValidationError.prototype);
  }
}
