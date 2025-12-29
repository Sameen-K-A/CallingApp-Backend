import { Schema, model, Model } from 'mongoose'
import { ITransaction } from '../types/general'

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['RECHARGE', 'WITHDRAWAL'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED'],
    required: true,
    default: 'PENDING',
    index: true
  },

  // For RECHARGE
  coins: {
    type: Number
  },
  gatewayOrderId: {
    type: String,
    index: true,
    sparse: true
  },
  gatewayPaymentId: {
    type: String
  },
  gatewaySignature: {
    type: String
  },

  // For WITHDRAWAL
  transferReference: {
    type: String,
    index: true,
    sparse: true
  },
  bankDetails: {
    accountNumber: {
      type: String
    },
    ifscCode: {
      type: String
    },
    accountHolderName: {
      type: String
    }
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false
})

transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ type: 1, status: 1, createdAt: -1 })

const TransactionModel: Model<ITransaction> = model<ITransaction>('Transaction', transactionSchema)
export default TransactionModel