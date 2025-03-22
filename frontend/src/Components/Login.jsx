import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        formData
      );
      onLogin(response.data.token);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-[90%] max-w-[400px] p-6 md:p-10 bg-card dark:bg-gray-800 rounded-2xl shadow-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">
        Login
      </h2>
      {error && (
        <div className="p-3 mb-6 rounded-lg bg-red-100 text-error text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3.5 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-3.5 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white hover:bg-primary-hover"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-center">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary hover:text-primary-hover">
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;
