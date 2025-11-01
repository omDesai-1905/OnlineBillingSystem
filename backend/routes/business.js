import express from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// @route   PUT /api/business/logo
// @desc    Update business logo
// @access  Private
router.put("/logo", auth, async (req, res) => {
  try {
    const { businessLogo } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.businessLogo = businessLogo;
    await user.save();

    res.json({ businessLogo: user.businessLogo });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/business/info
// @desc    Update business information
// @access  Private
router.put("/info", auth, async (req, res) => {
  try {
    const { businessName, businessLogo } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (businessName) user.businessName = businessName;
    if (businessLogo !== undefined) user.businessLogo = businessLogo;

    await user.save();

    res.json({
      businessName: user.businessName,
      businessLogo: user.businessLogo,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
