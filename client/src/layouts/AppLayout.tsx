import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  UploadCloud,
  PieChart,
  Target,
  ShieldAlert,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FloatingAIAssistant } from '../components/ai/FloatingAIAssistant';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isSettingsPage = location.pathname.startsWith('/app/settings') || location.pathname.includes('/settings');

  const navItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', path: '/app/transactions', icon: ReceiptText },
    { label: 'Import Statement', path: '/app/import', icon: UploadCloud },
    { label: 'Analytics', path: '/app/analytics', icon: PieChart },
    { label: 'Budgets', path: '/app/budgets', icon: Target },
    { label: 'Subscriptions', path: '/app/subscriptions', icon: Layers },
    { label: 'Anomalies', path: '/app/anomalies', icon: ShieldAlert },
    { label: 'Explain Finances', path: '/app/insights', icon: Sparkles },
    { label: 'Security & Settings', path: '/app/settings/security', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] transition-all duration-300 ease-in-out flex flex-col justify-between z-30 sticky top-0 h-screen shadow-xl`}
      >
        <div>
          {/* Brand Header */}
          <div className={`h-16 flex items-center border-b border-[var(--border-color)] ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src="/logo.png"
                    alt="Financial Flow"
                    className="w-8 h-8 rounded-lg object-contain shadow-md shadow-blue-500/20 border border-[var(--border-color)]"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] leading-tight">
                    Financial Flow
                  </span>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">
                    Intelligence v2.0
                  </span>
                </div>
              </div>
            ) : (
              <img
                src="/logo.png"
                alt="Financial Flow"
                className="w-8 h-8 rounded-lg object-contain shadow-md shadow-blue-500/20 border border-[var(--border-color)]"
              />
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition ${collapsed ? 'hidden' : 'ml-auto'}`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          {collapsed && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Nav Section Label */}
          {!collapsed && (
            <div className="px-4 pt-4 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Platform Navigation
              </span>
            </div>
          )}

          {/* Nav Links */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/10 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/25 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Settings Area */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar-footer)]">
          <div className="flex items-center justify-between px-1">
            {!collapsed && (
              <div className="flex items-center gap-2.5 truncate max-w-[140px]">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm flex items-center justify-center font-bold text-xs text-[var(--text-primary)] flex-shrink-0">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="text-xs truncate">
                  <div className="font-semibold text-[var(--text-primary)] truncate leading-tight">{user?.fullName || 'User'}</div>
                  <div className="truncate text-[10px] text-[var(--text-muted)]">{user?.email}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition border border-transparent hover:border-[var(--border-color)]"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/auth/login');
                }}
                className="p-2 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-6 md:p-8 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Floating AI Assistant (hidden on settings page) */}
      {!isSettingsPage && <FloatingAIAssistant />}
    </div>
  );
};

export default AppLayout;
