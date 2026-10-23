import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AppLayout from "./features/tournaments/components/AppLayout";
import HomePage from "./features/tournaments/pages/HomePage";
import LandingPage from "./features/tournaments/pages/LandingPage";
import DetailPage from "./features/tournaments/pages/DetailPage";
import AuthLayout from "./features/auth/layouts/AuthLayout";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import { logout } from "./features/auth/states/slice";
import UsersPage from "./features/users/pages/UsersPage";

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    const onExpired = () => { dispatch(logout()); navigate("/auth/login"); };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [dispatch, navigate]);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={user ? <HomePage /> : <LandingPage />} />
        <Route path="/tournaments/:id" element={user ? <DetailPage /> : <Navigate to="/auth/login" replace />} />
        <Route path="/panitia" element={<UsersPage />} />
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
