import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// icons
import {
  LayoutDashboard,
  Calendar,
  Users,
  TrendingUp,
  Menu,
  ChevronLeft,
  LogOut,
  User,
  UserCog
} from 'lucide-react';

// context
import { useAuth } from '@/context/AuthContext';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import TimeFlowLogo from '@/assets/Logo.svg?react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize isCollapsed from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Save isCollapsed to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const employeeLinks = [
    { path: '/dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
    { path: '/schedule', label: 'Mon planning', Icon: Calendar },
    { path: '/profile', label: 'Mon profil', Icon: User },
  ];

  const managerLinks = [
    { path: '/dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
    { path: '/team', label: 'Mes équipes', Icon: Users },
    { path: '/users', label: 'Gestion des utilisateurs', Icon: UserCog },
    { path: '/reports', label: 'Rapports', Icon: TrendingUp },
    { path: '/schedule', label: 'Planning', Icon: Calendar },
    { path: '/profile', label: 'Mon profil', Icon: User },
  ];

  const navLinks = user?.role === 'Manager' ? managerLinks : employeeLinks;

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50"
        aria-label={isMobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={isMobileOpen}
        aria-controls="navigation-sidebar"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
          role="button"
          aria-label="Fermer le menu"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsMobileOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        id="navigation-sidebar"
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-card border-r z-40 transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        role="navigation"
        aria-label="Menu principal"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between min-h-[40px]">
              {!isCollapsed && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
                  aria-label="TimeFlow - Retour au tableau de bord"
                >
                  <TimeFlowLogo className='w-10 h-10' aria-hidden="true" />
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn("hidden lg:flex ml-auto", isCollapsed && "mx-auto")}
                aria-label={isCollapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
                aria-expanded={!isCollapsed}
              >
                <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", isCollapsed && "rotate-180")} aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Navigation principale">
            {navLinks.map((link) => {
              const Icon = link.Icon;
              const active = isActive(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? link.label : ''}
                  aria-label={link.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {!isCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t space-y-3" role="region" aria-label="Informations utilisateur">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-md bg-muted transition-all duration-300",
              isCollapsed ? "flex-col justify-center" : "flex-row"
            )}>
              <div className={cn(
                "rounded-full flex items-center justify-center font-bold flex-shrink-0",
                isCollapsed ? "display-none" : "w-12 h-12"
              )} aria-hidden="true">
                {/*{user?.first_name?.[0]}{user?.last_name?.[0]}*/}
              </div>
              {!isCollapsed && (
                <div className="text-left w-full min-w-0">
                  <p className="text-sm font-semibold truncate" aria-label={`Utilisateur: ${user?.first_name} ${user?.last_name}`}>
                    {user?.first_name} {user?.last_name}
                  </p>
                  <Badge variant={user?.role === 'Manager' ? 'outline' : 'outline'} className="mt-1" aria-label={`Rôle: ${user?.role}`}>
                    {user?.role}
                  </Badge>
                </div>
              )}
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className={cn("w-full transition-all duration-300", isCollapsed && "px-2")}
              aria-label="Se déconnecter de l'application"
            >
              <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-2")} aria-hidden="true" />
              {!isCollapsed && <span>Déconnexion</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
