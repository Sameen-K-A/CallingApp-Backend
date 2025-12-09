import { Router } from 'express'
import { TelecallerRepository } from './telecaller.repository'
import { TelecallerService } from './telecaller.service'
import { TelecallerController } from './telecaller.controller'

const router = Router();

const repository = new TelecallerRepository();
const service = new TelecallerService(repository);
const controller = new TelecallerController(service);

router.get('/route');

export { router as telecallerRouter };