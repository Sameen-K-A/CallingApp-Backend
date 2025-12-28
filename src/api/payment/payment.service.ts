import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { ApiError } from '../../middleware/errors/ApiError';
import { razorpayInstance, razorpayKeyId } from '../../config/razorpay.config';
import {
  IPaymentRepository,
  IPaymentService,
  CreateOrderDto,
  CreateOrderResponse,
  VerifyPaymentDto,
  VerifyPaymentSuccessResponse,
} from './payment.types';

export class PaymentService implements IPaymentService {
  constructor(private paymentRepository: IPaymentRepository) { }

  public async createOrder(userId: string, dto: CreateOrderDto): Promise<CreateOrderResponse> {
    const [user, plan] = await Promise.all([
      this.paymentRepository.findUserById(userId),
      this.paymentRepository.findPlanById(dto.planId),
    ]);

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }
    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }
    if (user.role !== 'USER') {
      throw new ApiError(403, 'Only users can recharge coins.');
    }
    if (!plan) {
      throw new ApiError(404, 'Plan not found or is no longer available.');
    }

    const amountInPaise = plan.amount * 100;

    let razorpayOrder;
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${userId}_${Date.now()}`,
        notes: {
          userId: userId,
          planId: dto.planId,
          coins: plan.coins.toString(),
        },
      });
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new ApiError(502, 'Failed to create payment order. Please try again.');
    }

    await this.paymentRepository.createTransaction({
      userId: new Types.ObjectId(userId),
      type: 'RECHARGE',
      amount: plan.amount,
      coins: plan.coins,
      status: 'PENDING',
      gatewayOrderId: razorpayOrder.id,
    });

    return {
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      planId: dto.planId,
      coins: plan.coins,
      razorpayKeyId: razorpayKeyId,
    };
  }

  public async verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<VerifyPaymentSuccessResponse | null> {
    const transaction = await this.paymentRepository.findTransactionByOrderId(dto.razorpay_order_id);

    if (!transaction) {
      throw new ApiError(404, 'Transaction not found.');
    }

    if (transaction.userId.toString() !== userId) {
      throw new ApiError(403, 'You are not authorized to verify this transaction.');
    }

    if (transaction.status !== 'PENDING') {
      throw new ApiError(400, 'This transaction has already been processed.');
    }

    // Handle cancelled payment (no transaction needed for cancellation)
    if (dto.cancelled === true) {
      await this.paymentRepository.updateTransaction(transaction._id.toString(), {
        status: 'CANCELLED',
      });
      return null;
    }

    // Verify Razorpay signature
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      throw new ApiError(500, 'Payment verification configuration error.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`)
      .digest('hex');

    const isValidSignature = expectedSignature === dto.razorpay_signature;

    if (!isValidSignature) {
      await this.paymentRepository.updateTransaction(transaction._id.toString(), {
        status: 'FAILED',
        gatewayPaymentId: dto.razorpay_payment_id,
        gatewaySignature: dto.razorpay_signature,
      });
      throw new ApiError(400, 'Payment verification failed. Invalid signature.');
    }

    // MongoDB transaction for atomic operations
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Update transaction status
      await this.paymentRepository.updateTransaction(
        transaction._id.toString(),
        {
          status: 'SUCCESS',
          gatewayPaymentId: dto.razorpay_payment_id,
          gatewaySignature: dto.razorpay_signature,
        },
        session
      );

      // Credit coins to user wallet
      const newBalance = await this.paymentRepository.updateUserWalletBalance(
        userId,
        transaction.coins!,
        session
      );

      if (newBalance === null) {
        throw new Error('Failed to update wallet balance.');
      }

      await session.commitTransaction();

      return {
        transactionId: transaction._id.toString(),
        coins: transaction.coins!,
        newBalance: newBalance,
        amount: transaction.amount,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Payment verification transaction failed:', error);
      throw new ApiError(500, 'Failed to process payment. Please contact support.');
    } finally {
      session.endSession();
    }
  }

}