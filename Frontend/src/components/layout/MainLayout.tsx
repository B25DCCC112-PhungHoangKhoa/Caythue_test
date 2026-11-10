import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ClipboardList,
  Sparkles,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                CayGame
                <span className="text-xs px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 font-bold">
                  Pro
                </span>
              </span>
              <span className="text-[11px] block text-slate-500 font-medium">
                Dịch vụ cày rank uy tín
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              to="/"
              className={`text-sm font-semibold transition-colors ${
                isActive('/') ? 'text-orange-600 font-bold' : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              Trang chủ
            </Link>

            <a
              href="#services-section"
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/#services-section');
                }
              }}
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
            >
              Dịch vụ cày rank
            </a>

            <Link
              to="/orders"
              className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                location.pathname.startsWith('/orders')
                  ? 'text-orange-600 font-bold'
                  : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-slate-400" />
              Tra cứu đơn hàng
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Quản trị admin
              </Link>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/orders"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors active:bg-rose-100 disabled:opacity-50"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-orange-500"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 active:bg-slate-100 disabled:opacity-50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-5 space-y-2 shadow-lg">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              Trang chủ
            </Link>
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Đơn hàng & tra cứu
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50"
              >
                Quản trị admin
              </Link>
            )}
            <div className="pt-3 border-t border-slate-200">
              {isAuthenticated ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-600 font-semibold hover:underline active:opacity-75 disabled:opacity-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-bold rounded-xl bg-orange-600 text-white"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-base text-slate-900">
                  CayGame Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống dịch vụ cày rank, kéo rank chuyên nghiệp hàng đầu. Cam kết bảo mật an toàn với VPN sạch và hỗ trợ 24/7.
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Hoàn tiền 100% nếu vi phạm cam kết</span>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Tựa game hỗ trợ
              </h2>
              <ul className="space-y-2 text-xs font-normal text-slate-500">
                <li className="hover:text-orange-600 cursor-pointer transition-colors">• Đấu Trường Chân Lý (TFT)</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">• Liên Quân Mobile (AOV)</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">• Liên Minh Huyền Thoại (LoL)</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">• Valorant & CS2 Premier</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">• Dota 2 & LMHT Tốc Chiến</li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Cam kết dịch vụ
              </h2>
              <ul className="space-y-2.5 text-xs text-slate-600 font-normal">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Bảo mật tài khoản bằng VPN riêng sạch</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Booster trình độ Thách Đấu / Radiant</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Tùy chọn đặt lịch cày & chọn tướng</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Tra cứu tiến độ đơn hàng thời gian thực</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Thanh toán tự động
              </h2>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Hệ thống quét mã VietQR tự động qua Mobile Banking 24/7 với nội dung chuyển khoản riêng cho từng đơn.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Cổng VietQR tự động
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>© {new Date().getFullYear()} CayGame Pro. Nền tảng dịch vụ game uy tín.</span>
            <span>Hỗ trợ nhanh chóng qua Hotline / Zalo</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
