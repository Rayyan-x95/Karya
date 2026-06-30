import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Containers';
import { KaryaLogo } from '../ui/KaryaLogo';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  breadcrumbs: string[];
}

const NAV_ITEMS = [
  { id: 'dashboard', name: 'Workspace', short: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'clients', name: 'Clients', short: 'Clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'projects', name: 'Projects', short: 'Projects', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'invoices', name: 'Invoices', short: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'payments', name: 'Payments', short: 'Pay', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'settings', name: 'Settings', short: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentView,
  onViewChange,
  breadcrumbs,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1] || 'Workspace';

  const NavButton = ({ item, mobile = false }: { item: typeof NAV_ITEMS[0]; mobile?: boolean }) => {
    const isActive = currentView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          onViewChange(item.id);
          if (mobile) setMobileMenuOpen(false);
        }}
        title={item.name}
        className={`group relative flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-body transition-colors duration-[120ms] ${
          isActive
            ? 'bg-primary-muted text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface'
        }`}
      >
        <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
        </svg>
        {(expanded || mobile) && <span className="truncate">{item.name}</span>}
        {isActive && !expanded && !mobile && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" aria-hidden="true" />
        )}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop icon rail */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-background section-divider border-r-0 transition-[width] duration-[200ms] ease-out ${
          expanded ? 'w-[220px]' : 'w-[52px]'
        }`}
        style={{ borderRight: '1px solid hsl(var(--border-subtle))' }}
      >
        <div className="flex h-14 items-center px-3.5 shrink-0">
          <KaryaLogo size={24} className="shrink-0" />
          {expanded && (
            <span className="ml-3 font-display font-semibold text-body text-foreground truncate animate-fade-in">
              Karya
            </span>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
          {NAV_ITEMS.map(item => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>

        <div className="px-2 py-3 space-y-0.5 shrink-0" style={{ borderTop: '1px solid hsl(var(--border-subtle))' }}>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              {theme === 'dark' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
            {expanded && <span className="text-body">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
          </button>
          <div className={`flex items-center gap-2.5 px-2.5 py-2 ${expanded ? '' : 'justify-center'}`}>
            <Avatar name="Rohan Sharma" size="sm" />
            {expanded && (
              <div className="min-w-0 animate-fade-in">
                <p className="text-small font-medium text-foreground truncate m-0">Rohan Sharma</p>
                <p className="text-[11px] text-muted-foreground truncate m-0">freelancer@karya.in</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[52px]">
        <header
          className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 md:px-8 bg-background/95"
          style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-surface text-muted-foreground"
              aria-label="Open navigation"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-title font-display font-semibold text-foreground m-0 truncate">{pageTitle}</h1>
              {breadcrumbs.length > 1 && (
                <nav className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5" aria-label="Breadcrumb">
                  {breadcrumbs.slice(0, -1).map((crumb, idx) => (
                    <React.Fragment key={crumb}>
                      {idx > 0 && <span aria-hidden="true">/</span>}
                      <span>{crumb}</span>
                    </React.Fragment>
                  ))}
                </nav>
              )}
            </div>
          </div>

          <button
            className="hidden sm:flex items-center gap-2 h-8 px-3 text-small text-muted-foreground bg-surface rounded-md hover:bg-accent transition-colors"
            aria-label="Search or command palette"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-secondary rounded text-muted-foreground font-mono">⌘K</kbd>
          </button>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8 overflow-y-auto">
          <div className="page-container mx-auto animate-slide-up">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-overlay/70" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-background animate-slide-up">
            <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
              <div className="flex items-center gap-2.5">
                <KaryaLogo size={24} />
                <span className="font-display font-semibold text-body">Karya</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-md hover:bg-surface text-muted-foreground" aria-label="Close navigation">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map(item => (
                <NavButton key={item.id} item={item} mobile />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile bottom bar */}
      <nav
        className="fixed bottom-0 inset-x-0 h-16 md:hidden flex items-stretch justify-around bg-background z-20"
        style={{ borderTop: '1px solid hsl(var(--border-subtle))' }}
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.slice(0, 5).map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span>{item.short}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
