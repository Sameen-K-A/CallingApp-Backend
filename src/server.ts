import dotenv from 'dotenv'
dotenv.config();

import http from "http"
import app from './app'
import connectDB from './config/DB.config'
import { initializeSocketIO, setIOInstance } from './socket';

const startServer = async (): Promise<void> => {
  await connectDB()
  const PORT = process.env.PORT || 8000

  const httpServer = http.createServer(app);
  const io = initializeSocketIO(httpServer);
  setIOInstance(io);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`)
  })
}

startServer();