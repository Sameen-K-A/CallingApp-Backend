import { CorsOptions } from "cors"

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_LIVE_URL as string]
      : [process.env.FRONTEND_LOCAL_URL as string]

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}