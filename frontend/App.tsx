import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Landing from "./views/Landing";
import Login from "./views/Login";
import Register from "./views/Register";
import Preferences from "./views/Preferences";
import Recommendations from "./views/Recommendations";
import RouteMap from "./views/RouteMap";
import DestinationDetail from "./views/DestinationDetail";
import Explainability from "./views/Explainability";
import Profile from "./views/Profile";
import Locations from "./views/Locations";
import Users from "./views/Users";
import Terms from "./views/Terms";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/preferences"
                element={
                  <ProtectedRoute>
                    <Preferences />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute>
                    <Recommendations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/route"
                element={
                  <ProtectedRoute>
                    <RouteMap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/destination/:id"
                element={
                  <ProtectedRoute>
                    <DestinationDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/explain"
                element={
                  <ProtectedRoute>
                    <Explainability />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/locations"
                element={
                  <ProtectedRoute>
                    <Locations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
