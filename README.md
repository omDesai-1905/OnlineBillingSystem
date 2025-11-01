# Online Billing System

A comprehensive web-based billing system built with React (Vite) frontend and Node.js/Express backend with MongoDB database.

## Features

### 🔐 Authentication & User Management

- User registration with business details (business name, email, password)
- Secure login with JWT token authentication
- Persistent login sessions
- User profile management
- Business logo/emoji customization

### 📦 Product Management

- **Main Products**: Create products with main categories
- **Sub-Products**: Add multiple sub-products under each main product
- **Dual Calculation Types**:
  - **Piece-Based**: Calculate by pieces × size (feet)
  - **Weight-Based**: Calculate by weight (KG)
- Product filtering by calculation type
- Edit and update existing products
- Delete products
- View all products in organized list

### 🧾 Advanced Bill Creation (5-Step Workflow)

- **Step 1**: Select calculation type (Piece/Weight)
- **Step 2**: Choose main product (auto-filtered by type)
- **Step 3**: Select multiple sub-products (3-column grid layout)
- **Step 4**: Choose quantity mode (Main Product or Individual)
- **Step 5**: Enter quantities and prices

#### Bill Features:

- **Customer Information** (all optional):
  - Customer name with autocomplete suggestions
  - 10-digit mobile number validation
  - Customer address
- **Product Entry**:
  - Manual sub-product addition
  - PIC (Pieces/Items Count) field
  - Quantity input with automatic calculations
  - Individual price entry per sub-product
  - Quick Fill: Apply same price to all sub-products
- **Calculations**:
  - Automatic subtotal calculation
  - Loading charges (custom amount)
  - Transport charges (custom amount)
  - Manual/Auto round-off toggle
  - Grand total with amount in words (Indian format)
- **Professional Cash Memo Format**:
  - Business name and contact info in header
  - Auto-generated bill number with timestamp
  - Date display
  - Product name with sub-products shown as bullet points
  - Tabular format: NAME, PIC, QUANTITY, PRICE, TOTAL
  - Customer information display (when saved)

### 📊 Bills Management

- View all created bills in card layout
- Bill cards show:
  - Customer name/address/mobile
  - Bill number
  - Creation date
  - Number of items
  - Total amount
- **View Bill**: Detailed bill preview
- **Edit Bill**: Modify all bill details including:
  - Customer information
  - Product quantities and prices
  - Loading and transport charges
- **Delete Bill**: Remove bills with confirmation
- **Export as Image**: Download bill as JPEG
- **Print Bill**: Print-optimized layout
- Bill search and filter capabilities

### 👥 Customer Management

- Add new customers with details:
  - Customer name
  - Mobile number
  - Address
- View all customers
- Edit customer information
- Delete customers
- Customer search and autocomplete in bill creation
- Quick customer selection from dropdown

### 📈 Dashboard

- Business statistics overview:
  - Total number of products
  - Total bills created
  - Total revenue generated
- Business information management
- Business logo/emoji editor
- Quick action cards:
  - Create new bill
  - View bills history
  - Manage products
  - Manage customers

### 💰 Expense Tracking

- Add expenses with:
  - Expense name
  - Amount
  - Category
  - Date
  - Notes
- View expense history
- Edit and delete expenses
- Expense statistics and reports
- Filter expenses by date range
- Category-wise expense tracking

### 🎨 UI/UX Features

- Responsive design for all screen sizes
- Clean and modern interface
- Intuitive navigation with navbar
- No-print CSS class for clean exports/prints
- Success/error notifications
- Loading states
- Form validation
- Popup-based workflows
- 3-column grid layouts for better visibility
- Color-coded sections for easy identification

### 📤 Export & Print

- **Export as Image**: Save bills as JPEG images
- **Print Bills**: Browser print with optimized layout
- Professional cash memo format
- Customer information included in exports (when bill is saved)
- Sub-products displayed with bullet points
- Clean, print-ready design without UI elements

## Tech Stack

### Frontend

- React 18
- React Router DOM v6
- Axios for API calls
- Vite for build tool
- CSS3 for styling

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled

## Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- MongoDB installed and running locally
- npm or yarn package manager

## Installation & Setup

### 1. Clone the repository

```bash
cd e:\programer\projects\OnlineBillingSystem
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Make sure MongoDB is running on your system. The default connection is:

```
mongodb://localhost:27017/onlinebilling
```

Start the backend server:

```bash
npm run dev
# or
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (.env file is already created)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/onlinebilling
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

