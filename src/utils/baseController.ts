import { Request } from 'express'
import { ApiError } from '../middleware/errors/ApiError'

export abstract class BaseController {
  protected getUserId(req: Request): string {
    const userId = req.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication failed')
    };

    return userId;
  };
};