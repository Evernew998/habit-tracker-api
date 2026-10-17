import type { Request, Response, NextFunction } from 'express'
import env from '../../env.ts'

export class APIError extends Error {
  status: number
  name: string
  message: string
  constructor(status: number, name: string, message: string) {
    super()
    this.status = status
    this.name = name
    this.message = message
  }
}

export const errorHandler = (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(err.stack)

  let status = err.status || 500
  let message = err.message || 'Internal Server Error'

  if (err.name === 'ValidationError') {
    status = 400
    message = 'Validation Error'
  }

  if (err.name === 'UnauthorizedError') {
    status = 401
    message = 'Unauthorized'
  }

  return res.status(status).json({
    error: message,
    ...(env.APP_STAGE === 'dev' && {
      stack: err.stack,
      details: err.message,
    }),
  })
}
