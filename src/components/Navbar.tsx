
import React, { useState } from 'react';
import { Menu, X, Sun, Moon, GitBranch } from 'lucide-react';
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  current: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', current: true },
  { name: 'Projects', href: '/projects', current: false },
  { name: 'DNS', href: '/dns', current: false },
  { name: 'Uptime', href: '/uptime', current: false },
  { name: 'Servers', href: '/servers', current: false },
  { name: 'Settings', href: '/settings', current: false },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-4 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <GitBranch className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight">DashWatch</span>
            </a>
            <div className="hidden ml-10 space-x-8 lg:flex">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors", 
                    item.current 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 rounded-full text-muted-foreground hover:text-primary"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div
          className={`lg:hidden ${
            mobileMenuOpen ? 'block animate-fade-in' : 'hidden animate-fade-out'
          }`}
        >
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  item.current 
                    ? "bg-primary/5 text-primary" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
