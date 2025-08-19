import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Settings, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common';
import { envCredentialsService } from '@/services/envCredentialsService';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedEnvAccount, setSelectedEnvAccount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [envAuthError, setEnvAuthError] = useState<string | null>(null);
  const [showEnvFallback, setShowEnvFallback] = useState(false);
  const { 
    signIn, 
    signUp, 
    signInWithOAuth, 
    signInWithEnvAccount,
    isLoading,
    envAccounts,
    isEnvAuthEnabled,
    isEnvFallbackAllowed,
    isEnvStrictMode,
    isEnvAuthReady,
    authenticationSource
  } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const success = await signIn(email, password);
    if (success) {
      onOpenChange(false);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const success = await signUp(email, password);
    if (success) {
      // Don't close dialog immediately for sign up
      setEmail('');
      setPassword('');
      setSelectedEnvAccount('');
    }
    setIsSubmitting(false);
  };

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    await signInWithOAuth(provider);
  };

  const handleEnvAccountSignIn = async () => {
    if (!selectedEnvAccount) return;

    setIsSubmitting(true);
    setEnvAuthError(null);
    
    try {
      const success = await signInWithEnvAccount(selectedEnvAccount);
      if (success) {
        onOpenChange(false);
        setSelectedEnvAccount('');
        setEnvAuthError(null);
        setShowEnvFallback(false);
      } else {
        // Show fallback options when environment auth fails
        setEnvAuthError('Environment authentication failed. You can try manual sign-in below.');
        setShowEnvFallback(true);
      }
    } catch (error) {
      setEnvAuthError('Environment authentication encountered an error. Please try manual sign-in.');
      setShowEnvFallback(true);
    }
    
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setSelectedEnvAccount('');
    setEnvAuthError(null);
    setShowEnvFallback(false);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Check environment credentials health when dialog opens
  useEffect(() => {
    if (open && isEnvAuthEnabled) {
      const validation = envCredentialsService.validateCredentials();
      if (!validation.isValid && validation.errors.length > 0) {
        setEnvAuthError('Environment authentication has configuration issues. Manual sign-in is recommended.');
      }
    }
  }, [open, isEnvAuthEnabled]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Loading..." />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Authentication Required
            {authenticationSource && (
              <Badge variant="outline" className="text-xs">
                {authenticationSource.method === 'environment' ? (
                  <>
                    <Settings className="w-3 h-3 mr-1" />
                    Environment
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 mr-1" />
                    Manual
                  </>
                )}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Sign in to save your monitoring settings and access personalized features.
          </DialogDescription>
        </DialogHeader>

        {/* Environment Account Section - Only show if enabled and ready */}
        {isEnvAuthEnabled && isEnvAuthReady && envAccounts.length > 0 && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Environment Accounts</Label>
                <Badge variant="secondary" className="text-xs">
                  {envAccounts.length} available
                </Badge>
                {envCredentialsService.hasErrors() && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Issues
                  </Badge>
                )}
              </div>
              
              {/* Environment Auth Error Alert */}
              {envAuthError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {envAuthError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="env-account-select">Select Account</Label>
                  <Select 
                    value={selectedEnvAccount} 
                    onValueChange={setSelectedEnvAccount}
                    disabled={envCredentialsService.hasErrors()}
                  >
                    <SelectTrigger id="env-account-select">
                      <SelectValue placeholder={
                        envCredentialsService.hasErrors() 
                          ? "Environment auth has issues" 
                          : "Choose an environment account"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {envAccounts.map((account) => (
                        <SelectItem key={account.name} value={account.name}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {account.displayName || account.name}
                            </span>
                            {account.role && (
                              <Badge variant="outline" className="text-xs">
                                {account.role}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleEnvAccountSignIn}
                  disabled={!selectedEnvAccount || isSubmitting || envCredentialsService.hasErrors()}
                  className="w-full"
                  variant="default"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Sign In with Environment Account
                    </>
                  )}
                </Button>
                
                {/* Success indicator for environment auth */}
                {!envCredentialsService.hasErrors() && !envAuthError && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Environment authentication is ready
                  </div>
                )}
              </div>
            </div>

            {/* Only show separator and manual auth option if fallback is allowed */}
            {isEnvFallbackAllowed && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {showEnvFallback ? "Try manual authentication" : "Or use manual authentication"}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Environment Auth Status Alerts */}
        {isEnvAuthEnabled && !isEnvAuthReady && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Environment authentication is enabled but not properly configured. 
              {isEnvFallbackAllowed ? " Manual sign-in is available below." : " Please contact your administrator."}
            </AlertDescription>
          </Alert>
        )}

        {!isEnvAuthEnabled && envCredentialsService.hasErrors() && (
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Environment authentication is disabled due to configuration issues. 
              {isEnvFallbackAllowed ? " Manual sign-in is available below." : " Please contact your administrator."}
            </AlertDescription>
          </Alert>
        )}

        {/* Strict Mode Warning */}
        {isEnvStrictMode && !isEnvFallbackAllowed && !isEnvAuthReady && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Environment authentication is required but not available. Please contact your administrator to resolve configuration issues.
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Authentication - Only show if fallback is allowed or env auth is not enabled */}
        {(isEnvFallbackAllowed || !isEnvAuthEnabled) && (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Choose a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        )}

        {/* OAuth Section - Only show if fallback is allowed or env auth is not enabled */}
        {(isEnvFallbackAllowed || !isEnvAuthEnabled) && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('github')}
                disabled={isSubmitting}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
          </>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Your data is securely stored with Supabase.
            <br />
            No personal information is collected beyond your email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
