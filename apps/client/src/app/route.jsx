import { Navigate, Route, Routes } from "react-router-dom";
import NotFoundPage from "./page/Notfound";
import LoginPage from "../features/auth/pages/LoginPages";
import SignupPage from "../features/auth/pages/SignupPage";
import VerifyOtpPage from "../features/auth/pages/VerifyOtpPage";
import DashboardPage from "./page/Dashboard";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/otp" element={<VerifyOtpPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
