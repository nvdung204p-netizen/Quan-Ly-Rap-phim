import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, getToken } from "../services/api";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import { RequireAuth, RequireRoles } from "../components/common/Guards";
import AuthPage from "../pages/AuthPage";
import MoviesPage from "../pages/MoviesPage";
import MovieDetailPage from "../pages/MovieDetailPage";
import ShowtimesPage from "../pages/ShowtimesPage";
import BookingPage from "../pages/BookingPage";
import EventsPage from "../pages/EventsPage";
import PromotionsPage from "../pages/PromotionsPage";
import PricesPage from "../pages/PricesPage";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
import StaffCheckinPage from "../pages/StaffCheckinPage";

export default function AppRoutes() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(api.getMeFromToken());

  useEffect(() => {
    setUser(api.getMeFromToken());
  }, [token]);

  function logout() {
    localStorage.removeItem("accessToken");
    setToken("");
    setUser(null);
  }

  return (
    <Routes>
      <Route element={<MainLayout token={token} onLogout={logout} user={user} />}>
        <Route path="/" element={<Navigate to="/phim" replace />} />
        <Route path="/auth" element={<AuthPage setToken={setToken} />} />
        <Route path="/phim" element={<MoviesPage />} />
        <Route path="/phim/:phimId" element={<MovieDetailPage />} />
        <Route path="/lich-chieu" element={<ShowtimesPage />} />
        <Route path="/dat-ve" element={<BookingPage />} />
        <Route path="/su-kien" element={<EventsPage />} />
        <Route path="/khuyen-mai" element={<PromotionsPage />} />
        <Route path="/gia-ve" element={<PricesPage />} />
        <Route path="/profile" element={<RequireAuth user={user}><ProfilePage user={user} /></RequireAuth>} />
        <Route
          path="/nhan-vien/checkin"
          element={
            <RequireRoles user={user} roles={["ADMIN", "NHAN_VIEN"]}>
              <StaffCheckinPage />
            </RequireRoles>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRoles user={user} roles={["ADMIN"]}>
            <AdminLayout user={user} onLogout={logout} />
          </RequireRoles>
        }
      >
        <Route index element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
