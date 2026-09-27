import { Navigate, Route, Routes } from "react-router-dom";
import NotFoundPage from "./page/Notfound";
import LoginPage from "../features/auth/pages/LoginPages";
import SignupPage from "../features/auth/pages/SignupPage";
import VerifyOtpPage from "../features/auth/pages/VerifyOtpPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage";
import DashboardPage from "./page/Dashboard";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import { ProjectDetailPage, ProjectsPage } from "../features/projects/view";
import { ProjectCreationPage } from "../features/project-creation/view";
import { CircuitCalculationPage } from "../features/calculation/view";

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
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute>
            <ProjectCreationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/circuits/new"
        element={
          <ProtectedRoute>
            <CircuitCalculationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
