import mongoose from "mongoose";
import { handleSaveError } from "../hooks/handleSaveErrors.js";

// Define the session schema
const sessionSchema = new mongoose.Schema(
  {
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { 
    versionKey: false, // Disable the __v version key
    timestamps: true,  // Automatically add createdAt and updatedAt fields
  }
);

// Post-save hook to handle errors
sessionSchema.post("save", handleSaveError);

// Create the session model
const Session = mongoose.model("Session", sessionSchema);

export default Session;
