import { TelecallerResponse, IUserRepository, PlanResponse, UserUpdatePayload, FavoriteTelecallerResponse } from './user.types'
import UserModel from '../../models/user.model'
import { IUserDocument } from '../../types/general'
import PlanModel from '../../models/plan.model'
import TransactionModel from '../../models/transaction.model'
import { Types } from 'mongoose'

export class UserRepository implements IUserRepository {
  public async findUserById(userId: string): Promise<IUserDocument | null> {
    return UserModel.findById(userId)
  };

  public async findTelecallerById(telecallerId: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ _id: new Types.ObjectId(telecallerId), role: 'TELECALLER' })
  };

  public async updateUser(userId: string, payload: UserUpdatePayload): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(userId, { $set: payload }, { new: true })
  };

  public async findActivePlans(): Promise<PlanResponse[]> {
    return PlanModel.aggregate<PlanResponse>([
      { $match: { isActive: true, isDeleted: false } },
      { $sort: { amount: 1 } },
      { $project: { _id: { $toString: '$_id' }, amount: 1, coins: 1, discountPercentage: 1, createdAt: 1 } }
    ])
  };

  public async hasSuccessfulRecharge(userId: string): Promise<boolean> {
    const result = await TransactionModel.exists({
      userId: new Types.ObjectId(userId),
      type: 'RECHARGE',
      status: 'SUCCESS'
    });
    return result !== null;
  };

  public async findFavoritesByUserId(userId: string, page: number, limit: number): Promise<{ favorites: FavoriteTelecallerResponse[], total: number }> {
    const skip = (page - 1) * limit

    const result = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      { $project: { favorites: { $ifNull: ['$favorites', []] } } },
      {
        $lookup: {
          from: 'users',
          let: { favoriteIds: '$favorites' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $gt: [{ $size: '$$favoriteIds' }, 0] },
                    { $in: ['$_id', '$$favoriteIds'] }
                  ]
                },
                role: 'TELECALLER',
                accountStatus: 'ACTIVE',
                'telecallerProfile.approvalStatus': 'APPROVED'
              }
            },
            {
              $project: {
                _id: { $toString: '$_id' },
                name: 1,
                profile: 1,
                language: 1,
                about: '$telecallerProfile.about',
                presence: '$telecallerProfile.presence'
              }
            }
          ],
          as: 'favoriteDetails'
        }
      },
      {
        $project: {
          favorites: '$favoriteDetails',
          total: { $size: '$favoriteDetails' }
        }
      },
      {
        $project: {
          favorites: { $slice: ['$favorites', skip, limit] },
          total: 1
        }
      }
    ])

    if (!result || result.length === 0) {
      return { favorites: [], total: 0 }
    }

    return {
      favorites: result[0].favorites,
      total: result[0].total
    }
  };

  public async isInFavorites(userId: string, telecallerId: string): Promise<boolean> {
    const result = await UserModel.findOne({
      _id: new Types.ObjectId(userId),
      favorites: new Types.ObjectId(telecallerId)
    })

    return result !== null
  };

  public async getFavoritesCount(userId: string): Promise<number> {
    const result = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      { $project: { count: { $size: { $ifNull: ['$favorites', []] } } } }
    ])

    return result[0]?.count || 0
  };

  public async addToFavorites(userId: string, telecallerId: string): Promise<{ success: boolean; alreadyExists: boolean }> {
    const telecallerObjectId = new Types.ObjectId(telecallerId)

    // Try to add using $addToSet (handles duplicates automatically)
    const result = await UserModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $addToSet: { favorites: telecallerObjectId } }
    )

    // If modifiedCount is 0, it means either:
    // 1. The telecaller was already in favorites (duplicate)
    // 2. The user doesn't exist (but we check this in service layer)
    if (result.modifiedCount === 0 && result.matchedCount > 0) {
      return { success: true, alreadyExists: true }
    }

    return { success: result.modifiedCount > 0, alreadyExists: false }
  };

  public async removeFromFavorites(userId: string, telecallerId: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { favorites: new Types.ObjectId(telecallerId) } }
    );

    return result.modifiedCount > 0
  };

  public async findApprovedTelecallers(userId: string, page: number, limit: number): Promise<{ telecallers: TelecallerResponse[], total: number }> {
    const skip = (page - 1) * limit

    const result = await UserModel.aggregate([
      {
        $match: {
          role: 'TELECALLER',
          accountStatus: 'ACTIVE',
          'telecallerProfile.approvalStatus': 'APPROVED',
          'telecallerProfile.presence': { $in: ['ONLINE', 'ON_CALL'] }
        }
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          telecallers: [
            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                let: { visitorId: new Types.ObjectId(userId), visitorTelecallerId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$_id', '$$visitorId'] },
                          { $in: ['$$visitorTelecallerId', { $ifNull: ['$favorites', []] }] }
                        ]
                      }
                    }
                  }
                ],
                as: 'favoriteCheck'
              }
            },
            {
              $project: {
                _id: { $toString: '$_id' },
                name: 1,
                profile: 1,
                language: 1,
                about: '$telecallerProfile.about',
                presence: '$telecallerProfile.presence',
                isFavorite: { $gt: [{ $size: '$favoriteCheck' }, 0] }
              }
            }
          ]
        }
      }
    ])

    const total = result[0]?.metadata[0]?.total || 0
    const telecallers = result[0]?.telecallers || []

    return { telecallers, total }
  };

};