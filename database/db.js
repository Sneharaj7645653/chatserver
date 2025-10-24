import mongoose from "mongoose";

// Database connection helper
// - Uses `process.env.Db_url` as the MongoDB connection string.
// - Sets a specific `dbName` so the application targets the Chatbot database.
// - Exports an async `connectDb` function which can be awaited during
//   application startup. Errors are logged to the console by design.
const connectDb = async () => {
  try {
    // Connect to MongoDB using connection string from environment variables.
    // `dbName` ensures the desired database is used when the server connects.
    await mongoose.connect(process.env.Db_url, {
      dbName: "ChatbotYoutube",
    });

    // Informational log on successful connection. In production you may
    // want to use a logger (winston/pino) instead of console.log.
    console.log("Mongo db connected");
  } catch (error) {
    // Log the error; connection failures should be visible to the operator.
    // Optionally you could rethrow or exit the process depending on startup strategy.
    console.log(error);
  }
};

export default connectDb;