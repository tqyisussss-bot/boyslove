import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Heart, LayoutDashboard, LogOut, Search, Home } from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav
      data-testid="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/60 border-b border-white/10"
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to={user ? "/home" : "/"} className="flex items-center gap-2" data-testid="nav-logo">
          <span className="font-heading text-xl font-black tracking-tight">
            <span className="text-white">BOYS</span>
            <span className="text-[#E07A8F]">·</span>
            <span className="text-white">LOVE</span>
          </span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-7 text-sm text-neutral-300">
            <Link to="/home" data-testid="nav-home" className="hover:text-white transition-colors flex items-center gap-2">
              <Home className="w-4 h-4" /> Inicio
            </Link>
            <Link to="/mylist" data-testid="nav-mylist" className="hover:text-white transition-colors flex items-center gap-2">
              <Heart className="w-4 h-4" /> Mi Lista
            </Link>
            {user.is_admin && (
              <Link to="/admin" data-testid="nav-admin" className="hover:text-white transition-colors flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Admin
              </Link>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-trigger" className="flex items-center gap-2 rounded-full p-1 hover:bg-white/5 transition-colors">
                  <Avatar className="h-9 w-9 ring-1 ring-white/10">
                    {user.picture && <AvatarImage src={user.picture} />}
                    <AvatarFallback className="bg-[#E07A8F] text-black font-bold">
                      {user.name?.[0]?.toUpperCase() || "B"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-neutral-950 border-white/10 text-white">
                <DropdownMenuLabel className="text-neutral-400 text-xs uppercase tracking-wider">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem data-testid="menu-home" onClick={() => navigate("/home")} className="cursor-pointer">
                  <Home className="w-4 h-4 mr-2" /> Inicio
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-mylist" onClick={() => navigate("/mylist")} className="cursor-pointer">
                  <Heart className="w-4 h-4 mr-2" /> Mi Lista
                </DropdownMenuItem>
                {user.is_admin && (
                  <DropdownMenuItem data-testid="menu-admin" onClick={() => navigate("/admin")} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Panel Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem data-testid="menu-logout" onClick={async () => { await logout(); navigate("/"); }} className="cursor-pointer text-[#E07A8F]">
                  <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              data-testid="nav-login-btn"
              className="rounded-full bg-white text-black px-5 py-2 text-sm font-semibold hover:bg-neutral-200 transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
