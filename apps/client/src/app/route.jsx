import { Navigate, Route, Routes } from "react-router-dom";
import NotFoundPage from "./page/Notfound";
import LoginPage from "../features/auth/pages/LoginPages";
import SignupPage from "../features/auth/pages/SignupPage";
import VerifyOtpPage from "../features/auth/pages/VerifyOtpPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage";
import DashboardPage from "./page/Dashboard";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/otp" element={<VerifyOtpPage />} />
      <Route path="/password/forgot" element={<ForgotPasswordPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/password/change"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
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
