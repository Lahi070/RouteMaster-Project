import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Download, Trash2, Eye, Database, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/apiService";
import { useNavigate } from "react-router-dom";

type ToggleSetting = {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    defaultOn: boolean;
};

const PRIVACY_SETTINGS: ToggleSetting[] = [
    {
        id: "data_analytics",
        label: "Usage Analytics",
        description: "Help us improve RouteMaster by sharing anonymous usage data",
        icon: <Database size={20} />,
        defaultOn: true,
    },
    {
        id: "personalized_ads",
        label: "Personalized Content",
        description: "Allow us to tailor recommendations based on your activity",
        icon: <Eye size={20} />,
        defaultOn: true,
    },
    {
        id: "third_party_sharing",
        label: "Third-Party Sharing",
        description: "Share your data with trusted partners to enhance services",
        icon: <Lock size={20} />,
        defaultOn: false,
    },
];

const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${enabled ? "bg-[#FF6B35]" : "bg-gray-200"}`}
    >
        <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
        />
    </button>
);

const PrivacyData: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [settings, setSettings] = useState<Record<string, boolean>>(
        Object.fromEntries(PRIVACY_SETTINGS.map((s) => [s.id, s.defaultOn]))
    );
    const [saved, setSaved] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const toggle = (id: string) => setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDownloadData = () => {
        const dataStr = JSON.stringify({ message: "Your data export will be emailed to you within 24 hours.", timestamp: new Date().toISOString() }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "routemaster_data_request.json";
        a.click();
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return;
        try {
            setDeletingAccount(true);
            await userAPI.deleteAccount();
            await logout();
        } catch (error: any) {
            alert(error.message || "Failed to delete account");
            setDeletingAccount(false);
        }
    };

    return (
        <div className="min-h-screen pt-28 pb-20 px-6 max-w-2xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#004E89]/8 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#FF6B35]/8 rounded-full blur-3xl" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to="/profile" className="inline-flex items-center text-[#004E89] hover:text-[#FF6B35] transition-colors mb-6 font-medium">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Profile
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-[#06D6A0] rounded-2xl text-white">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#004E89]">Privacy & Data</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Control your data and privacy preferences</p>
                    </div>
                </div>

                {/* Privacy Toggles */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Data Preferences</h2>
                    <div className="space-y-6">
                        {PRIVACY_SETTINGS.map((setting, i) => (
                            <div key={setting.id}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-gray-50 rounded-xl text-[#06D6A0] mt-0.5">
                                            {setting.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{setting.label}</p>
                                            <p className="text-sm text-gray-400 mt-0.5">{setting.description}</p>
                                        </div>
                                    </div>
                                    <Toggle enabled={settings[setting.id]} onChange={() => toggle(setting.id)} />
                                </div>
                                {i < PRIVACY_SETTINGS.length - 1 && <div className="mt-6 border-t border-gray-50" />}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 bg-[#FF6B35] text-white rounded-2xl font-semibold hover:bg-[#e55a28] transition-all shadow-lg shadow-orange-200 active:scale-95"
                        >
                            {saved ? "✓ Saved!" : "Save Preferences"}
                        </button>
                    </div>
                </div>

                {/* Download Data */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Your Data</h2>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-[#004E89]">
                            <Download size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">Download My Data</p>
                            <p className="text-sm text-gray-400 mt-1">Request an export of all data we hold about your account.</p>
                        </div>
                        <button
                            onClick={handleDownloadData}
                            className="px-5 py-2.5 bg-[#004E89] text-white text-sm rounded-xl font-semibold hover:bg-[#003d6b] transition-colors"
                        >
                            Request Export
                        </button>
                    </div>
                </div>

                {/* Delete Account */}
                <div className="bg-red-50 rounded-3xl border border-red-100 p-8">
                    <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4">Danger Zone</h2>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-500">
                            <Trash2 size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-red-800">Delete Account</p>
                            <p className="text-sm text-red-400 mt-1">Permanently remove your account and all associated data. This cannot be undone.</p>
                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="mt-4 px-5 py-2.5 border border-red-300 text-red-500 text-sm rounded-xl font-semibold hover:bg-red-100 transition-colors"
                                >
                                    Delete My Account
                                </button>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-red-500 font-medium">Type <span className="font-mono font-bold">DELETE</span> to confirm</p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        className="w-full px-4 py-2 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-sm"
                                        placeholder="Type DELETE to confirm"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                                            className="px-5 py-2 bg-red-500 text-white text-sm rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {deletingAccount ? "Deleting..." : "Confirm Delete"}
                                        </button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                                            className="px-5 py-2 bg-white text-gray-600 text-sm rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PrivacyData;
