import connectDB from "../src/config/database";
import app from "../src/app";

// Cache the DB connection across serverless invocations (warm starts)
let isConnected = false;

const handler = async (req: any, res: any) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};

export default handler;
