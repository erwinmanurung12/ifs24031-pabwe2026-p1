import { Route, Routes } from "react-router-dom";
import AppLayout from "./features/tournaments/components/AppLayout";
import HomePage from "./features/tournaments/pages/HomePage";
import DetailPage from "./features/tournaments/pages/DetailPage";
import AuthLayout from "./features/auth/layouts/AuthLayout";
import LoginPage from "./features/auth/pages/LoginPage";
import UsersPage from "./features/users/pages/UsersPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tournaments/:id" element={<DetailPage />} />
        <Route path="/panitia" element={<UsersPage />} />
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}
