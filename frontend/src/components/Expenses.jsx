import React, { useState, useEffect } from "react";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
} from "../utils/api";
import "./Expenses.css";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    expensesByType: {},
    totalCount: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    expenseType: "All",
  });
  const [formData, setFormData] = useState({
    expenseType: "Loading",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    paymentMethod: "Cash",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const expenseTypes = [
    "Loading",
    "Transport",
    "Packaging",
    "Labor",
    "Utilities",
    "Rent",
    "Marketing",
    "Maintenance",
    "Other",
  ];
  const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Other"];

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      const response = await getExpenses(filters);
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError("Failed to fetch expenses");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getExpenseStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingExpense) {
        await updateExpense(editingExpense._id, expenseData);
        setSuccess("Expense updated successfully!");
      } else {
        await createExpense(expenseData);
        setSuccess("Expense added successfully!");
      }

      fetchExpenses();
      fetchStats();
      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving expense:", error);
      setError("Failed to save expense");
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseType: expense.expenseType,
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split("T")[0],
      notes: expense.notes || "",
      paymentMethod: expense.paymentMethod,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(id);
        fetchExpenses();
        fetchStats();
        setSuccess("Expense deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deleting expense:", error);
        setError("Failed to delete expense");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      expenseType: "Loading",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      paymentMethod: "Cash",
    });
    setEditingExpense(null);
    setShowForm(false);
  };

  const getBadgeClass = (type) => {
    return `expense-type-badge badge-${type.toLowerCase()}`;
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <div className="expenses-container">
      <div className="expenses-header">
        <h1>💰 Extra Expenses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? "Cancel" : "+ Add New Expense"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Statistics Cards */}
      <div className="expenses-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">₹{stats.totalExpenses.toFixed(2)}</div>
          <div className="stat-label">Total Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.totalCount}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">
            ₹
            {stats.totalCount > 0
              ? (stats.totalExpenses / stats.totalCount).toFixed(2)
              : "0.00"}
          </div>
          <div className="stat-label">Average Expense</div>
        </div>
      </div>

      {/* Add/Edit Expense Form */}
      {showForm && (
        <div className="expense-form-container">
          <h2>{editingExpense ? "Edit Expense" : "Add New Expense"}</h2>
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-group">
              <label>Expense Type *</label>
              <select
                name="expenseType"
                value={formData.expenseType}
                onChange={handleFormChange}
                required
              >
                {expenseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                placeholder="Enter amount"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleFormChange}
                required
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Description *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Enter description"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional notes..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingExpense ? "Update Expense" : "Add Expense"}
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

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-row">
          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Expense Type</label>
            <select
              name="expenseType"
              value={filters.expenseType}
              onChange={handleFilterChange}
            >
              <option value="All">All Types</option>
              {expenseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() =>
              setFilters({ startDate: "", endDate: "", expenseType: "All" })
            }
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table-container">
        {expenses.length === 0 ? (
          <div className="no-expenses">
            <p>
              No expenses recorded yet. Click "Add New Expense" to get started!
            </p>
          </div>
        ) : (
          <>
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>
                      <span className={getBadgeClass(expense.expenseType)}>
                        {expense.expenseType}
                      </span>
                    </td>
                    <td>
                      <strong>{expense.description}</strong>
                      {expense.notes && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#999",
                            marginTop: "4px",
                          }}
                        >
                          {expense.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="payment-method">
                        {expense.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="expense-amount">
                        ₹{expense.amount.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <div className="expense-actions">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="btn-icon btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id)}
                          className="btn-icon btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="4" style={{ textAlign: "right" }}>
                    <strong>Total:</strong>
                  </td>
                  <td colSpan="2">
                    <strong>₹{calculateTotal().toFixed(2)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default Expenses;
