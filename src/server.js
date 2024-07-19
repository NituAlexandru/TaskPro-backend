import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", routes);

mongoose
  .connect(process.env.DB_URI)
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((error) => console.log(error.message));
