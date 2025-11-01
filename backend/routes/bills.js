import express from "express";
import Bill from "../models/Bill.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/bills
// @desc    Create a new bill
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      shipToAddress,
      picture,
      items,
      totalAmount,
      loadingCharge,
      transportCharge,
      roundOff,
    } = req.body;

    // Generate bill number
    const billCount = await Bill.countDocuments({ userId: req.user.id });
    const billNumber = `BILL-${Date.now()}-${billCount + 1}`;

    const bill = new Bill({
      userId: req.user.id,
      billNumber,
      customerName,
      customerMobile,
      shipToAddress,
      picture: picture || "",
      items,
      loadingCharge: loadingCharge || 0,
      transportCharge: transportCharge || 0,
      roundOff: roundOff || 0,
      totalAmount,
    });

    await bill.save();
    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/bills
// @desc    Get all bills for a user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(bills);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/bills/:id
// @desc    Get bill by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check if bill belongs to user
    if (bill.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bills/:id
// @desc    Update a bill
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      shipToAddress,
      picture,
      items,
      totalAmount,
      loadingCharge,
      transportCharge,
      roundOff,
    } = req.body;

    let bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check if bill belongs to user
    if (bill.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    bill.customerName = customerName;
    bill.customerMobile = customerMobile;
    bill.shipToAddress = shipToAddress;
    bill.picture = picture || "";
    bill.items = items;
    bill.loadingCharge = loadingCharge || 0;
    bill.transportCharge = transportCharge || 0;
    bill.roundOff = roundOff || 0;
    bill.totalAmount = totalAmount;

    await bill.save();
    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/bills/:id
// @desc    Delete a bill
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check if bill belongs to user
    if (bill.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
