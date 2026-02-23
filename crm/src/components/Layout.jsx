import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../lib/auth.jsx';
import { route } from 'preact-router';

export function Layout({ children }) {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/crm/'
  );

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function navigate(path) {
    setSidebarOpen(false);
    route(path);
    setCurrentPath(path);
  }

  const navItems = [
    { path: '/crm/', label: 'Dashboard', icon: '📊' },
    { path: '/crm/pipeline', label: 'Pipeline', icon: '🔀' },
    { path: '/crm/contacts', label: 'Kontakte', icon: '👥' },
    { path: '/crm/companies', label: 'Firmen', icon: '🏢' },
    { path: '/crm/invoices', label: 'Rechnungen', icon: '📄' },
    { path: '/crm/expenses', label: 'Ausgaben', icon: '💸' },
    { path: '/crm/reports', label: 'Berichte', icon: '📈' },
    { path: '/crm/campaigns', label: 'Kampagnen', icon: '📧' },
    { path: '/crm/settings', label: 'Einstellungen', icon: '⚙️' },
  ];

  return (
    <div class="app-layout">
      <button
        class="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside class={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div class="sidebar-brand" onClick={() => navigate('/crm/')} style="cursor:pointer">
          Beck360 CRM
        </div>
        <nav class="sidebar-nav">
          {navItems.map(item => (
            <a
              key={item.path}
              class={`nav-item ${(item.path === '/crm/' ? currentPath === '/crm/' : currentPath.startsWith(item.path)) ? 'active' : ''}`}
              href={item.path}
              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
            >
              <span class="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div class="sidebar-footer">
          <button
            class="btn btn-secondary btn-sm"
            style="width: 100%"
            onClick={signOut}
          >
            Abmelden
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main class="main-content">
        {children}
      </main>
    </div>
  );
}
