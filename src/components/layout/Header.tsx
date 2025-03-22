import { useLocation } from 'react-router-dom';
import { ModeToggle } from '../theme/mode-toggle';
import { Button } from '../ui/button';
import { UserNav } from './UserNav';
import { Bell } from 'lucide-react';

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/optimizer': 'Pallet Optimizer',
  '/quotes': 'Quotes',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || 'Not Found';

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-xl font-semibold">{pageName}</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}