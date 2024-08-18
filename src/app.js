import express from "express";
import logger from "morgan";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import dotenv from "dotenv";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import invitationRouter from "./routes/invitationRouter.js";

// Route file import and use
import authRouter from "./routes/authRouter.js";
import usersRouter from "./routes/usersRouter.js";
import cardsRouter from "./routes/cardsRouter.js";
import columnsRouter from "./routes/columnsRouter.js";
import boardsRouter from "./routes/boardsRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Create an instance of the Express application
const app = express();

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "API documentation for TaskPro App",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4500}`,
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(logger("dev")); // For logging requests

app.use(cors()); // For enabling CORS

// const corsOptions = {
//   origin: "https://numele-frontendului-tau.onrender.com",
//   optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));

app.use(express.json()); // For parsing JSON request bodies
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Swagger docs

app.use("/api/auth", authRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/user", usersRouter);
app.use("/api/boards", boardsRouter);
app.use("/api/boards/:boardId/columns", columnsRouter); // Nested columns routes
app.use("/api/boards/:boardId/columns/:columnId/cards", cardsRouter); // Nested cards routes under columns
app.use("/api/invitations", invitationRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler middleware should be the last middleware
app.use(errorHandler);

export default app;
