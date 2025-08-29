# 🏠 Flat Management System

This project is a full-stack application developed for the CSE311 (Database Management System) course at North South University. The system is designed to streamline the process of flat rental for tenants and owners, providing a comprehensive platform for listings, bookings, and user interaction.

## ✨ Features

* **User Authentication**: Secure user registration, login, and password reset functionality with email verification using JWT (JSON Web Tokens).
* **Role-Based Access**: The system supports two primary user roles, `tenant` and `owner`, with different access permissions.
* **Flat Management**: Owners can create, update, and delete flat listings, including details like address, rental cost, amenities, and multiple images.
* **Search and Filter**: Users can browse all available flats with advanced filtering options by district, rent range, and amenities. ((Under development))
* **Booking System**: Tenants can request bookings for available flats, which owners can then approve or disapprove.
* **Reviews & Ratings**: Both tenants and owners can review each other based on different criteria after a booking is completed. (Under development)

---

## 🛠️ Technologies Used

### Frontend
* **React**: A JavaScript library for building user interfaces.
* **Vite**: A fast build tool that significantly improves the frontend development experience.
* **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
* **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
* **Shadcn/UI**: A collection of reusable components for the frontend.
* **Axios**: A promise-based HTTP client for making API requests.
* **React Router DOM**: For handling client-side routing in the application.

### Backend
* **Node.js & Express**: The runtime environment and a web framework for the API server.
* **Prisma**: A modern database toolkit (ORM) for interacting with the MySQL database.
* **MySQL**: The relational database used to store all application data.
* **bcryptjs**: For securely hashing and comparing user passwords.
* **jsonwebtoken**: To handle authentication via JWT tokens.
* **Multer**: Middleware for handling `multipart/form-data`, primarily used for file uploads (e.g., flat images).
* **Nodemailer**: For sending emails, such as account verification and password reset codes.

---

## ⚙️ How to Set Up the Project Locally

### Prerequisites

* Node.js (v18 or higher recommended)
* MySQL Server
* Yarn or npm

### Step 1: Backend Setup

1.  Navigate to the `backend` directory.
    ```bash
    cd backend
    ```

2.  Install backend dependencies.
    ```bash
    npm install
    ```

3.  Set up the environment variables.
    * Create a `.env` file in the `backend` directory.
    * Copy the content from `backend/.env.example` into your new `.env` file.
    * Replace the placeholder values with your own configurations, including your MySQL database URL, a JWT secret, and your email service credentials.

4.  Run Prisma migrations to set up the database schema.
    ```bash
    npx prisma migrate dev --name init
    ```

5.  (Optional) Seed the database with initial data for testing.
    ```bash
    npm run db:seed
    ```

6.  Start the backend development server.
    ```bash
    npm run dev
    ```
    The server will run on `http://localhost:5000` by default.

### Step 2: Frontend Setup

1.  Open a new terminal and navigate to the `frontend` directory.
    ```bash
    cd ../frontend
    ```

2.  Install frontend dependencies.
    ```bash
    npm install
    ```

3.  Set up the environment variables for the frontend.
    * Create a `.env` file in the `frontend` directory.
    * Copy the content from `frontend/.env.example` into your new `.env` file.
    * Make sure `VITE_API_BASE_URL` points to your backend server URL.

4.  Start the frontend development server.
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

You should now be able to access the application and test its features locally.
