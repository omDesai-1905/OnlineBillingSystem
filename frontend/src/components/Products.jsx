import React, { useState, useEffect } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../utils/api";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    mainProduct: "",
    calculationType: "weight",
    subProducts: [{ name: "", price: "", size: "" }],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products");
    }
  };

  const handleAddSubProduct = () => {
    setFormData({
      ...formData,
      subProducts: [
        ...formData.subProducts,
        { name: "", price: "", size: "" },
      ],
    });
  };

  const handleRemoveSubProduct = (index) => {
    const newSubProducts = formData.subProducts.filter((_, i) => i !== index);
    setFormData({ ...formData, subProducts: newSubProducts });
  };

  const handleSubProductChange = (index, field, value) => {
    const newSubProducts = [...formData.subProducts];
    newSubProducts[index][field] = value;
    setFormData({ ...formData, subProducts: newSubProducts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const validSubProducts = formData.subProducts.filter(
        (sp) => sp.name.trim() !== ""
      );

      const productData = {
        mainProduct: formData.mainProduct,
        calculationType: formData.calculationType,
        subProducts: validSubProducts.map((sp) => ({
          name: sp.name,
          price: sp.price ? parseFloat(sp.price) : 0,
          size: sp.size ? parseFloat(sp.size) : 0,
        })),
      };

      let response;
      if (editingProduct) {
        response = await updateProduct(editingProduct._id, productData);
      } else {
        response = await createProduct(productData);
      }

      fetchProducts();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      setError("Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      mainProduct: product.mainProduct,
      calculationType: product.calculationType || "weight",
      subProducts:
        product.subProducts.length > 0
          ? product.subProducts.map((sp) => ({
              name: sp.name,
              price: sp.price,
              size: sp.size || "",
            }))
          : [{ name: "", price: "", size: "" }],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        setError("Failed to delete product");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      mainProduct: "",
      calculationType: "weight",
      subProducts: [{ name: "", price: "", size: "" }],
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Products Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? "Cancel" : "+ Add New Product"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="product-form-container">
          <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Main Product Name *</label>
              <input
                type="text"
                value={formData.mainProduct}
                onChange={(e) =>
                  setFormData({ ...formData, mainProduct: e.target.value })
                }
                placeholder="e.g., Waffers"
                required
              />
            </div>

            <div className="form-group">
              <label>Calculation Type *</label>
              <select
                value={formData.calculationType}
                onChange={(e) =>
                  setFormData({ ...formData, calculationType: e.target.value })
                }
                required
              >
                <option value="weight">Weight Based (Quantity × Price)</option>
                <option value="piece">Piece Based (Pic × Size × Price)</option>
              </select>
              <small
                style={{
                  color: "#666",
                  fontSize: "12px",
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {formData.calculationType === "weight"
                  ? "Example: GP Pipe - 450kg × ₹80 = ₹36,000"
                  : "Example: Roof Sheet - (10 × 8ft + 10 × 12ft) × ₹130 = ₹26,000"}
              </small>
            </div>

            <div className="sub-products-section">
              <h3>Sub Products</h3>
              {formData.subProducts.map((subProduct, index) => (
                <div key={index} className="sub-product-row">
                  <input
                    type="text"
                    value={subProduct.name}
                    onChange={(e) =>
                      handleSubProductChange(index, "name", e.target.value)
                    }
                    placeholder={
                      formData.calculationType === "piece"
                        ? "e.g., 8 feet"
                        : "e.g., Masala Waffers"
                    }
                    required
                  />
                  {formData.calculationType === "piece" && (
                    <input
                      type="number"
                      value={subProduct.size}
                      onChange={(e) =>
                        handleSubProductChange(index, "size", e.target.value)
                      }
                      placeholder="Size (e.g., 8, 10, 12)"
                      step="any"
                      min="0"
                      style={{ width: "150px" }}
                    />
                  )}
                  <input
                    type="number"
                    value={subProduct.price}
                    onChange={(e) =>
                      handleSubProductChange(index, "price", e.target.value)
                    }
                    placeholder="Price (Optional)"
                    step="any"
                    min="0"
                  />
                  {formData.subProducts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubProduct(index)}
                      className="btn btn-danger btn-small"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSubProduct}
                className="btn btn-secondary"
              >
                + Add Sub Product
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="products-list">
        {products.length === 0 ? (
          <div className="no-products">
            <p>
              No products added yet. Click "Add New Product" to get started!
            </p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product._id} className="product-card">
              {/* Calculation Type Badge */}
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  backgroundColor:
                    product.calculationType === "piece" ? "#fff3cd" : "#d1ecf1",
                  color:
                    product.calculationType === "piece" ? "#856404" : "#0c5460",
                  border:
                    product.calculationType === "piece"
                      ? "1px solid #ffc107"
                      : "1px solid #17a2b8",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginBottom: "10px",
                }}
              >
                {product.calculationType === "piece"
                  ? "📏 Piece Based"
                  : "⚖️ Weight Based"}
              </div>

              <div className="product-header">
                <h3>{product.mainProduct}</h3>
                <div className="product-actions">
                  <button
                    onClick={() => handleEdit(product)}
                    className="btn btn-primary btn-small"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="sub-products-list">
                <h4>Sub Products:</h4>
                {product.subProducts.length > 0 ? (
                  <ul>
                    {product.subProducts.map((subProduct) => (
                      <li key={subProduct._id}>
                        <span>
                          {subProduct.name} - ₹{subProduct.price.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No sub-products</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Products;
