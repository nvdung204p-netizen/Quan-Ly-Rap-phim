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
import EventDetailPage from "../pages/EventDetailPage";
import PromotionsPage from "../pages/PromotionsPage";
import PricesPage from "../pages/PricesPage";
import ProfilePage from "../pages/ProfilePage";
import GioiThieuPage from "../pages/GioiThieuPage";
import AdminPage from "../pages/AdminPage";
import StaffCheckinPage from "../pages/StaffCheckinPage";
import StaffHomePage from "../pages/StaffHomePage";
import StaffPOSPage from "../pages/StaffPOSPage";
import StaffOrdersPage from "../pages/StaffOrdersPage";
import StaffLayout from "../layouts/StaffLayout";

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
        <Route
          path="/dat-ve"
          element={
            <RequireAuth user={user}>
              <BookingPage />
            </RequireAuth>
          }
        />
        <Route path="/su-kien" element={<EventsPage />} />
        <Route path="/su-kien/:id" element={<EventDetailPage />} />
        <Route path="/khuyen-mai" element={<PromotionsPage />} />
        <Route path="/gia-ve" element={<PricesPage />} />
        <Route path="/gioi-thieu" element={<GioiThieuPage />} />
        <Route
          path="/profile"
          element={
            <RequireAuth user={user}>
              <ProfilePage user={user} setToken={setToken} />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        path="/nhan-vien"
        element={
          <RequireRoles user={user} roles={["ADMIN", "NHAN_VIEN"]}>
            <StaffLayout user={user} onLogout={logout} />
          </RequireRoles>
        }
      >
        <Route index element={<StaffHomePage user={user} />} />
        <Route path="checkin" element={<StaffCheckinPage />} />
        <Route path="pos" element={<StaffPOSPage />} />
        <Route path="don-hang" element={<StaffOrdersPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRoles user={user} roles={["ADMIN"]}>
            <AdminLayout user={user} onLogout={logout} />
          </RequireRoles>
        }
      >
        <Route index element={<AdminPage user={user} />} />
      </Route>
    </Routes>
  );
}
