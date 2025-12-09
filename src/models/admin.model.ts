import { Schema, model, Model } from 'mongoose'
import { IAdmin } from '../types/admin'

const adminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
})

const AdminModel: Model<IAdmin> = model<IAdmin>('Admin', adminSchema)
export default AdminModel;