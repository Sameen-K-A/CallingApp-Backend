import dotenv from 'dotenv'
dotenv.config();

import http from "http"
import mongoose from 'mongoose';
import app from './app'
import connectDB from './config/DB.config'
import { testRedisConnection, closeRedisConnection } from './config/redis.config';
import { initializeSocketIO, setIOInstance, cleanupSocketIO } from './socket';
import { resetAllTelecallerPresence } from './socket/services/presence.service';
import { cleanupStaleRingingCalls } from './socket/services/call.service';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const isRedisConnected = await testRedisConnection();
    if (!isRedisConnected) {
      console.error('❌ Failed to connect to Redis. Exiting...');
      process.exit(1);
    };

    await resetAllTelecallerPresence();
    await cleanupStaleRingingCalls();

    const PORT = process.env.PORT || 8000

    const httpServer = http.createServer(app);
    const io = initializeSocketIO(httpServer);
    setIOInstance(io);

    const server = httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

      server.close((err) => {
        if (err) {
          console.error('❌ Error closing HTTP server:', err);
          process.exit(1);
        }
        console.log('🔌 HTTP server closed.');
      });

      cleanupSocketIO();
      console.log('🔌 Socket.IO closed.');

      try {
        await closeRedisConnection();

        await mongoose.connection.close(false);
        console.log('🔌 MongoDB connection closed.');

        console.log('✅ Graceful shutdown complete.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

startServer();