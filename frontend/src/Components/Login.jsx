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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-[90%] max-w-[400px] p-6 md:p-10 bg-gray-800 rounded-2xl shadow-lg border border-primary/20">
        <h2 className="text-2xl md:text-3xl font-semibold text-primary-light text-center mb-8">
          Login
        </h2>
        {error && (
          <div className="p-3 mb-6 rounded-lg bg-red-900/50 text-red-200 text-center border border-red-500/20">
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
              className="w-full p-3.5 bg-gray-700 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-white placeholder-gray-400"
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
              className="w-full p-3.5 bg-gray-700 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-200"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-gray-300">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary-light hover:text-primary transition-colors duration-200"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
