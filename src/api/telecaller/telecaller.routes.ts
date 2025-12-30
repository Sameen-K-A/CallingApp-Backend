import { Router } from 'express'
import { TelecallerRepository } from './telecaller.repository'
import { TelecallerService } from './telecaller.service'
import { TelecallerController } from './telecaller.controller'
import { authenticate } from '../../utils/jwt'
import { validateBody, validateQuery } from '../../middleware/validation.middleware'
import {
   editProfileSchema,
   reapplySchema,
   bankDetailsSchema,
   paginationSchema,
} from '../../middleware/validation/telecaller.validation'

const router = Router();

const repository = new TelecallerRepository();
const service = new TelecallerService(repository);
const controller = new TelecallerController(service);

// Profile routes
router.patch('/reapply', authenticate('TELECALLER'), validateBody(reapplySchema), controller.reapply);
router.patch('/edit-profile', authenticate('TELECALLER'), validateBody(editProfileSchema), controller.editProfile);

// Bank details routes
router.get('/bank-details', authenticate('TELECALLER'), controller.getBankDetails);
router.post('/bank-details', authenticate('TELECALLER'), validateBody(bankDetailsSchema), controller.addBankDetails);
router.delete('/bank-details', authenticate('TELECALLER'), controller.deleteBankDetails);

// Transaction history route
router.get('/transactions', authenticate('TELECALLER'), validateQuery(paginationSchema), controller.getTransactionHistory);

export { router as telecallerRouter };