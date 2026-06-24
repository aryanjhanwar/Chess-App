import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HTTP_STATUS } from '../shared/constants/http.constants';

/**
 * Validation middleware factory.
 * Wraps a Zod schema and returns an Express middleware that validates req.body.
 *
 * On success: req.body is replaced with the parsed (and stripped of extra fields) data.
 * On failure: 422 Unprocessable Entity with structured field errors.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller.register)
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(HTTP_STATUS.UNPROCESSABLE).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace body with validated + stripped data (removes unexpected fields)
    req.body = result.data;
    next();
  };
}

/** Formats Zod errors into a clean field → message map */
function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
