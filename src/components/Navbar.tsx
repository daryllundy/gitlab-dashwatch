
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Settings } from 'lucide-react';

const Navbar = () => {
  const [darkMode, setDarkMode] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
          
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted sm:hidden"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>


      </div>
    </header>
  );
};

export default Navbar;
