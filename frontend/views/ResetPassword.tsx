import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { authAPI } from "../services/apiService";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setMessage({ type: "error", text: "Invalid or missing reset token." });
            return;
        }
        if (password !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (password.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters long." });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await authAPI.resetPassword({ token, newPassword: password });
            setMessage({ type: "success", text: response.message });
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to reset password." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-[#FAFAFA]">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#004E89]/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full glass rounded-3xl p-8 md:p-12 shadow-2xl z-10 border border-white/40"
            >
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-[#004E89] mb-2">Create New Password</h2>
                    <p className="text-gray-500 font-medium">Please enter your new password below.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    {!token && !message && (
                        <div className="bg-orange-50 text-orange-700 border border-orange-200 p-4 rounded-xl text-sm mb-4">
                            Warning: Reset token is missing from the URL. You won't be able to reset your password.
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                            <Lock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="New Password"
                            className="w-full bg-white/50 border border-gray-200 rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                            <Lock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm New Password"
                            className="w-full bg-white/50 border border-gray-200 rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <Button type="submit" isLoading={loading} className="w-full py-4 text-lg" disabled={!token}>
                        Reset Password
                    </Button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
