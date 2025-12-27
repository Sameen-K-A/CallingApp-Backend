import { IUserDocument } from "../types/general";
import { ITelecaller } from "../types/telecaller";
import { IUser } from "../types/user";

export function isTelecaller(user: IUserDocument): user is ITelecaller {
   return user.role === 'TELECALLER';
};

export function isUser(user: IUserDocument): user is IUser {
   return user.role === 'USER';
};