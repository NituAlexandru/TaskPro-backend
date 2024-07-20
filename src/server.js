import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 4500;
const DB_URI = process.env.DB_URI;

if (!DB_URI) {
  console.error('Error: DB_URI is not defined in the environment variables');
  process.exit(1); // Exit the application with an error code
}

mongoose
  .connect(DB_URI)
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((error) => console.log(error.message));

