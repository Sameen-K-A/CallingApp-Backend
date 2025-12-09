import { Router } from 'express'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware'
import { completeProfileSchema, editProfileSchema, paginationSchema, telecallerIdParamSchema } from '../../middleware/validation/user.validation'
import { authenticate } from '../../utils/jwt'

const router = Router()

const repository = new UserRepository()
const service = new UserService(repository)
const controller = new UserController(service)

router.get('/me', authenticate(), controller.getMyDetails)
router.patch('/complete-profile', authenticate(), validateBody(completeProfileSchema), controller.completeProfile)
router.patch('/edit-profile', authenticate(), validateBody(editProfileSchema), controller.editProfile)

// Plan routes
router.get('/plans', authenticate(), controller.getPlans)

// Favorites routes
router.get('/favorites', authenticate(), validateQuery(paginationSchema), controller.getFavorites)
router.post('/favorites/:telecallerId', authenticate(), validateParams(telecallerIdParamSchema), controller.addToFavorites)
router.delete('/favorites/:telecallerId', authenticate(), validateParams(telecallerIdParamSchema), controller.removeFromFavorites)

// telecallers
router.get('/telecallers', authenticate(), validateQuery(paginationSchema), controller.getTelecallers);

export { router as userRouter };