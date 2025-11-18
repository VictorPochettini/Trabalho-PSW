import mongoose from "mongoose";

const SeguidorSchema = new mongoose.Schema({
  followerId: String,   // quem segue
  followingId: String,  // quem é seguido
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Seguidor", SeguidorSchema);
