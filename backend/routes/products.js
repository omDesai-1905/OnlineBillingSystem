import express from "express";
import Product from "../models/Product.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/products
// @desc    Add a new product with sub-products
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { mainProduct, calculationType, subProducts } = req.body;

    const product = new Product({
      userId: req.user.id,
      mainProduct,
      calculationType: calculationType || "weight",
      subProducts,
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/products
// @desc    Get all products for a user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { mainProduct, calculationType, subProducts } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product belongs to user
    if (product.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    product.mainProduct = mainProduct;
    product.calculationType = calculationType || "weight";
    product.subProducts = subProducts;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product belongs to user
    if (product.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
