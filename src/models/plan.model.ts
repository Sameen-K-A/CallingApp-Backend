import { Schema, model, Model } from 'mongoose'
import { IPlan } from '../types/general'

const planSchema = new Schema<IPlan>({
  amount: {
    type: Number,
    required: true
  },
  coins: {
    type: Number,
    required: true
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
})

planSchema.index({ isDeleted: 1, isActive: 1, amount: 1 })

const PlanModel: Model<IPlan> = model<IPlan>('Plan', planSchema)
export default PlanModel;