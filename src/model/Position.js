import mongoose from "mongoose";

const PositionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

const Position = mongoose.models.Position || mongoose.model("Position", PositionSchema);
export default Position;