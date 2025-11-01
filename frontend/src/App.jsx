import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar.jsx";
import Login from "./components/Login.jsx";
import Signup from "./components/Signup.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Products from "./components/Products.jsx";
import Customers from "./components/Customers.jsx";
import MakeBill from "./components/MakeBill.jsx";
import MakeBillNew from "./components/MakeBillNew.jsx";
import BillsList from "./components/BillsList.jsx";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}

        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Signup onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard user={user} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/products"
            element={isAuthenticated ? <Products /> : <Navigate to="/login" />}
          />
          <Route
            path="/customers"
            element={isAuthenticated ? <Customers /> : <Navigate to="/login" />}
          />
          <Route
            path="/make-bill"
            element={
              isAuthenticated ? (
                <MakeBillNew user={user} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/make-bill-old"
            element={
              isAuthenticated ? (
                <MakeBill user={user} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/bills"
            element={isAuthenticated ? <BillsList /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
