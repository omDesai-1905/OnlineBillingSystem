import express from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.put("/info", auth, async (req, res) => {
  try {
    const { businessName } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (businessName) user.businessName = businessName;

    await user.save();

    res.json({
      businessName: user.businessName,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
