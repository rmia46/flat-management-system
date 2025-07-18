// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import { login, register, getAllFlats } from './services/api'; // Import your API service
import './App.css'; // Keep or remove based on your preference for App-specific CSS

function App() {
  const [message, setMessage] = useState('Welcome to Flat Management!');

  // Example of making an API call after component mounts
  useEffect(() => {
    const fetchWelcome = async () => {
      try {
        // This is just to test if the backend root endpoint is reachable
        const response = await fetch('http://localhost:5000');
        const text = await response.text();
        setMessage(text);
      } catch (error) {
        console.error("Failed to fetch from backend:", error);
        setMessage("Failed to connect to backend. Is it running?");
      }
    };
    fetchWelcome();
  }, []); // Empty dependency array means this runs once on mount

  const handleRegister = async () => {
    try {
      // Example: Register a new test user
      const res = await register({
        firstName: "Test",
        lastName: "User",
        email: `test${Date.now()}@example.com`, // Unique email
        password: "testpassword123",
        userType: "tenant"
      });
      console.log("Register Response:", res.data);
      setMessage("Registered! Check console for token.");
    } catch (error: any) {
      console.error("Registration Error:", error.response ? error.response.data : error.message);
      setMessage("Registration failed. See console.");
    }
  };

  const handleLogin = async () => {
    try {
      // Example: Login the previously registered user (adjust email if changed)
      const res = await login({
        email: "john.doe@example.com", // Or the unique email you used for test registration
        password: "securepassword123"
      });
      console.log("Login Response:", res.data);
      setMessage("Logged in! Check console for token.");
    } catch (error: any) {
      console.error("Login Error:", error.response ? error.response.data : error.message);
      setMessage("Login failed. See console.");
    }
  };

  const handleGetAllFlats = async () => {
    try {
      const res = await getAllFlats();
      console.log("All Flats:", res.data);
      setMessage(`Fetched ${res.data.length} flats. Check console.`);
    } catch (error: any) {
      console.error("Get Flats Error:", error.response ? error.response.data : error.message);
      setMessage("Failed to get flats. See console.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-5xl font-bold mb-8 text-blue-400">Flat Management Frontend</h1>
      <p className="text-xl mb-4">{message}</p>
      <div className="space-x-4">
        <button onClick={handleRegister} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">
          Test Register
        </button>
        <button onClick={handleLogin} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg">
          Test Login
        </button>
        <button onClick={handleGetAllFlats} className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg">
          Test Get All Flats
        </button>
      </div>
      <p className="mt-8 text-gray-500 text-sm">
        Check your browser's console for API responses.
      </p>
    </div>
  );
}

export default App;
