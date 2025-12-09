import { NextFunction, Request, Response } from 'express'
import { IAuthService } from './auth.types'

export class AuthController {
  constructor(private authService: IAuthService) { }

  public generateOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body
      await this.authService.generateOtp(phone)
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully.'
      })
    } catch (error) {
      next(error)
    }
  }

  public resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body
      await this.authService.resendOtp(phone)
      res.status(200).json({
        success: true,
        message: 'OTP resent successfully.'
      })
    } catch (error) {
      next(error)
    }
  }

  public verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, otp } = req.body
      const result = await this.authService.verifyOtp(phone, otp)

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully.',
        token: result.token,
        user: result.user
      })
    } catch (error) {
      next(error)
    }
  }
}