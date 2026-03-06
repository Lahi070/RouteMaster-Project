import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import { authAPI } from "../services/apiService";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setMessage(null);

        try {
            const response = await authAPI.forgotPassword({ email });
            setMessage({ type: "success", text: response.message });
            setEmail("");
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Something went wrong. Please try again." });
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
                <Link to="/login" className="inline-flex items-center text-[#004E89] hover:text-[#FF6B35] transition-colors mb-6 font-medium text-sm">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Login
                </Link>
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-[#004E89] mb-2">Forgot Password</h2>
                    <p className="text-gray-500 font-medium">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                            <Mail size={20} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Email Address"
                            className="w-full bg-white/50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <Button type="submit" isLoading={loading} className="w-full py-4 text-lg">
                        Send Reset Link
                    </Button>
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
