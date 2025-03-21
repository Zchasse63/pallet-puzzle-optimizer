'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from 'sonner';

/**
 * Layout component for dashboard and related pages
 * Provides consistent navigation and structure
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useSupabase();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    { 
      name: 'Quotes', 
      href: '/dashboard/quotes', 
      icon: <FileText className="w-5 h-5" /> 
    },
    { 
      name: 'Products', 
      href: '/dashboard/products', 
      icon: <Package className="w-5 h-5" /> 
    },
    { 
      name: 'Profile', 
      href: '/profile', 
      icon: <User className="w-5 h-5" /> 
    },
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: <Settings className="w-5 h-5" /> 
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-5 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-semibold">Pallet Puzzle</span>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors relative ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t mt-auto">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-3 px-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
