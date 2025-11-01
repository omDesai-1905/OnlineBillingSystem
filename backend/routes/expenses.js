import express from "express";
import Expense from "../models/Expense.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { expenseType, description, amount, date, notes, paymentMethod } =
      req.body;

    const expense = new Expense({
      userId: req.user.id,
      expenseType,
      description,
      amount,
      date,
      notes,
      paymentMethod,
    });

    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses for a user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate, expenseType } = req.query;

    let query = { userId: req.user.id };

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Filter by expense type
    if (expenseType && expenseType !== "All") {
      query.expenseType = expenseType;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/expenses/stats
// @desc    Get expense statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const expensesByType = expenses.reduce((acc, expense) => {
      acc[expense.expenseType] =
        (acc[expense.expenseType] || 0) + expense.amount;
      return acc;
    }, {});

    res.json({
      totalExpenses,
      expensesByType,
      totalCount: expenses.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if expense belongs to user
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { expenseType, description, amount, date, notes, paymentMethod } =
      req.body;

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if expense belongs to user
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    expense.expenseType = expenseType;
    expense.description = description;
    expense.amount = amount;
    expense.date = date;
    expense.notes = notes;
    expense.paymentMethod = paymentMethod;

    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if expense belongs to user
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
