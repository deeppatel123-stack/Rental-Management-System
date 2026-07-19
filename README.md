# Enterprise Rental ERP - Rental Management System

A synchronized, event-driven Enterprise Rental ERP application built with the MERN stack (MongoDB, Express, React, Node.js). This system manages the complete rental order lifecycle, from product browsing and booking to automated logistics, inventory tracking, deposit management, and HTML-based invoicing.

---

## 🚀 Key Features

### 1. Synchronized Event-Driven Lifecycle
All modules are fully integrated and communicate via a central event dispatcher (`eventService.js`). Changing the status of a rental order automatically triggers updates across other modules:
*   **Inventory Control:** Automatically decrements stock on pickup and restores it when the returned equipment is settled.
*   **Billing/Invoicing:** Generates invoice items during quotation, processes fees, calculates late fees, or invoices damage repair costs.
*   **Deposits & Payment Settlements:** Holds deposits at payment time, automatic calculation of refunds, and deducts penalty charges post-inspection.

### 2. High-Efficiency Logistics (One-Click Handover)
A streamlined flow for rental handlers bypassing legacy verification layers:
*   **One-Click Pickup:** Rental partners can complete handover with a single click via the "Quick Handover" feature (no strict signature/OTP blockers).
*   **One-Click Return:** Immediate return registration bypassing multi-step parameters, defaulting to e-signed authority for swift settlement.

### 3. Styled Light-Theme HTML Invoices
Invoices have been refactored from coordinate-based static PDFs to beautiful HTML templates:
*   Served dynamically at `/invoices/invoice-INV-XXXX.html`.
*   Includes digital signature representations and IP metadata stamps.
*   Built-in print system stylesheet optimized for **A4 light-theme standard printing** (via the browser print modal).

### 4. Developer Testing Utility (Quick Demo Login)
The login screen features role-based quick login helpers to easily simulate multiple perspectives:
*   **Admin Dashboard:** Oversight on total orders, users, catalog adjustments, and settings.
*   **Rental Partner / Employee:** Oversees pickups, returns, and inventory allocations.
*   **Customer Portal:** Browse products, check out orders, authorize card charges, sign waivers, and view invoice history.

---

## 🛠 Tech Stack

*   **Frontend:** React (Vite), Tailwind CSS, Lucide icons, socket.io-client.
*   **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io, JWT Authentication.
*   **Services:** Event-driven action cascade (inventory, deposits, notifications).

---

## 📁 Repository Structure

```
Rental Management System/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection and config
│   │   ├── controllers/     # API request controllers (auth, rental, pickup, return)
│   │   ├── middleware/      # JWT validation and errors handler
│   │   ├── models/          # Mongoose model schemas (RentalOrder, Invoice, Deposit, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Service logic (pdfService.js, eventService.js)
│   │   └── utils/           # Data seed scripts
│   └── public/              # Served static files (HTML invoices)
│
├── frontend/
│   └── src/
│       ├── components/      # UI components (Navbar, Sidebar, etc.)
│       ├── context/         # Auth contexts
│       ├── pages/           # Views (Login, Checkout, OrderHistory, ReturnWorkflow)
│       └── App.jsx          # Route router config
```

---

## 🏁 Getting Started

### Prerequisites
*   Node.js installed (v16+)
*   MongoDB Instance (Local server or MongoDB Atlas URL)

### 1. Backend Setup & Run
1.  Navigate into the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your `.env` configuration:
    Create a `.env` file in the `backend/` directory and configure the variables:
    ```env
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/rental-system
    JWT_SECRET=your_jwt_secret_token
    FRONTEND_URL=http://localhost:5173
    ```
4.  Seed the Database (Creates test Admin, Partner, Customer, and products):
    ```bash
    npm run seed
    ```
5.  Launch the Development Server:
    ```bash
    npm run dev
    ```
    *The API will run on http://localhost:5000*

### 2. Frontend Setup & Run
1.  Navigate into the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the Vite Dev Server:
    ```bash
    npm run dev
    ```
    *The Client will run on http://localhost:5173*

---

## 🔄 The Complete Rental Workflow
1.  **Browse & Select:** Log in as **Customer**, select items, and proceed to book.
2.  **Order Review:** Log in as **Admin** or **Partner**, go to orders dashboard, and approve the requested rental order.
3.  **Pay & Sign:** Log in as **Customer**, click **Pay & Sign**, enter mock banking details and sign with name, then click **Authorize Charge**.
4.  **Instant Handover:** Under the **Logistics** -> **Pickup Workflow** tab (Partner/Employee), click **⚡ Confirm Handover & Complete Pickup** to activate the rental.
5.  **Return & Refund:** In logistics -> **Return Workflow**, inspect the return status, input minor/major damages (if any), and click **Complete Return** to restore stock and refund deposits.
6.  **Print Record:** Visit **Order History** as customer, and tap **View Invoice** to inspect or print the white-theme document.

Developed by :-

Deep Patel
Bahumik Kothiya
