import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Cpu,
  Database,
  History,
  LayoutDashboard,
  Menu,
  ScanEye,
  ScanSearch,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inspect', label: 'New Inspection', icon: ScanSearch },
  { to: '/history', label: 'Inspection History', icon: History },
  { to: '/dataset', label: 'Dataset Overview', icon: Database },
  { to: '/model', label: 'Model Information', icon: Cpu },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 py-5 transition-opacity hover:opacity-90"
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-aqua-500 shadow-[0_10px_30px_-14px_rgba(34,211,238,0.9)]">
          <ScanEye className="h-5 w-5 text-[#04121f]" strokeWidth={2.2} />
          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
        </span>
        <span className="leading-tight">
          <span className="block text-[13px] font-extrabold tracking-[0.16em] text-white">
            VISION INSPECT
          </span>
          <span className="block font-mono text-[10px] tracking-[0.32em] text-aqua/80">AI · v1.0</span>
        </span>
      </Link>

      <div className="mx-5 mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <nav className="flex-1 space-y-1 px-3">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-brand-500/20 to-transparent text-white'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-gradient-to-b from-brand-400 to-aqua-400" />
                ) : null}
                <item.icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-aqua' : 'text-slate-500 group-hover:text-slate-300',
                  )}
                />
                <span className="truncate">{item.label}</span>
                {item.to === '/inspect' ? (
                  <span className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[10px] text-slate-500">
                    ⌘N
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
          <div className="flex items-center gap-2 text-amber-300/90">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">Demo build</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            No model backend connected. All predictions are clearly labelled demo output.
          </p>
          <Link
            to="/model"
            onClick={onNavigate}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-300 hover:text-aqua"
          >
            Research workflow
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const TITLES: Record<string, { title: string; crumb: string }> = {
  '/': { title: 'Operations Dashboard', crumb: 'Dashboard' },
  '/inspect': { title: 'New Inspection', crumb: 'Inspection workstation' },
  '/history': { title: 'Inspection History', crumb: 'Records' },
  '/dataset': { title: 'Dataset Overview', crumb: 'VisA' },
  '/model': { title: 'Model Information', crumb: 'Research' },
  '/settings': { title: 'Settings', crumb: 'Configuration' },
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const meta = location.pathname.startsWith('/inspections/')
    ? { title: 'Analysis Results', crumb: 'Inspection detail' }
    : TITLES[location.pathname] ?? { title: 'Not Found', crumb: 'Unknown' };

  return (
    <div className="app-surface min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/[0.06] bg-[#060c18]/85 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-[#02060d]/75 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-[272px] border-r border-white/10 bg-[#060c18] transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050a14]/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/[0.06] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">
                <span>Console</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-500">{meta.crumb}</span>
              </div>
              <h1 className="truncate text-[15px] font-semibold text-white">{meta.title}</h1>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-200/90">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Demo mode
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Backend offline
              </span>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-brand-500/30 to-aqua-500/20 font-mono text-[11px] font-semibold text-white">
              CV
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
