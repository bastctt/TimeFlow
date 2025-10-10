import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    { path: '/team', label: 'Mon équipe', Icon: Users },
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
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-card border-r z-40 transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between min-h-[40px]">
              {!isCollapsed && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
                >
                  <TimeFlowLogo className='w-10 h-10'/>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn("hidden lg:flex ml-auto", isCollapsed && "mx-auto")}
              >
                <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t space-y-3">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-md bg-muted transition-all duration-300",
              isCollapsed ? "flex-col justify-center" : "flex-row"
            )}>
              <div className={cn(
                "rounded-full flex items-center justify-center font-bold flex-shrink-0",
                isCollapsed ? "display-none" : "w-12 h-12"
              )}>
                {/*{user?.first_name?.[0]}{user?.last_name?.[0]}*/}
              </div>
              {!isCollapsed && (
                <div className="text-left w-full min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <Badge variant={user?.role === 'Manager' ? 'outline' : 'outline'} className="mt-1">
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
            >
              <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>Déconnexion</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
