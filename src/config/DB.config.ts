import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      console.error('❌ FATAL ERROR: MONGO_URI is not defined in the .env file.')
      process.exit(1)
    }

    await mongoose.connect(mongoUri)
    console.log('📦 Database connected successfully.')

    mongoose.connection.on('error', (err) => {
      console.error('❌ Database connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Database disconnected. Attempting to reconnect...')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ Database reconnected.')
    })
  } catch (err) {
    console.error('❌ Failed to connect to Database:', err)
    process.exit(1)
  }
}

export default connectDB;