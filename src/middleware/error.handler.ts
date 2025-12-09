import { NextFunction, Request, Response } from 'express'

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'An unexpected server error occurred.'

  console.error(`
    - [ERROR] ${statusCode}
    - MESSAGE: ${message}
    - URL: ${req.originalUrl}
    - Method: ${req.method}`)

  res.status(statusCode).json({
    success: false,
    status: 'error',
    message
  })
}