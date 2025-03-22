import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  PackageCheck, 
  FileText, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Pallet Puzzle</h2>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          <NavItem 
            to="/" 
            icon={<LayoutDashboard className="h-5 w-5" />} 
            label="Dashboard" 
            isActive={location.pathname === '/'} 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/products" 
            icon={<Package className="h-5 w-5" />} 
            label="Products" 
            isActive={location.pathname === '/products'} 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/optimizer" 
            icon={<PackageCheck className="h-5 w-5" />} 
            label="Optimizer" 
            isActive={location.pathname === '/optimizer'} 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/quotes" 
            icon={<FileText className="h-5 w-5" />} 
            label="Quotes" 
            isActive={location.pathname === '/quotes'} 
            onClick={closeSidebar}
          />
          <NavItem 
            to="/settings" 
            icon={<Settings className="h-5 w-5" />} 
            label="Settings" 
            isActive={location.pathname === '/settings'} 
            onClick={closeSidebar}
          />
        </nav>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
}