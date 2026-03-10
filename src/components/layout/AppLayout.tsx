import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleImportClick = () => {
    // Dispatch a custom event that Dashboard listens to
    window.dispatchEvent(new CustomEvent('irts:open-import'));
  };

  const handleExportClick = () => {
    window.dispatchEvent(new CustomEvent('irts:open-export'));
  };

  return (
    <div className="min-h-screen bg-shine-bg">
      <Sidebar
        onImportClick={handleImportClick}
        onExportClick={handleExportClick}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-shine-border">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-shine-hover-bg text-shine-text-secondary"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-shine-text-primary">IRTS</span>
      </div>

      {/* Main content */}
      <main className="lg:ml-[250px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