**Important:** Change the `JWT_SECRET` in production!

## Usage Guide

### 1. Create an Account

- Navigate to `http://localhost:3000`
- Click "Sign Up"
- Enter your details:
  - Full Name
  - Email
  - Business Name
  - Password
- Click "Sign Up"

### 2. Add Products

- After login, go to "Products" from the navigation
- Click "+ Add New Product"
- Enter main product name (e.g., "Waffers")
- Add sub-products:
  - Name (e.g., "Masala Waffers")
  - Price (e.g., 20)
- Add more sub-products using "+ Add Sub Product"
- Click "Add Product"

### 3. Create a Bill

- Go to "Make Bill" from navigation
- (Optional) Add business logo URL or emoji
- Enter customer details:
  - Customer Name (optional)
  - Mobile Number
  - Shipping Address (optional)
- Add items to bill:
  - Start typing product name to see suggestions
  - Select from suggestions or enter manually
  - Enter item count (optional)
  - Enter quantity
  - Price will auto-fill if selected from suggestions
  - Click "Add" button
- Repeat for all items
- Review the bill preview
- Click "Generate Bill"

### 4. View Bills History

- Go to "Bills History" from navigation
- View all created bills
- Click "View Details" to see full bill
- Print bills using the print button
- Delete bills if needed

## Project Structure

```
OnlineBillingSystem/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── models/
│   │   ├── Bill.js          # Bill schema
│   │   ├── Product.js       # Product schema
│   │   └── User.js          # User schema
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── bills.js         # Bill management routes
│   │   ├── business.js      # Business info routes
│   │   └── products.js      # Product management routes
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── server.js            # Express server
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Auth.css
    │   │   ├── BillsList.css
    │   │   ├── BillsList.js
    │   │   ├── Dashboard.css
    │   │   ├── Dashboard.js
    │   │   ├── Login.js
    │   │   ├── MakeBill.css
    │   │   ├── MakeBill.js
    │   │   ├── Navbar.css
    │   │   ├── Navbar.js
    │   │   ├── Products.css
    │   │   ├── Products.js
    │   │   └── Signup.js
    │   ├── utils/
    │   │   └── api.js        # API service
    │   ├── App.css
    │   ├── App.js            # Main app component
    │   ├── index.css
    │   └── index.js          # Entry point
    ├── package.json
    └── vite.config.js
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Products

- `GET /api/products` - Get all products (protected)
- `POST /api/products` - Create product (protected)
- `PUT /api/products/:id` - Update product (protected)
- `DELETE /api/products/:id` - Delete product (protected)

### Business

- `PUT /api/business/info` - Update business info (protected)
- `PUT /api/business/logo` - Update business logo (protected)

### Bills

- `GET /api/bills` - Get all bills (protected)
- `POST /api/bills` - Create bill (protected)
- `GET /api/bills/:id` - Get bill by ID (protected)
- `DELETE /api/bills/:id` - Delete bill (protected)

## Features Implemented

✅ User authentication (signup/login)
✅ Product management with main and sub-products
✅ Bill creation with auto-suggestions
✅ Professional bill design
✅ Customer information (optional fields)
✅ Automatic total calculation
✅ Bills history
✅ Print functionality
✅ Responsive design
✅ Business logo management

## Screenshots

### Login/Signup Pages

Beautiful gradient-based authentication pages with form validation.

### Dashboard

Overview of business statistics with quick access to all features.

### Products Management

Easy-to-use interface for managing main products and sub-products.

### Make Bill

Professional bill creation with:

- Business logo and name at top
- Customer information section
- Product auto-suggestions
- Real-time total calculation
- Clean, print-ready design

### Bills History

Grid view of all bills with options to view details, print, or delete.

## Troubleshooting

### MongoDB Connection Error

- Make sure MongoDB is running: `mongod`
- Check if the connection string in `.env` is correct

### Port Already in Use

- Backend: Change `PORT` in `.env` file
- Frontend: Change port in `vite.config.js`

### CORS Issues

- Make sure backend is running
- Check if API_URL in `frontend/src/utils/api.js` is correct

## Future Enhancements

- PDF export functionality
- Email bill to customers
- Invoice templates
- Payment tracking
- Multi-currency support
- Tax calculations (GST/VAT)
- Reports and analytics
- Customer database
- Inventory management

## License

MIT License

## Support

For issues or questions, please create an issue in the repository.

---

Made with ❤️ for small businesses
