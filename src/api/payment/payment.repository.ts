import { ClientSession } from 'mongoose';
import PlanModel from '../../models/plan.model';
import UserModel from '../../models/user.model';
import TransactionModel from '../../models/transaction.model';
import { ITransaction } from '../../types/general';
import {
  IPaymentRepository,
  CreateTransactionData,
  UpdateTransactionData,
  UserForPayment,
  PlanForPayment,
  TransactionForVerification,
} from './payment.types';

export class PaymentRepository implements IPaymentRepository {

  public async findUserById(userId: string): Promise<UserForPayment | null> {
    return UserModel
      .findById(userId)
      .select('_id role accountStatus')
      .lean<UserForPayment>();
  }

  public async findPlanById(planId: string): Promise<PlanForPayment | null> {
    return PlanModel
      .findOne({ _id: planId, isActive: true, isDeleted: false })
      .select('_id amount coins')
      .lean<PlanForPayment>();
  }

  public async createTransaction(data: CreateTransactionData): Promise<ITransaction> {
    const transaction = new TransactionModel(data);
    return transaction.save();
  }

  public async findTransactionByOrderId(orderId: string): Promise<TransactionForVerification | null> {
    return TransactionModel
      .findOne({ gatewayOrderId: orderId })
      .select('_id userId type amount coins status gatewayOrderId')
      .lean<TransactionForVerification>();
  }

  public async updateTransaction(transactionId: string, data: UpdateTransactionData, session?: ClientSession): Promise<ITransaction | null> {
    return TransactionModel.findByIdAndUpdate(transactionId, { $set: data }, { new: true, session });
  }

  public async updateUserWalletBalance(userId: string, coinsToAdd: number, session?: ClientSession): Promise<number | null> {
    const user = await UserModel
      .findByIdAndUpdate(userId, { $inc: { 'wallet.balance': coinsToAdd } }, { new: true, session })
      .select('wallet.balance')
      .lean<{ wallet: { balance: number } }>();

    return user ? user.wallet.balance : null;
  }

}