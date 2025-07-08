import type {Context, Next} from 'hono';

export const errorHandler = (err: any, c: Context) => {
  console.error('Error:', err);

  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map((e: any) => e.message).join(', ');
    error.status = 400;
  }

  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.status = 404;
  }

  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    error.status = 400;
  }

  return c.json({
    error: error.message,
    ...(Bun.env.NODE_ENV === 'development' && { stack: err.stack })
  }, error.status);
};

export const asyncHandler = (fn: (c: Context, next?: Next) => Promise<any>) => {
  return async (c: Context, next: Next) => {
    try {
      return await fn(c, next);
    } catch (err) {
      console.error('Async Handler Error:', err);
      return c.text('Internal Server Error', 500);
    }
  };
};
