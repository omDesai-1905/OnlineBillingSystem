import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  pic: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  itemCount: {
    type: Number,
    default: 1,
  },
  calculationType: {
    type: String,
    enum: ["weight", "piece"],
    default: "weight",
  },
  size: {
    type: Number,
    default: 0, // Total size for piece-based calculations
  },
});

const billSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  billNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    default: "",
  },
  customerMobile: {
    type: String,
    default: "",
  },
  shipToAddress: {
    type: String,
    default: "",
  },
  picture: {
    type: String,
    default: "",
  },
  items: [billItemSchema],
  loadingCharge: {
    type: Number,
    default: 0,
  },
  transportCharge: {
    type: Number,
    default: 0,
  },
  roundOff: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Bill", billSchema);
