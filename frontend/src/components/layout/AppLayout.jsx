import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar  from './TopBar';
import { useState } from 'react';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bgBase">
      {/* Desktop sidebar: visible on md+, hidden on small screens */}
      <Sidebar isDesktop className="hidden md:flex" onClose={() => setSidebarOpen(false)} />

      {/* Mobile drawer: shown when toggled */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onToggleSidebar={() => setSidebarOpen(s => !s)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
