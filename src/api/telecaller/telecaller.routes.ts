import { Router } from 'express'
import { TelecallerRepository } from './telecaller.repository'
import { TelecallerService } from './telecaller.service'
import { TelecallerController } from './telecaller.controller'
import { authenticate } from '../../utils/jwt'
import { validateBody } from '../../middleware/validation.middleware'
import { editProfileSchema, reapplySchema } from '../../middleware/validation/telecaller.validation'

const router = Router();

const repository = new TelecallerRepository();
const service = new TelecallerService(repository);
const controller = new TelecallerController(service);

router.patch('/reapply', authenticate('TELECALLER'), validateBody(reapplySchema), controller.reapply);
router.patch('/edit-profile', authenticate('TELECALLER'), validateBody(editProfileSchema), controller.editProfile);

export { router as telecallerRouter };