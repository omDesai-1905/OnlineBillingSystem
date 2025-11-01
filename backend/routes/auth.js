import express from "express";
import auth from "../middleware/auth.js";
import {
  signup,
  login,
  getCurrentUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", auth, getCurrentUser);

export default router;
