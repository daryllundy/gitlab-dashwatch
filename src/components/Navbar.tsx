
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Settings, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu, AuthDialog } from '@/components/auth';

const Navbar = () => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canViewSettings } = useAuth();

  React.useEffect(() => {
    // Check if dark mode is already set
    const isDarkMode = document.documentElement.classList.contains('dark');
    setDarkMode(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="size-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-xl font-semibold text-primary-foreground">D</span>
            </div>
            <span className="text-lg font-semibold">DashWatch</span>
          </Link>
          
          <nav className="ml-10 hidden sm:flex space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Dashboard
            </Link>
            {canViewSettings && (
              <Link 
                to="/settings" 
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/settings' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Settings
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          {canViewSettings && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-md text-muted-foreground hover:bg-muted sm:hidden"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}

          {user ? (
            <UserMenu />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuthDialog(true)}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>

        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
      </div>
    </header>
  );
};

export default Navbar;
