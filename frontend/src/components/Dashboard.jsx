import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, getBills, updateBusinessInfo } from "../utils/api";
import "./Dashboard.css";

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBills: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, billsRes] = await Promise.all([
        getProducts(),
        getBills(),
      ]);

      const totalRevenue = billsRes.data.reduce(
        (sum, bill) => sum + bill.totalAmount,
        0
      );

      setStats({
        totalProducts: productsRes.data.length,
        totalBills: billsRes.data.length,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}! 👋</h1>
        <p>Manage your {user?.businessName} business efficiently</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-label">Total Products</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-value">{stats.totalBills}</div>
          <div className="stat-label">Total Bills</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">₹{stats.totalRevenue.toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/products" className="action-card">
          <div className="action-icon">📦</div>
          <h3>Manage Products</h3>
          <p>
            Add, edit, or remove products and their sub-products from your
            inventory
          </p>
        </Link>

        <Link to="/make-bill" className="action-card">
          <div className="action-icon">🧾</div>
          <h3>Create New Bill</h3>
          <p>
            Generate professional bills for your customers with automatic
            calculations
          </p>
        </Link>

        <Link to="/bills" className="action-card">
          <div className="action-icon">📊</div>
          <h3>View Bills History</h3>
          <p>Access and manage all your previous billing records</p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
