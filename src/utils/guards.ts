import { IUserDocument } from "../types/general";
import { ITelecaller } from "../types/telecaller";
import { IUser } from "../types/user";

// Type for lean documents (plain objects without mongoose Document methods)
type LeanTelecaller = Omit<ITelecaller, keyof Document>;
type LeanUser = Omit<IUser, keyof Document>;

// Type guard for mongoose documents
export function isTelecaller(user: IUserDocument): user is ITelecaller {
   return user.role === 'TELECALLER';
};

export function isUser(user: IUserDocument): user is IUser {
   return user.role === 'USER';
};

// Type guard for lean documents (plain objects from .lean())
export function isLeanTelecaller(user: unknown): user is LeanTelecaller {
   return (
      typeof user === 'object' &&
      user !== null &&
      'role' in user &&
      (user as any).role === 'TELECALLER' &&
      'telecallerProfile' in user
   );
};

export function isLeanUser(user: unknown): user is LeanUser {
   return (
      typeof user === 'object' &&
      user !== null &&
      'role' in user &&
      (user as any).role === 'USER'
   );
};