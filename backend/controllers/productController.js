import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
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
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProduct = async (req, res) => {
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
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
