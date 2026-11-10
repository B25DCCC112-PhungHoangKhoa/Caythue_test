import mongoose from 'mongoose';

export class Database {
  public static async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esports_rank_db';
      const conn = await mongoose.connect(mongoUri);
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`[Database Error] Connection failed: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  public static async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}

export default Database;
