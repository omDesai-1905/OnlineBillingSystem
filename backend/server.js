import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import businessRoutes from "./routes/business.js";
import billsRoutes from "./routes/bills.js";
import customersRoutes from "./routes/customers.js";
import expensesRoutes from "./routes/expenses.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/expenses", expensesRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Online Billing System API" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
