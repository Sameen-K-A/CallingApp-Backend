import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../../utils/baseController';
import { IPaymentService, CreateOrderDto, VerifyPaymentDto, WithdrawDto } from './payment.types';

export class PaymentController extends BaseController {
  constructor(private paymentService: IPaymentService) {
    super();
  }

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const dto: CreateOrderDto = req.body;

      const orderDetails = await this.paymentService.createOrder(userId, dto);

      res.status(200).json({
        success: true,
        message: 'Order created successfully.',
        data: orderDetails,
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const dto: VerifyPaymentDto = req.body;

      const result = await this.paymentService.verifyPayment(userId, dto);

      if (result === null) {
        res.status(200).json({
          success: false,
          message: 'Payment was cancelled.',
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Recharge successful! ${result.coins} coins added to your wallet.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const dto: WithdrawDto = req.body;

      const result = await this.paymentService.withdraw(userId, dto);

      res.status(200).json({
        success: true,
        message: 'Withdrawal request submitted successfully. Please wait for admin approval.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

}