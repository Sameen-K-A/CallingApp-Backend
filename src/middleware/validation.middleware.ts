import { Request, Response, NextFunction } from 'express'
import { ObjectSchema } from 'joi'

export const validateBody = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: true })

    if (error) {
      return next({
        statusCode: 400,
        message: error.details[0].message
      })
    }

    next()
  }
}

export const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, { abortEarly: true })

    if (error) {
      return next({
        statusCode: 400,
        message: error.details[0].message
      })
    }

    next()
  }
}

export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: true })

    if (error) {
      return next({
        statusCode: 400,
        message: error.details[0].message
      })
    }

    next()
  }
}