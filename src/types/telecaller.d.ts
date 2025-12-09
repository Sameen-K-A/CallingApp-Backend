import { IUserBase } from './general'

export interface ITelecaller extends IUserBase {
  role: 'TELECALLER'
  telecallerProfile: {
    about: string
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
    verificationNotes?: string
    presence: 'ONLINE' | 'OFFLINE' | 'ON_CALL'
  };
  favorites?: never
};