import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">📊 Online Billing System</div>

        <ul className="navbar-menu">
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/products">Products</Link>
          </li>
          <li>
            <Link to="/customers">Customers</Link>
          </li>
          <li>
            <Link to="/make-bill">Make Bill</Link>
          </li>
          <li>
            <Link to="/bills">Bills History</Link>
          </li>
        </ul>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="business-name">{user?.businessName}</div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
