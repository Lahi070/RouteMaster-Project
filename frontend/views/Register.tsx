import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the make of your first car?",
  "What is the name of your favorite childhood teacher?",
];

const Input = ({
  label,
  id,
  type = "text",
  icon: Icon,
  error,
  value,
  onChange,
  right = null,
}: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1 w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
          <Icon
            size={20}
            className={focused ? "text-[#FF6B35]" : "text-gray-400"}
          />
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          placeholder=" "
          className={`peer w-full bg-white/50 border ${error ? "border-red-500" : "border-gray-200"} rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all`}
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
        {right && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            {right}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] text-red-500 font-bold ml-2 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  );
};

const Register: React.FC = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    security_question: SECURITY_QUESTIONS[0],
    security_answer: "",
    terms: false,
  });
  const [errs, setErrs] = useState<any>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const criteria = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    num: /[0-9]/.test(form.password),
    spec: /[^A-Za-z0-9]/.test(form.password),
  };
  const score = Object.values(criteria).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eList: any = {};
    if (form.username.length < 3) eList.username = "Username too short";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      eList.email = "Invalid email";
    if (score < 4) eList.password = "Weak password";
    if (form.password !== form.confirm) eList.confirm = "Mismatch";
    if (!form.security_answer.trim()) eList.security_answer = "Required";
    if (!form.terms) eList.terms = "Required";

    if (Object.keys(eList).length > 0) return setErrs(eList);

    setErrs({});
    setLoading(true);

    try {
      await register({
        email: form.email,
        username: form.username,
        password: form.password,
        security_question: form.security_question,
        security_answer: form.security_answer,
      });
      setDone(true);
      setTimeout(() => navigate("/preferences"), 2000);
    } catch (err: any) {
      setErrs({ general: err.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-[#FAFAFA] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B35]/5 via-transparent to-[#004E89]/5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full glass rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10"
      >
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-10">
                <ShieldCheck className="text-[#FF6B35] w-12 h-12 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-[#004E89] mb-1">
                  Create Account
                </h2>
                <p className="text-gray-500">
                  Plan your heritage route with AI
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {errs.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errs.general}
                  </div>
                )}

                <Input
                  label="Username"
                  id="username"
                  icon={User}
                  value={form.username}
                  error={errs.username}
                  onChange={(e: any) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  icon={Mail}
                  value={form.email}
                  error={errs.email}
                  onChange={(e: any) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />

                <div className="space-y-3">
                  <Input
                    label="Password"
                    id="pass"
                    type={show ? "text" : "password"}
                    icon={Lock}
                    value={form.password}
                    error={errs.password}
                    onChange={(e: any) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    right={
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="text-gray-400"
                      >
                        {show ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    }
                  />
                  <div className="flex space-x-1 h-1.5 px-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`flex-1 rounded-full transition-all ${score >= s ? (score < 3 ? "bg-red-400" : "bg-[#06D6A0]") : "bg-gray-100"}`}
                      />
                    ))}
                  </div>
                </div>

                <Input
                  label="Confirm Password"
                  id="conf"
                  type="password"
                  icon={Lock}
                  value={form.confirm}
                  error={errs.confirm}
                  onChange={(e: any) =>
                    setForm({ ...form, confirm: e.target.value })
                  }
                />

                <div className="space-y-1 w-full relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                    <ShieldCheck size={20} />
                  </div>
                  <select
                    id="security_question"
                    value={form.security_question}
                    onChange={(e: any) =>
                      setForm({ ...form, security_question: e.target.value })
                    }
                    className={`peer w-full bg-white/50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all appearance-none`}
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  <label className="absolute -top-2 left-4 text-xs text-[#FF6B35] bg-white px-2 pointer-events-none transition-all z-10">
                    Security Question
                  </label>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>

                <Input
                  label="Security Answer"
                  id="security_answer"
                  icon={ShieldCheck}
                  value={form.security_answer}
                  error={errs.security_answer}
                  onChange={(e: any) =>
                    setForm({ ...form, security_answer: e.target.value })
                  }
                />

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={(e) =>
                      setForm({ ...form, terms: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-200 text-[#004E89]"
                  />
                  <span className="text-sm text-gray-500">
                    Accept{" "}
                    <Link to="/terms" className="text-[#004E89] font-bold hover:underline">
                      Terms
                    </Link>
                  </span>
                </label>

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full py-4 text-lg"
                >
                  Sign Up
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="win"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center py-12"
            >
              <CheckCircle2 className="text-[#06D6A0] w-16 h-16 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-[#004E89] mb-4">
                Welcome, {form.username}!
              </h2>
              <p className="text-gray-500">Redirecting to preferences...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;
