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
      title: 'ADMISSIONS',
      items: [
        { icon: Users, label: 'Candidatures', path: '/dashboard' },
      ],
    },
    {
      title: 'GESTION',
      items: [
        { icon: Calendar, label: 'Campagnes', path: '/campagnes' },
        { icon: Upload, label: 'Import', onClick: onImportClick },
        { icon: Download, label: 'Export', onClick: onExportClick },
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
    <div className="flex flex-col h-full bg-white border-r border-shine-border">
      {/* Logo + User */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-shine-text-primary">IRTS</p>
            <p className="text-xs text-shine-text-tertiary">Espace Admissions</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-shine-hover-bg">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {user.prenom?.[0]}{user.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-shine-text-primary truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-shine-text-tertiary truncate">
                {user.role || 'Evaluateur'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-shine-border mx-5" />

      {/* Navigation sections */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-shine-text-section uppercase tracking-widest">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${active
                        ? 'bg-primary-50 text-primary-500'
                        : 'text-shine-text-secondary hover:bg-shine-hover-bg hover:text-shine-text-primary'
                      }
                    `}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-shine-border px-3 py-3 space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${active
                  ? 'bg-primary-50 text-primary-500'
                  : 'text-shine-text-secondary hover:bg-shine-hover-bg hover:text-shine-text-primary'
                }
              `}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-red-500 hover:bg-red-50 transition-colors duration-150"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Deconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[250px] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] animate-slide-in-left">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg hover:bg-shine-hover-bg text-shine-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
