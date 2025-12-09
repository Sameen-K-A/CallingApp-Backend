import { Types } from 'mongoose'
import { IUserBase } from './general'

export interface IUser extends IUserBase {
  role: 'USER'
  favorites: Types.ObjectId[]
  telecallerProfile?: never
}