import { Document } from "mongoose"

export interface IAdmin extends Document {
  _id: Types.ObjectId
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}