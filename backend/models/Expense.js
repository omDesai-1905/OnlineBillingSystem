import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expenseType: {
    type: String,
    required: true,
    enum: [
      "Loading",
      "Transport",
      "Packaging",
      "Labor",
      "Utilities",
      "Rent",
      "Marketing",
      "Maintenance",
      "Other",
    ],
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: "",
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "UPI", "Bank Transfer", "Other"],
    default: "Cash",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Expense", expenseSchema);
