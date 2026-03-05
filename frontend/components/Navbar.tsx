import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Map, Compass, User, LogOut, MapPin, Users, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const hideNav = ["/login", "/register", "/"].includes(pathname);

  if (hideNav && pathname !== "/") return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center glass border-b border-gray-200">
      <Link
        to={isAuthenticated ? "/preferences" : "/"}
        className="flex items-center space-x-2"
      >
        <div className="w-10 h-10 bg-[#FF6B35] rounded-lg flex items-center justify-center">
          <Compass className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold font-heading text-[#004E89]">
          RouteMaster
        </span>
      </Link>

      {isAuthenticated && (
        <>
          <div className="hidden md:flex items-center space-x-8">
            {user?.role === "admin" ? (
              <>
                <NavLink
                  to="/admin/locations"
                  icon={<MapPin size={20} />}
                  label="Locations"
                />
                <NavLink
                  to="/admin/users"
                  icon={<Users size={20} />}
                  label="Users"
                />
              </>
            ) : (
              <>
                <NavLink
                  to="/preferences"
                  icon={<Compass size={20} />}
                  label="Plan"
                />
                <NavLink
                  to="/recommendations"
                  icon={<Map size={20} />}
                  label="Routes"
                />
                <NavLink
                  to="/causal-recommend"
                  icon={<Brain size={20} />}
                  label="AI"
                />
              </>
            )}
            <NavLink to="/profile" icon={<User size={20} />} label="Profile" />
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden md:block">
              {user?.username}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500"
              title="Logout"
            >
              <LogOut size={24} />
            </motion.button>
          </div>
        </>
      )}

      {!isAuthenticated && pathname === "/" && (
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-gray-700 hover:text-[#004E89] font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg hover:bg-[#e55a28] transition-colors font-medium"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

const NavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => {
  const { pathname } = useLocation();
  const active =
    pathname === to ||
    (to === "/recommendations" &&
      (pathname.startsWith("/route") ||
        pathname.startsWith("/destination"))) ||
    (to === "/causal-recommend" &&
      (pathname.startsWith("/causal-recommend") ||
        pathname.startsWith("/explain")));

  return (
    <Link
      to={to}
      className={`relative flex items-center space-x-2 font-medium transition-colors ${active ? "text-[#FF6B35]" : "text-gray-500 hover:text-[#004E89]"
        }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FF6B35]"
        />
      )}
    </Link>
  );
};

export default Navbar;
