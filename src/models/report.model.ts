import { Schema, model, Model } from 'mongoose'
import { IReport } from '../types/general'

const reportSchema = new Schema<IReport>({
  callId: {
    type: Schema.Types.ObjectId,
    ref: 'Call',
    required: true,
    index: true
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedAgainst: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
    required: true,
    default: 'PENDING',
    index: true
  },
  adminNotes: {
    type: String,
    maxlength: 2000
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false
})

reportSchema.index({ createdAt: -1 })
reportSchema.index({ reportedAgainst: 1, createdAt: -1 })
reportSchema.index({ status: 1, createdAt: -1 })
reportSchema.index({ resolvedAt: -1 })

const ReportModel: Model<IReport> = model<IReport>('Report', reportSchema)
export default ReportModel;