import express from "express";
import auth from "../middleware/auth.js";
import {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
} from "../controllers/billController.js";

const router = express.Router();

router.post("/", auth, createBill);
router.get("/", auth, getBills);
router.get("/:id", auth, getBillById);
router.put("/:id", auth, updateBill);
router.delete("/:id", auth, deleteBill);

export default router;
