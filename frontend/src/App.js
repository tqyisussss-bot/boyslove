import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Browse from "@/pages/Browse";
import SeriesDetail from "@/pages/SeriesDetail";
import Watch from "@/pages/Watch";
import MyList from "@/pages/MyList";
import Admin from "@/pages/Admin";
import "@/App.css";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="animate-pulse text-sm tracking-[0.3em] uppercase text-neutral-500">Cargando…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/home" replace />;
  return children;
};

const AppRouter = () => {
  const location = useLocation();
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
      <Route path="/series/:id" element={<ProtectedRoute><SeriesDetail /></ProtectedRoute>} />
      <Route path="/watch/:episodeId" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
      <Route path="/mylist" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
