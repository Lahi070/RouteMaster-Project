import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShieldCheck, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { authAPI } from "../services/apiService";

const Input = ({ label, id, type = "text", icon: Icon, value, onChange, placeholder }: any) => {
    const [focused, setFocused] = useState(false);
    return (
        <div className="space-y-1 w-full relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                <Icon size={20} className={focused ? "text-[#FF6B35]" : "text-gray-400"} />
            </div>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                placeholder={placeholder || " "}
                className="peer w-full bg-white/50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all placeholder:text-transparent focus:placeholder:text-gray-400"
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
        </div>
    );
};

const ForgotPassword = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [username, setUsername] = useState("");
    const [question, setQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const navigate = useNavigate();

    const handleFetchQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setMessage(null);

        try {
            const res = await authAPI.getSecurityQuestion(username);
            setQuestion(res.question);
            setStep(2);
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to find user." });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!securityAnswer.trim()) {
            setMessage({ type: "error", text: "Security answer is required." });
            return;
        }
        if (newPassword.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await authAPI.resetPasswordSecurity({
                username,
                securityAnswer,
                newPassword
            });
            setStep(3);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Reset failed. Please check your answer." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-[#FAFAFA] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#004E89]/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full glass rounded-[2.5rem] p-8 md:p-12 shadow-2xl z-10 relative"
            >
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Link to="/login" className="inline-flex items-center text-[#004E89] hover:text-[#FF6B35] transition-colors mb-6 font-medium text-sm">
                                <ArrowLeft size={16} className="mr-2" />
                                Back to Login
                            </Link>
                            <div className="text-center mb-10">
                                <ShieldCheck className="text-[#FF6B35] w-12 h-12 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-[#004E89] mb-2">Account Recovery</h2>
                                <p className="text-gray-500">Enter your username to recover your account.</p>
                            </div>

                            <form onSubmit={handleFetchQuestion} className="space-y-6">
                                {message && (
                                    <div className={`p-4 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                        {message.text}
                                    </div>
                                )}

                                <Input
                                    label="Username"
                                    id="username"
                                    icon={User}
                                    value={username}
                                    onChange={(e: any) => setUsername(e.target.value)}
                                />

                                <Button type="submit" isLoading={loading} className="w-full py-4 text-lg">
                                    Continue
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button
                                onClick={() => setStep(1)}
                                className="inline-flex items-center text-[#004E89] hover:text-[#FF6B35] transition-colors mb-6 font-medium text-sm"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Back
                            </button>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-[#004E89] mb-2">Security Question</h2>
                                <p className="text-[#FF6B35] font-medium text-lg leading-tight bg-[#FF6B35]/10 p-4 rounded-xl">
                                    "{question}"
                                </p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                {message && (
                                    <div className={`p-4 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200`}>
                                        {message.text}
                                    </div>
                                )}

                                <Input
                                    label="Your Answer"
                                    id="answer"
                                    icon={ShieldCheck}
                                    value={securityAnswer}
                                    onChange={(e: any) => setSecurityAnswer(e.target.value)}
                                />

                                <Input
                                    label="New Password"
                                    id="newPassword"
                                    type="password"
                                    icon={Lock}
                                    value={newPassword}
                                    onChange={(e: any) => setNewPassword(e.target.value)}
                                />

                                <Input
                                    label="Confirm Password"
                                    id="confirmPassword"
                                    type="password"
                                    icon={Lock}
                                    value={confirmPassword}
                                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                                />

                                <Button type="submit" isLoading={loading} className="w-full py-4 text-lg mt-2">
                                    Reset Password
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                            <CheckCircle2 className="text-[#06D6A0] w-16 h-16 mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-[#004E89] mb-4">Password Reset!</h2>
                            <p className="text-gray-500">Your password has been changed. Redirecting to login...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
