import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Calendar,
  Upload,
  Download,
  UserCircle,
  Settings,
  LogOut,
  GraduationCap,
  X,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  onClick?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  onImportClick: () => void;
  onExportClick: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ onImportClick, onExportClick, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const sections: NavSection[] = [
    {
      title: 'Admissions',
      items: [
        { icon: Users, label: 'Candidatures', path: '/dashboard' },
        { icon: Calendar, label: 'Campagnes', path: '/campagnes' },
      ],
    },
    {
      title: 'Outils',
      items: [
        { icon: Upload, label: 'Importer', onClick: onImportClick },
        { icon: Download, label: 'Exporter', onClick: onExportClick },
      ],
    },
  ];

  const bottomItems: NavItem[] = [
    { icon: UserCircle, label: 'Mon profil', path: '/profile' },
    { icon: Settings, label: 'Parametres', path: '/settings' },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/candidat/');
    }
    return location.pathname === path;
  };

  const handleNavClick = (item: NavItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.onClick) {
      item.onClick();
    }
    onMobileClose?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-100">

      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0">
        <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-flat-fg leading-none tracking-tight">IRTS</p>
          <p className="text-[11px] text-flat-text-tertiary font-medium leading-none mt-0.5 uppercase tracking-wider">Admissions</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="section-label px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`nav-item ${active ? 'nav-item-active' : 'nav-item-default'}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-flat-text-tertiary'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="flex-shrink-0">
        {/* User Profile */}
        {user && (
          <div className="px-3 py-3">
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-gray-200 transition-all duration-200 cursor-pointer"
              onClick={() => { navigate('/profile'); onMobileClose?.(); }}
            >
              <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.prenom?.[0]}{user.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-flat-fg truncate leading-none">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-[11px] text-flat-text-tertiary truncate mt-0.5 leading-none font-medium">
                  {user.role || 'Evaluateur'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav Items */}
        <div className="px-3 py-3 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`nav-item ${active ? 'nav-item-active' : 'nav-item-default'}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-flat-text-tertiary'}`} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="nav-item w-full text-red-500 hover:bg-red-100 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Deconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[var(--sidebar-width,240px)] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] animate-slide-in-left">
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={onMobileClose}
                className="p-1.5 rounded-md hover:bg-gray-200 text-flat-text-secondary transition-all duration-200"
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
