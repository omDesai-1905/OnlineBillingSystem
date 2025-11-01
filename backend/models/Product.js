import mongoose from "mongoose";

const subProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  size: {
    type: Number,
    default: 0,
  },
});

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mainProduct: {
    type: String,
    required: true,
  },
  calculationType: {
    type: String,
    enum: ["weight", "piece"],
    default: "weight",
  },
  subProducts: [subProductSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Product", productSchema);
