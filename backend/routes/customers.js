import express from "express";
import Customer from "../models/Customer.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user.id }).sort({
      name: 1,
    });
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const customers = await Customer.find({
      user: req.user.id,
      name: { $regex: query, $options: "i" },
    })
      .limit(10)
      .sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { name, mobile, address } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const customer = new Customer({
      name,
      mobile: mobile || "",
      address: address || "",
      user: req.user.id,
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { name, mobile, address } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.name = name;
    customer.mobile = mobile || "";
    customer.address = address || "";

    await customer.save();
    res.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
