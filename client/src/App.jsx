import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardEvents from "./pages/DashboardEvents";
import Login from "./pages/Login";


const Speakers = () => <div>Speakers Page</div>;

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to={"/login"} replace />;
  } else {
    return children;
  }
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* These are Nested Routes. They will render wherever the <Outlet /> is! */}
          <Route index element={<DashboardEvents />} />
          <Route path="speakers" element={<Speakers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
