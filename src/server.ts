import dotenv from 'dotenv'
dotenv.config();

import http from "http"
import app from './app'
import connectDB from './config/DB.config'
import { initializeSocketIO, setIOInstance } from './socket';
import { resetAllTelecallerPresence } from './socket/services/presence.service';
import { cleanupStaleRingingCalls } from './socket/services/call.service';
import { testRedisConnection } from './config/redis.config';

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

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

startServer();