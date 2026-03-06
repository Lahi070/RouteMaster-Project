import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Bell, Moon, Globe, Eye, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

type ToggleSetting = {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    defaultOn?: boolean;
};

const ACCOUNT_SETTINGS: ToggleSetting[] = [
    {
        id: "dark_mode",
        label: "Dark Mode",
        description: "Switch to a darker color scheme",
        icon: <Moon size={20} />,
        defaultOn: false,
    },
    {
        id: "language",
        label: "Language",
        description: "English (United States)",
        icon: <Globe size={20} />,
    },
    {
        id: "two_factor",
        label: "Two-Factor Authentication",
        description: "Add an extra layer of security to your account",
        icon: <Smartphone size={20} />,
        defaultOn: false,
    },
    {
        id: "show_profile",
        label: "Public Profile",
        description: "Allow others to view your profile and itineraries",
        icon: <Eye size={20} />,
        defaultOn: true,
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

const AccountSettings: React.FC = () => {
    const [settings, setSettings] = useState<Record<string, boolean>>(
        Object.fromEntries(ACCOUNT_SETTINGS.map((s) => [s.id, s.defaultOn ?? false]))
    );
    const [saved, setSaved] = useState(false);

    const toggle = (id: string) => setSettings((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen pt-28 pb-20 px-6 max-w-2xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FF6B35]/8 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#004E89]/8 rounded-full blur-3xl" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to="/profile" className="inline-flex items-center text-[#004E89] hover:text-[#FF6B35] transition-colors mb-6 font-medium">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Profile
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-[#004E89] rounded-2xl text-white">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#004E89]">Account Settings</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Manage your preferences and account options</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">
                    {ACCOUNT_SETTINGS.map((setting, i) => (
                        <div key={setting.id}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-[#004E89] mt-0.5">
                                        {setting.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{setting.label}</p>
                                        <p className="text-sm text-gray-400 mt-0.5">{setting.description}</p>
                                    </div>
                                </div>
                                {setting.id !== "language" && (
                                    <Toggle enabled={settings[setting.id]} onChange={() => toggle(setting.id)} />
                                )}
                            </div>
                            {i < ACCOUNT_SETTINGS.length - 1 && <div className="mt-6 border-t border-gray-50" />}
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-[#FF6B35] text-white rounded-2xl font-semibold hover:bg-[#e55a28] transition-all shadow-lg shadow-orange-200 active:scale-95"
                    >
                        {saved ? "✓ Saved!" : "Save Settings"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountSettings;
