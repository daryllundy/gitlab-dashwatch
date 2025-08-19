import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { envCredentialsService, EnvCredentialsError, EnvCredentialsErrorType } from '@/services/envCredentialsService';
import { authLogger } from '@/services/authLogger';
import { roleService, type UserRoleInfo } from '@/services/roleService';
import type { EnvAccount, AuthenticationSource } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<void>;
  // Environment credential properties
  envAccounts: EnvAccount[];
  signInWithEnvAccount: (accountName: string) => Promise<boolean>;
  isEnvAuthEnabled: boolean;
  isEnvAutoSignInEnabled: boolean;
  isEnvFallbackAllowed: boolean;
  isEnvStrictMode: boolean;
  isEnvAuthReady: boolean;
  authenticationSource: AuthenticationSource | null;
  // Role-based access control
  userRoleInfo: UserRoleInfo;
  hasPermission: (permission: import('@/services/roleService').Permission) => boolean;
  canManageSettings: boolean;
  canViewSettings: boolean;
  canManageGitlab: boolean;
  canManageMonitoring: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [envAccounts, setEnvAccounts] = useState<EnvAccount[]>([]);
  const [isEnvAuthEnabled, setIsEnvAuthEnabled] = useState(false);
  const [isEnvAutoSignInEnabled, setIsEnvAutoSignInEnabled] = useState(false);
  const [isEnvFallbackAllowed, setIsEnvFallbackAllowed] = useState(true);
  const [isEnvStrictMode, setIsEnvStrictMode] = useState(false);
  const [authenticationSource, setAuthenticationSource] = useState<AuthenticationSource | null>(null);
  const [autoSignInAttempted, setAutoSignInAttempted] = useState(false);
  const [userRoleInfo, setUserRoleInfo] = useState<UserRoleInfo>(() => 
    roleService.getUserRoleInfo(null, null)
  );
  const { toast } = useToast();

  /**
   * Update user role information based on current authentication state
   */
  const updateUserRoleInfo = (
    currentUser: User | null,
    currentAuthSource: AuthenticationSource | null
  ) => {
    let envAccount: EnvAccount | undefined;
    
    // Get environment account if authenticated via environment
    if (currentAuthSource?.method === 'environment' && currentAuthSource.accountName) {
      try {
        envAccount = envCredentialsService.getAccountByName(currentAuthSource.accountName) || undefined;
      } catch (error) {
        console.warn('Failed to get environment account for role info:', error);
      }
    }
    
    const roleInfo = roleService.getUserRoleInfo(currentUser, currentAuthSource, envAccount);
    setUserRoleInfo(roleInfo);
    
    // Log role assignment for audit purposes
    if (currentUser) {
      console.log(`User role assigned: ${roleInfo.role}`, {
        isEnvironmentAccount: roleInfo.isEnvironmentAccount,
        accountName: roleInfo.accountName,
        permissions: roleInfo.permissions.length
      });
    }
  };

  useEffect(() => {
    // Initialize environment credentials service
    const initializeEnvCredentials = () => {
      try {
        envCredentialsService.initialize();
        
        // Check for initialization errors
        const initError = envCredentialsService.getInitializationError();
        if (initError) {
          console.warn('Environment credentials initialization had errors:', initError.message);
          toast({
            title: "Environment Authentication Warning",
            description: getErrorMessage(initError),
            variant: "default",
          });
        }
        
        const config = envCredentialsService.loadConfiguration();
        
        // Validate credentials and show warnings if needed
        const validation = envCredentialsService.validateCredentials();
        if (!validation.isValid && validation.errors.length > 0) {
          const errorMessages = validation.errors.map(err => getErrorMessage(err));
          console.warn('Environment credentials validation warnings:', errorMessages);
          
          // Show a summary warning to the user
          toast({
            title: "Environment Authentication Issues",
            description: `Found ${validation.errors.length} configuration issue(s). Check console for details.`,
            variant: "default",
          });
        }
        
        setEnvAccounts(envCredentialsService.getAvailableAccounts());
        setIsEnvAuthEnabled(config.enabled);
        setIsEnvAutoSignInEnabled(config.autoSignIn);
        setIsEnvFallbackAllowed(config.allowFallback);
        setIsEnvStrictMode(config.strictMode);
        
        return config;
      } catch (error) {
        const sanitizedError = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize environment credentials:', sanitizedError);
        
        toast({
          title: "Environment Authentication Error",
          description: "Failed to initialize environment authentication. Manual sign-in is still available.",
          variant: "destructive",
        });
        
        setEnvAccounts([]);
        setIsEnvAuthEnabled(false);
        setIsEnvAutoSignInEnabled(false);
        setIsEnvFallbackAllowed(true);
        setIsEnvStrictMode(false);
        return { enabled: false, autoSignIn: false, accounts: [], allowFallback: true, strictMode: false };
      }
    };

    // Get initial session and handle auto sign-in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Initialize environment credentials
      const config = initializeEnvCredentials();
      
      // If no session and auto sign-in is enabled, try environment account (only once)
      if (!session && !autoSignInAttempted && config.enabled && config.autoSignIn && config.accounts.length > 0) {
        setAutoSignInAttempted(true);
        
        try {
          const defaultAccount = envCredentialsService.getDefaultAccount();
          if (defaultAccount) {
            const startTime = Date.now();
            
            // Log auto sign-in attempt
            authLogger.logAutoSignInAttempt(defaultAccount.name);
            console.log('Attempting auto sign-in with environment account');
            
            const { data, error } = await supabase.auth.signInWithPassword({
              email: defaultAccount.email,
              password: defaultAccount.password,
            });

            const duration = Date.now() - startTime;

            if (!error && data.session) {
              setAuthenticationSource({
                method: 'environment',
                accountName: defaultAccount.name,
                timestamp: new Date(),
              });
              
              // Log successful auto sign-in
              authLogger.logAutoSignInSuccess(defaultAccount.name, duration);
              console.log(`Auto sign-in successful with environment account: ${defaultAccount.name}`);
              
              // Update session state immediately to prevent re-triggering
              setSession(data.session);
              setUser(data.session.user);
              
              // Update role info for environment authentication
              const newAuthSource = {
                method: 'environment' as const,
                accountName: defaultAccount.name,
                timestamp: new Date(),
              };
              setAuthenticationSource(newAuthSource);
              updateUserRoleInfo(data.session.user, newAuthSource);
            } else {
              const errorType = error?.message.includes('Invalid login credentials') ? 'invalid_credentials' : 'auth_error';
              
              // Log auto sign-in failure
              authLogger.logAutoSignInFailure(defaultAccount.name, errorType, duration);
              authLogger.logFallbackToManual('auto_signin_failed');
              
              console.log('Auto sign-in failed, continuing with manual auth');
              
              // Log the failure reason without exposing credentials
              if (error) {
                console.warn('Auto sign-in authentication error:', {
                  accountName: defaultAccount.name,
                  errorType,
                  timestamp: new Date().toISOString()
                });
              }
            }
          } else {
            authLogger.logFallbackToManual('no_default_account');
            console.warn('Auto sign-in enabled but no default account available');
          }
        } catch (error) {
          const sanitizedError = error instanceof Error ? error.message : 'Unknown error';
          
          // Log auto sign-in error
          authLogger.logAutoSignInFailure('unknown', 'unexpected_error');
          authLogger.logFallbackToManual('auto_signin_error');
          
          console.error('Auto sign-in error:', {
            error: sanitizedError,
            timestamp: new Date().toISOString()
          });
          
          // Don't show toast for auto sign-in failures to avoid disrupting user experience
          // Just log and continue with manual authentication
        }
      }
      
      setIsLoading(false);
      
      // Update role info after session is loaded
      updateUserRoleInfo(session?.user ?? null, null);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          // Log session restoration if this is not a fresh sign-in
          if (authenticationSource) {
            authLogger.logSessionRestored(authenticationSource);
          }
          
          // Update role info for session restoration
          updateUserRoleInfo(session?.user ?? null, authenticationSource);
          
          toast({
            title: "Signed in successfully",
            description: "Welcome back! Your settings will now be saved.",
          });
        } else if (event === 'SIGNED_OUT') {
          // Log sign out
          authLogger.logSignOut(authenticationSource);
          
          toast({
            title: "Signed out",
            description: "You've been signed out. Settings will not be saved.",
          });
          // Clear authentication source on sign out
          setAuthenticationSource(null);
          // Reset role info to guest
          updateUserRoleInfo(null, null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      setIsLoading(true);
      
      // Log manual sign-in attempt
      authLogger.logManualSignInAttempt();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const duration = Date.now() - startTime;

      if (error) {
        const errorType = error.message.includes('Invalid login credentials') ? 'invalid_credentials' : 'auth_error';
        
        // Log manual sign-in failure
        authLogger.logManualSignInFailure(errorType, duration);
        
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Log manual sign-in success
      authLogger.logManualSignInSuccess(duration);

      // Set authentication source for manual sign-in
      const newAuthSource = {
        method: 'manual' as const,
        timestamp: new Date(),
      };
      setAuthenticationSource(newAuthSource);
      
      // Update role info for manual authentication
      // Note: user will be set by the auth state change listener
      // We'll update role info there to ensure we have the user object

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log unexpected error
      authLogger.logManualSignInFailure('unexpected_error', duration);
      
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'github' | 'google'): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Log OAuth attempt
      authLogger.logOAuthAttempt(provider);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        const errorType = error.message.includes('Invalid') ? 'invalid_request' : 'oauth_error';
        
        // Log OAuth failure
        authLogger.logOAuthFailure(provider, errorType);
        
        toast({
          title: "OAuth sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Log OAuth success (actual success will be logged in auth state change)
        authLogger.logOAuthSuccess(provider);
      }
    } catch (error) {
      // Log unexpected OAuth error
      authLogger.logOAuthFailure(provider, 'unexpected_error');
      
      toast({
        title: "OAuth sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEnvAccount = async (accountName: string): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      setIsLoading(true);
      
      // Log environment sign-in attempt
      authLogger.logEnvSignInAttempt(accountName);
      
      // Get the account from the service
      let account: EnvAccount | null;
      try {
        account = envCredentialsService.getAccountByName(accountName);
        if (!account) {
          throw new EnvCredentialsError(
            EnvCredentialsErrorType.ACCOUNT_NOT_FOUND,
            `Account "${accountName}" is not configured`
          );
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error instanceof EnvCredentialsError) {
          // Log environment sign-in failure
          authLogger.logEnvSignInFailure(accountName, error.type, duration);
          
          const errorMessage = getErrorMessage(error);
          toast({
            title: "Environment Account Error",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          // Log unexpected error
          authLogger.logEnvSignInFailure(accountName, 'account_retrieval_error', duration);
          
          toast({
            title: "Environment Account Error",
            description: "Failed to retrieve environment account configuration",
            variant: "destructive",
          });
        }
        return false;
      }

      // Use the existing signIn method with environment credentials
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      const duration = Date.now() - startTime;

      if (error) {
        const errorType = error.message.includes('Invalid login credentials') ? 'invalid_credentials' : 'auth_error';
        
        // Log environment sign-in failure
        authLogger.logEnvSignInFailure(accountName, errorType, duration);
        
        // Handle different types of authentication errors
        let errorTitle = "Environment Sign In Failed";
        let errorDescription = "Failed to authenticate with environment account";
        
        if (error.message.includes('Invalid login credentials')) {
          errorDescription = "The environment account credentials are invalid. Please check your configuration.";
        } else if (error.message.includes('Email not confirmed')) {
          errorDescription = "The environment account email needs to be confirmed before signing in.";
        } else if (error.message.includes('Too many requests')) {
          errorDescription = "Too many sign-in attempts. Please try again later.";
        } else if (error.message.includes('Network')) {
          errorDescription = "Network error occurred. Please check your connection and try again.";
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
        
        // Log sanitized error for debugging (no credentials)
        console.error('Environment authentication failed:', {
          accountName,
          errorType,
          timestamp: new Date().toISOString()
        });
        
        return false;
      }

      // Log environment sign-in success
      authLogger.logEnvSignInSuccess(accountName, duration);

      // Set authentication source
      const newAuthSource = {
        method: 'environment' as const,
        accountName: account.name,
        timestamp: new Date(),
      };
      setAuthenticationSource(newAuthSource);
      
      // Update role info for environment authentication
      // Note: user will be set by the auth state change listener
      // We'll update role info there to ensure we have the user object

      console.log(`Successfully signed in with environment account: ${account.name}`);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log unexpected error
      authLogger.logEnvSignInFailure(accountName, 'unexpected_error', duration);
      
      // Handle unexpected errors
      const sanitizedError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Environment sign-in error:', {
        accountName,
        error: sanitizedError,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Environment Sign In Failed",
        description: "An unexpected error occurred during environment authentication. Please try manual sign-in.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user-friendly error message from EnvCredentialsError
   */
  const getErrorMessage = (error: EnvCredentialsError): string => {
    switch (error.type) {
      case EnvCredentialsErrorType.ACCOUNT_NOT_FOUND:
        return "The requested environment account is not configured or available.";
      case EnvCredentialsErrorType.INVALID_CONFIGURATION:
        return "Environment account configuration is invalid. Please check your settings.";
      case EnvCredentialsErrorType.SECURITY_VIOLATION:
        return "Environment account configuration has security issues. Please review your setup.";
      case EnvCredentialsErrorType.VALIDATION_FAILED:
        return "Failed to validate environment account configuration.";
      case EnvCredentialsErrorType.INITIALIZATION_FAILED:
        return "Environment authentication system failed to initialize properly.";
      default:
        return "An error occurred with environment authentication.";
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    // Environment credential properties
    envAccounts,
    signInWithEnvAccount,
    isEnvAuthEnabled,
    isEnvAutoSignInEnabled,
    isEnvFallbackAllowed,
    isEnvStrictMode,
    isEnvAuthReady: envCredentialsService.isReady(),
    authenticationSource,
    // Role-based access control
    userRoleInfo,
    hasPermission: (permission: import('@/services/roleService').Permission) => 
      roleService.hasPermission(userRoleInfo, permission),
    canManageSettings: roleService.canManageSettings(userRoleInfo),
    canViewSettings: roleService.canViewSettings(userRoleInfo),
    canManageGitlab: roleService.canManageGitlab(userRoleInfo),
    canManageMonitoring: roleService.canManageMonitoring(userRoleInfo),
    isAdmin: roleService.isAdmin(userRoleInfo),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
