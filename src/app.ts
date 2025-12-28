import express, { Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import { errorHandler } from './middleware/error.handler'
import { corsOptions } from './config/cors.config'
import { adminRouter } from './api/admin/admin.routes'
import { authRouter } from './api/auth/auth.routes'
import { userRouter } from './api/users/user.routes'
import { telecallerRouter } from './api/telecaller/telecaller.routes'
import { paymentRouter } from './api/payment/payment.routes'
import { testRedisConnection } from './config/redis.config'
import mongoose from 'mongoose'

const app: Application = express();

// Security headers
app.use(helmet());

// NoSQL injection prevention
app.use(mongoSanitize())
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// API routes
app.use('/auth', authRouter)
app.use('/admin', adminRouter);
app.use('/users', userRouter)
app.use('/telecaller', telecallerRouter);
app.use('/payment', paymentRouter);

app.get('/health', async (req, res) => {
  const redisOk = await testRedisConnection();
  const mongoOk = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'UP',
    redis: redisOk ? 'connected' : 'disconnected',
    mongo: mongoOk ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

app.use(errorHandler)

export default app;