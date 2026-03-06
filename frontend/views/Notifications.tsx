import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Mail, Smartphone, Megaphone, Star, Map } from "lucide-react";
import { Link } from "react-router-dom";

type NotifSetting = {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    defaultOn: boolean;
    category: string;
};

const NOTIF_SETTINGS: NotifSetting[] = [
    {
        id: "email_updates",
        label: "Email Updates",
        description: "Receive itinerary and account updates via email",
        icon: <Mail size={20} />,
        defaultOn: true,
        category: "Email",
    },
    {
        id: "email_promotions",
        label: "Promotional Emails",
        description: "Get offers, tips and travel inspiration",
        icon: <Megaphone size={20} />,
        defaultOn: false,
        category: "Email",
    },
    {
        id: "push_alerts",
        label: "Push Alerts",
        description: "Get alerts for saved itinerary changes",
        icon: <Smartphone size={20} />,
        defaultOn: true,
        category: "Push",
    },
    {
        id: "new_recommendations",
        label: "New Recommendations",
        description: "Be notified when AI finds new route matches",
        icon: <Map size={20} />,
        defaultOn: true,
        category: "Push",
    },
    {
        id: "review_requests",
        label: "Review Requests",
        description: "Get asked to review destinations you've visited",
        icon: <Star size={20} />,
        defaultOn: false,
        category: "Push",
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

const Notifications: React.FC = () => {
    const [settings, setSettings] = useState<Record<string, boolean>>(
        Object.fromEntries(NOTIF_SETTINGS.map((s) => [s.id, s.defaultOn]))
    );
    const [saved, setSaved] = useState(false);

    const toggle = (id: string) => setSettings((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const emailSettings = NOTIF_SETTINGS.filter((s) => s.category === "Email");
    const pushSettings = NOTIF_SETTINGS.filter((s) => s.category === "Push");

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
                    <div className="p-3 bg-[#FF6B35] rounded-2xl text-white">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#004E89]">Notifications</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Control how and when we reach you</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {[{ label: "Email Notifications", items: emailSettings }, { label: "Push Notifications", items: pushSettings }].map((group) => (
                        <div key={group.label} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{group.label}</h2>
                            <div className="space-y-6">
                                {group.items.map((setting, i) => (
                                    <div key={setting.id}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-gray-50 rounded-xl text-[#FF6B35] mt-0.5">
                                                    {setting.icon}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{setting.label}</p>
                                                    <p className="text-sm text-gray-400 mt-0.5">{setting.description}</p>
                                                </div>
                                            </div>
                                            <Toggle enabled={settings[setting.id]} onChange={() => toggle(setting.id)} />
                                        </div>
                                        {i < group.items.length - 1 && <div className="mt-6 border-t border-gray-50" />}
                                    </div>
                                ))}
                            </div>
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
            </motion.div>
        </div>
    );
};

export default Notifications;
