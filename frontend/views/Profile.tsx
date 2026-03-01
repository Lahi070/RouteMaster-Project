import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Heart,
  Clock,
  LogOut,
  ChevronRight,
  Edit2,
  Shield,
  Bell,
  Loader,
  MapPin,
  Trash2,
  Save,
  X,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { userAPI, authAPI } from "../services/apiService";
import { UserPreferenceResponse, SavedItineraryResponse } from "../types";

const Profile: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [preferences, setPreferences] = useState<UserPreferenceResponse | null>(
    null,
  );
  const [savedItineraries, setSavedItineraries] = useState<
    SavedItineraryResponse[]
  >([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [loadingItineraries, setLoadingItineraries] = useState(true);
  const navigate = useNavigate();

  // Edit profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    email: "",
    username: "",
    fullName: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change password states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setProfileError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileError(null);
    if (user) {
      setEditedProfile({
        email: user.email,
        username: user.username,
        fullName: user.fullName || "",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setProfileError(null);
      await userAPI.updateProfile(editedProfile);
      // Refresh profile to get updated data
      const updatedUser = await userAPI.getProfile();
      setUser(updatedUser);
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      setProfileError(
        error.response?.data?.detail || "Failed to update profile",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordError(null);
      if (logout) {
        logout();
      }
    } catch (error: any) {
      console.error("Failed to change password:", error);
      setPasswordError(
        error.response?.data?.detail || "Failed to change password",
      );
    } finally {
      setChangingPassword(false);
    }
  };
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await userAPI.getProfile();
        setUser(profile);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    const fetchPreferences = async () => {
      try {
        const prefs = await userAPI.getPreferences();
        setPreferences(prefs);
      } catch {
        // No preferences set
      } finally {
        setLoadingPrefs(false);
      }
    };

    const fetchItineraries = async () => {
      try {
        const itineraries = await userAPI.getSavedItineraries();
        setSavedItineraries(itineraries);
      } catch {
        // No saved itineraries
      } finally {
        setLoadingItineraries(false);
      }
    };

    if (!user) {
      fetchProfile();
    }
    fetchPreferences();
    fetchItineraries();
  }, []);

  useEffect(() => {
    if (user) {
      setEditedProfile({
        email: user.email,
        username: user.username,
        fullName: user.fullName || "",
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDeleteItinerary = async (id: number) => {
    try {
      await userAPI.deleteItinerary(id);
      setSavedItineraries((prev) => prev.filter((it) => it.id !== id));
    } catch (error) {
      console.error("Failed to delete itinerary:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-[#FF6B35]" size={32} />
      </div>
    );
  }

  const prefStyles = preferences?.preferredTravelStyles?.styles || [];

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-12 mb-16">
        <div className="relative">
          <div className="w-40 h-40 rounded-full border-4 border-[#FF6B35] p-1 shadow-2xl">
            <img
              src="https://picsum.photos/seed/user123/200/200"
              className="w-full h-full rounded-full object-cover"
              alt="Profile"
            />
          </div>
          <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg text-[#004E89] border border-gray-100">
            <Edit2 size={16} />
          </button>
        </div>

        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-2">
            <h2 className="text-4xl font-bold text-[#004E89]">
              {user.username}
            </h2>
            <span className="bg-[#06D6A0]/10 text-[#06D6A0] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest self-center">
              {user.role === "admin" ? "Admin" : "Explorer"}
            </span>
          </div>
          <p className="text-gray-500 mb-6 font-medium">
            {user.email} • Member since{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </p>
          <div className="flex space-x-3 justify-center md:justify-start">
            {user.role !== "admin" && (
              <Link to="/preferences">
                <Button variant="outline" className="px-6 py-2 text-sm">
                  Change Preferences
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="px-6 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Profile Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#004E89] flex items-center">
                <User className="mr-3" /> Profile Details
              </h3>
              {!isEditingProfile ? (
                <button
                  onClick={handleEditProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-[#004E89] text-white rounded-lg hover:bg-[#003d6b] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingProfile ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {savingProfile ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {profileError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{profileError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => {
                      setEditedProfile({
                        ...editedProfile,
                        email: e.target.value,
                      });
                      setProfileError(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004E89] focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">
                    {user?.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editedProfile.username}
                    onChange={(e) => {
                      setEditedProfile({
                        ...editedProfile,
                        username: e.target.value,
                      });
                      setProfileError(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004E89] focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">
                    {user?.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editedProfile.fullName}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004E89] focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">
                    {user?.fullName || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a28] transition-colors"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </motion.div>

          {user.role !== "admin" && (
            <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Heart className="mr-3 text-[#FF6B35]" /> Saved Itineraries
              </h3>
              {loadingItineraries ? (
                <div className="flex justify-center py-8">
                  <Loader className="animate-spin text-gray-300" size={24} />
                </div>
              ) : savedItineraries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No saved itineraries yet</p>
                  <Link to="/preferences">
                    <Button variant="outline" className="text-sm">
                      Plan your first trip
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedItineraries.map((itinerary) => (
                    <div
                      key={itinerary.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#004E89] shadow-sm">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="font-bold">
                            {itinerary.title ||
                              `Itinerary #${itinerary.combinationId}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {itinerary.isFavorite && "★ "}
                            Saved on{" "}
                            {new Date(itinerary.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItinerary(itinerary.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {user.role !== "admin" && (
            <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <User className="mr-3 text-[#004E89]" /> Travel Preferences
              </h3>
              {loadingPrefs ? (
                <div className="flex justify-center py-4">
                  <Loader className="animate-spin text-gray-300" size={24} />
                </div>
              ) : prefStyles.length === 0 &&
                !preferences?.preferredStartLocation ? (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-4">No preferences set yet</p>
                  <Link to="/preferences">
                    <Button variant="outline" className="text-sm">
                      Set your preferences
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {prefStyles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {prefStyles.map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm font-medium border border-gray-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {(preferences?.preferredStartLocation ||
                    preferences?.preferredBudgetRange) && (
                    <div className="flex flex-wrap gap-4 pt-2">
                      {preferences.preferredStartLocation && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin size={14} className="mr-1.5 text-[#FF6B35]" />
                          {preferences.preferredStartLocation}
                        </div>
                      )}
                      {preferences.preferredBudgetRange && (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-1.5 text-[#FF6B35] font-bold text-xs">
                            Rs
                          </span>
                          {preferences.preferredBudgetRange
                            .charAt(0)
                            .toUpperCase() +
                            preferences.preferredBudgetRange.slice(1)}{" "}
                          budget
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Settings className="mr-3 text-gray-400" /> Settings
            </h3>
            <div className="space-y-4">
              <SettingItem icon={<Bell size={18} />} label="Notifications" />
              <SettingItem icon={<Shield size={18} />} label="Privacy & Data" />
              <div className="pt-4 mt-4 border-t border-gray-50">
                <button className="text-red-500 font-bold text-sm hover:underline">
                  Delete Account
                </button>
              </div>
            </div>
          </section>

          <div className="bg-[#004E89] p-8 rounded-3xl shadow-xl text-white text-center">
            <p className="text-sm font-bold text-white/60 mb-2 uppercase tracking-widest">
              Total Heritage Points
            </p>
            <p className="text-5xl font-extrabold mb-4">4,250</p>
            <p className="text-xs text-white/70 italic">
              "You are 750 points away from unlocking the Cultural Ambassador
              badge!"
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#004E89] flex items-center">
                <Lock className="mr-3" /> Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{passwordError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    });
                    setPasswordError(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004E89] focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004E89] focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004E89] focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 bg-[#004E89] text-white rounded-lg hover:bg-[#003d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword && (
                    <Loader className="w-4 h-4 animate-spin" />
                  )}
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordError(null);
                  }}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const SettingItem: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex items-center justify-between py-2 cursor-pointer group">
    <div className="flex items-center space-x-3 text-gray-600 group-hover:text-[#004E89] transition-colors">
      {icon}
      <span className="font-medium">{label}</span>
    </div>
    <ChevronRight size={16} className="text-gray-300" />
  </div>
);

export default Profile;
