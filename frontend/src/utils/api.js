import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const signup = (data) => api.post("/auth/signup", data);
export const login = (data) => api.post("/auth/login", data);
export const getCurrentUser = () => api.get("/auth/me");

// Products API
export const getProducts = () => api.get("/products");
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Business API
export const updateBusinessInfo = (data) => api.put("/business/info", data);

// Bills API
export const getBills = () => api.get("/bills");
export const createBill = (data) => api.post("/bills", data);
export const getBillById = (id) => api.get(`/bills/${id}`);
export const updateBill = (id, data) => api.put(`/bills/${id}`, data);
export const deleteBill = (id) => api.delete(`/bills/${id}`);

// Customers API
export const getCustomers = () => api.get("/customers");
export const searchCustomers = (query) =>
  api.get(`/customers/search?query=${query}`);
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Expenses API
export const getExpenses = (params) => api.get("/expenses", { params });
export const createExpense = (data) => api.post("/expenses", data);
export const getExpenseById = (id) => api.get(`/expenses/${id}`);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const getExpenseStats = () => api.get("/expenses/stats");

export default api;
