import { Router } from 'express';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware';
import {
  googleLoginSchema,
  paginationSchema,
  rejectTelecallerSchema,
  reportIdParamSchema,
  telecallerFilterSchema,
  telecallerIdParamSchema,
  transactionFilterSchema,
  transactionIdParamSchema,
  updateReportStatusSchema,
  userIdParamSchema,
  planIdParamSchema,
  createPlanSchema,
  updatePlanSchema,
  updateConfigSchema
} from '../../middleware/validation/admin.validation';
import { authenticate } from '../../utils/jwt';

const router = Router()

const repository = new AdminRepository();
const service = new AdminService(repository);
const controller = new AdminController(service);

router.post('/auth/google', validateBody(googleLoginSchema), controller.googleLogin);

// Dashboard stats
router.get('/dashboard/stats', authenticate('ADMIN'), controller.getDashboardStats);

// User actions
router.get('/users', authenticate('ADMIN'), validateQuery(paginationSchema), controller.getUsers);
router.get('/users/:id', authenticate('ADMIN'), validateParams(userIdParamSchema), controller.getUserDetails);
router.post('/users/:id/block', authenticate('ADMIN'), validateParams(userIdParamSchema), controller.blockUser);
router.post('/users/:id/unblock', authenticate('ADMIN'), validateParams(userIdParamSchema), controller.unblockUser);

//Manage tele callers
router.get('/telecallers', authenticate('ADMIN'), validateQuery(telecallerFilterSchema), controller.getTelecallers);
router.get('/telecallers/:id', authenticate('ADMIN'), validateParams(telecallerIdParamSchema), controller.getTelecallerDetails)
router.patch('/telecallers/:id/approve', authenticate('ADMIN'), validateParams(telecallerIdParamSchema), controller.approveTelecaller);
router.patch('/telecallers/:id/reject', authenticate('ADMIN'), validateParams(telecallerIdParamSchema), validateBody(rejectTelecallerSchema), controller.rejectTelecaller);

//Transaction routes
router.get('/transactions', authenticate('ADMIN'), validateQuery(transactionFilterSchema), controller.getTransactions);
router.get('/transactions/:id', authenticate('ADMIN'), validateParams(transactionIdParamSchema), controller.getTransactionDetails);

// Reports management
router.get('/reports', authenticate('ADMIN'), validateQuery(paginationSchema), controller.getReports);
router.get('/reports/:id', authenticate('ADMIN'), validateParams(reportIdParamSchema), controller.getReportDetails);
router.patch('/reports/:id/status', authenticate('ADMIN'), validateParams(reportIdParamSchema), validateBody(updateReportStatusSchema), controller.updateReportStatus);

// Plan Management
router.get('/plans', authenticate('ADMIN'), validateQuery(paginationSchema), controller.getPlans);
router.post('/plans', authenticate('ADMIN'), validateBody(createPlanSchema), controller.createPlan);
router.put('/plans/:id', authenticate('ADMIN'), validateParams(planIdParamSchema), validateBody(updatePlanSchema), controller.updatePlan);
router.delete('/plans/:id', authenticate('ADMIN'), validateParams(planIdParamSchema), controller.deletePlan);

// Configuration Management
router.get('/config', authenticate('ADMIN'), controller.getConfig);
router.put('/config', authenticate('ADMIN'), validateBody(updateConfigSchema), controller.updateConfig);

export { router as adminRouter };