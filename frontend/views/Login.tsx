import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

const FloatingInput = ({
  label,
  id,
  type = "text",
  icon: Icon,
  value,
  onChange,
  rightElement = null,
}: any) => {
  const [focus, setFocus] = useState(false);

  return (
    <div className="relative w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
        <Icon
          size={20}
          className={focus ? "text-[#FF6B35]" : "text-gray-400"}
        />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        required
        placeholder=" "
        className="peer w-full bg-white/50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all"
      />
      <label
        htmlFor={id}
        className={`absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 transition-all pointer-events-none
          peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:text-[#FF6B35] peer-focus:bg-white peer-focus:px-2
          ${value ? "-top-2 left-4 text-xs text-gray-400 bg-white px-2" : ""}
        `}
      >
        {label}
      </label>
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          {rightElement}
        </div>
      )}
    </div>
  );
};

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(form);
      // Redirect based on user role
      if (user.role === "admin") {
        navigate("/admin/locations");
      } else {
        navigate("/preferences");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#FAFAFA]">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#004E89]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass rounded-3xl p-8 md:p-12 shadow-2xl z-10 border border-white/40"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#004E89] mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-500 font-medium">
            Sign in to your heritage explorer account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <FloatingInput
            label="Email Address"
            id="email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
          />

          <div className="space-y-2">
            <FloatingInput
              label="Password"
              id="password"
              type={show ? "text" : "password"}
              icon={Lock}
              value={form.password}
              onChange={(e: any) =>
                setForm({ ...form, password: e.target.value })
              }
              rightElement={
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="text-gray-400"
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <div className="text-right">
              <button
                type="button"
                className="text-xs text-[#FF6B35] font-bold hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-4 text-lg"
          >
            Sign In
          </Button>
        </form>

        <p className="text-center mt-8 text-gray-600 font-medium">
          New here?{" "}
          <Link
            to="/register"
            className="text-[#004E89] font-bold hover:underline"
          >
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
