import React, { useState, useEffect } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../utils/api";
import "./Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to fetch customers");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Customer name is required");
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, formData);
      } else {
        await createCustomer(formData);
      }
      fetchCustomers();
      resetForm();
    } catch (error) {
      console.error("Error saving customer:", error);
      setError("Failed to save customer");
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile || "",
      address: customer.address || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        setError("Failed to delete customer");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      mobile: "",
      address: "",
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>Customers Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Add Customer"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="customer-form-container">
          <h2>{editingCustomer ? "Edit Customer" : "Add New Customer"}</h2>
          <form onSubmit={handleSubmit} className="customer-form">
            <div className="form-group">
              <label>Customer Name: *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile No. (Optional):</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setFormData({ ...formData, mobile: value });
                  }
                }}
                placeholder="Enter 10 digit mobile number"
                maxLength="10"
              />
            </div>

            <div className="form-group">
              <label>Address (Optional):</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter customer address"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingCustomer ? "Update Customer" : "Add Customer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="customers-list">
        <h2>All Customers ({customers.length})</h2>
        {customers.length === 0 ? (
          <p className="no-data">
            No customers found. Add your first customer!
          </p>
        ) : (
          <div className="customers-table">
            <table>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Mobile No.</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.mobile || "-"}</td>
                    <td>{customer.address || "-"}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
