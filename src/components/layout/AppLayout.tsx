import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Upload,
  Download,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users,           label: 'Candidats', path: '/dashboard' },
  { icon: Calendar,        label: 'Campagnes', path: '/campagnes' },
  { icon: Settings,        label: 'Settings',  path: '/settings' },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/candidat/');
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleImport = () => {
    window.dispatchEvent(new CustomEvent('irts:open-import'));
  };

  const handleExport = () => {
    window.dispatchEvent(new CustomEvent('irts:open-export'));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top navbar (blue) ── */}
      <header className="bg-[#314ace] flex-shrink-0 z-30 sticky top-0">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">

          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
              onClick={() => navigate('/dashboard')}
            >
              <img src="/logo.png" alt="IRTS" className="h-10 w-10 object-contain rounded" />
              <span className="text-white font-extrabold text-base tracking-tight hidden sm:inline">
                IRTS Parcoursup
              </span>
            </div>
          </div>

          {/* Center: search bar */}
          <div className="hidden md:flex items-center bg-white/15 rounded-lg px-3 py-1.5 w-full max-w-md mx-auto hover:bg-white/20 transition-colors">
            <Search className="w-4 h-4 text-white/60 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un candidat, un INE..."
              className="bg-transparent text-sm text-white placeholder:text-white/50 outline-none w-full"
            />
          </div>

          {/* Right: campaign + bell + user */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#e6ff82] text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#d9f56e] transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Campagne 2024
            </div>

            <button
              type="button"
              className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-[10px] text-white/60 leading-none mt-0.5 uppercase tracking-wider">
                    Equipe pedagogique
                  </p>
                </div>
                <UserAvatar
                  src={user?.avatar}
                  prenom={user?.prenom}
                  nom={user?.nom}
                  size="md"
                  className="text-white border-2 border-white/30"
                />
                <ChevronDown className="w-3.5 h-3.5 text-white/50 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 py-1 z-50 shadow-lg">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={user?.avatar}
                          prenom={user?.prenom}
                          nom={user?.nom}
                          size="lg"
                          bgColor="bg-[#314ace]"
                          className="text-white"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{user?.prenom} {user?.nom}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-gray-50 transition-colors"
                    >
                      Mon profil
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-gray-50 transition-colors"
                    >
                      Parametres
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Deconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Sub-nav tabs (beige zone with green active underline) ── */}
      <div className="bg-[#f5f0e8] border-b border-[#e8e0d0] flex-shrink-0">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-0">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const active = isActive(path);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`
                    relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors
                    ${active
                      ? 'text-primary-600'
                      : 'text-slate-400 hover:text-slate-600'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#e6ff82] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 hover:bg-white/60 rounded-md transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Importer
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 hover:bg-white/60 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-bold text-slate-800">Menu</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { navigate(path); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(path) ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
              <div className="h-px bg-gray-100 my-2" />
              <button
                type="button"
                onClick={() => { handleImport(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-gray-50"
              >
                Importer des dossiers
              </button>
              <button
                type="button"
                onClick={() => { handleExport(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-gray-50"
              >
                Exporter les resultats
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-between px-6 py-4 text-[11px] text-slate-400 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <span>&copy; {new Date().getFullYear()} IRTS Parmentier</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Compliance RGPD active
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Support Technique</span>
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Mentions Legales</span>
        </div>
      </footer>
    </div>
  );
}
