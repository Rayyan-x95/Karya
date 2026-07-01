import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthLayout } from './components/layout/AuthLayout';

// Templates
// Lazy-loaded Templates
const DashboardTemplate = React.lazy(() => import('./components/templates/DashboardTemplate').then(m => ({ default: m.DashboardTemplate })));
const ClientsTemplate = React.lazy(() => import('./components/templates/ClientsTemplate').then(m => ({ default: m.ClientsTemplate })));
const ProjectsTemplate = React.lazy(() => import('./components/templates/ProjectsTemplate').then(m => ({ default: m.ProjectsTemplate })));
const ProjectDetailsTemplate = React.lazy(() => import('./components/templates/ProjectDetailsTemplate').then(m => ({ default: m.ProjectDetailsTemplate })));
const InvoicesTemplate = React.lazy(() => import('./components/templates/InvoicesTemplate').then(m => ({ default: m.InvoicesTemplate })));
const SettingsTemplate = React.lazy(() => import('./components/templates/SettingsTemplate').then(m => ({ default: m.SettingsTemplate })));
const PaymentsTemplate = React.lazy(() => import('./components/templates/PaymentsTemplate').then(m => ({ default: m.PaymentsTemplate })));
const ClientPortalTemplate = React.lazy(() => import('./components/templates/ClientPortalTemplate').then(m => ({ default: m.ClientPortalTemplate })));

// UI Components
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Spinner, Toast, ToastContainer } from './components/ui/Feedback';
import { AuthService } from './services/AuthService';
import { WorkspaceService } from './services/WorkspaceService';
import { ProjectService } from './services/ProjectService';
import { InvoiceService } from './services/InvoiceService';

const queryClient = new QueryClient();



interface AuthPageProps {
  mode: 'signin' | 'signup' | 'forgot' | 'reset';
  authName: string;
  setAuthName: (v: string) => void;
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  authConfirmPassword: string;
  setAuthConfirmPassword: (v: string) => void;
  authLoading: boolean;
  handleAuth: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  toasts: any[];
  dismissToast: any;
}

const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authConfirmPassword,
  setAuthConfirmPassword,
  authLoading,
  handleAuth,
  handleGoogleLogin,
  toasts,
  dismissToast,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <AuthLayout>
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="text-center">
            <h1 className="text-heading text-foreground m-0">
              {mode === 'signin' && 'Sign In to Karya'}
              {mode === 'signup' && 'Create Branded Workspace'}
              {mode === 'forgot' && 'Reset Password Request'}
              {mode === 'reset' && 'Set Workspace Password'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 m-0">
              {mode === 'signin' && 'The operations and GST payout engine for Indian freelancers'}
              {mode === 'signup' && 'Onboard clients, draft proposals, and receive UPI payments instantly'}
              {mode === 'forgot' && 'Enter your registered email below to receive a password reset link'}
              {mode === 'reset' && 'Enter a secure, memorable password for your workspace access'}
            </p>
          </div>
          
          <div className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Your Full Name *"
                placeholder="Rohan Sharma"
                value={authName}
                onChange={e => setAuthName(e.target.value)}
                required
              />
            )}
            
            {mode !== 'reset' && (
              <Input
                label="Email Address *"
                type="email"
                placeholder="freelancer@karya.in"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
              />
            )}

            {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Password *
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => navigate('/forgot')}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <Input
                label="Confirm Password *"
                type="password"
                placeholder="••••••••"
                value={authConfirmPassword}
                onChange={e => setAuthConfirmPassword(e.target.value)}
                required
              />
            )}
          </div>

          <div className="space-y-3 pt-2">
            <Button variant="primary" className="w-full font-semibold" type="submit" loading={authLoading}>
              {mode === 'signin' && 'Sign In to Workspace'}
              {mode === 'signup' && 'Create Workspace'}
              {mode === 'forgot' && 'Send Recovery Link'}
              {mode === 'reset' && 'Update Password'}
            </Button>

            {(mode === 'signin' || mode === 'signup') && (
              <Button
                variant="outline"
                className="w-full text-foreground border-border flex items-center justify-center gap-2"
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign In with Google
              </Button>
            )}
          </div>
          
          <div className="text-center text-xs">
            {mode === 'signin' && (
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => navigate('/signup')}
              >
                Don't have an account? Sign Up
              </button>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => navigate('/login')}
              >
                Already have an account? Sign In
              </button>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => navigate('/login')}
              >
                ← Back to Sign In
              </button>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => navigate('/login')}
              >
                Cancel and Sign In
              </button>
            )}
          </div>
        </form>
      </AuthLayout>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

interface PortalViewProps {
  addToast: any;
  toasts: any[];
  dismissToast: any;
}

const PortalView: React.FC<PortalViewProps> = ({ addToast, toasts, dismissToast }) => {
  const { portalToken } = useParams<{ portalToken: string }>();
  const navigate = useNavigate();
  const [hasFreelancerSession, setHasFreelancerSession] = useState(false);

  useEffect(() => {
    AuthService.getCurrentUser().then(res => {
      if (res.success && res.data) {
        setHasFreelancerSession(true);
      }
    });
  }, []);

  if (!portalToken) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-8">
      {hasFreelancerSession && (
        <div className="max-w-4xl mx-auto px-4 mb-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← Back to Freelancer view
          </Button>
        </div>
      )}
      <React.Suspense fallback={<div className="flex items-center justify-center p-24"><Spinner size="lg" /></div>}>
        <ClientPortalTemplate portalToken={portalToken} addToast={addToast} />
      </React.Suspense>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

interface WorkspaceViewProps {
  view: 'dashboard' | 'clients' | 'projects' | 'project-details' | 'invoices' | 'payments' | 'settings';
  workspaceId: string;
  profileId: string;
  user: any;
  addToast: any;
  toasts: any[];
  dismissToast: any;
  handleSignOut: any;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  view,
  workspaceId,
  profileId,
  user,
  addToast,
  toasts,
  dismissToast,
  handleSignOut,
}) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const handleViewChange = (v: string) => {
    navigate(`/${v}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardLayout
        currentView={view === 'project-details' ? 'projects' : view}
        onViewChange={handleViewChange}
        breadcrumbs={['Karya Workspace', view.toUpperCase()]}
        user={user}
      >
        <React.Suspense fallback={<div className="flex items-center justify-center p-24"><Spinner size="lg" /></div>}>
          {view === 'project-details' && projectId ? (
            <ProjectDetailsTemplate
              projectId={projectId}
              workspaceId={workspaceId}
              profileId={profileId}
              onBack={() => navigate('/projects')}
              onShowInvoice={async () => {
                const res = await ProjectService.getProjectPortalToken(workspaceId, projectId);
                if (res.success && res.data) {
                  navigate(`/portal/${res.data}`);
                }
              }}
              addToast={addToast}
            />
          ) : (
            <>
              {view === 'dashboard' && (
                <DashboardTemplate workspaceId={workspaceId} profileId={profileId} addToast={addToast} />
              )}
              {view === 'clients' && (
                <ClientsTemplate workspaceId={workspaceId} profileId={profileId} addToast={addToast} />
              )}
              {view === 'projects' && (
                <ProjectsTemplate
                  workspaceId={workspaceId}
                  profileId={profileId}
                  onSelectProject={(id) => navigate(`/projects/${id}`)}
                  addToast={addToast}
                />
              )}
              {view === 'invoices' && (
                <InvoicesTemplate
                  workspaceId={workspaceId}
                  profileId={profileId}
                  onShowInvoiceDetail={async (invoiceId) => {
                    const res = await InvoiceService.getInvoiceDetails(workspaceId, invoiceId);
                    if (res.success && res.data?.project_id) {
                      const portalRes = await ProjectService.getProjectPortalToken(workspaceId, res.data.project_id);
                      if (portalRes.success && portalRes.data) {
                        navigate(`/portal/${portalRes.data}`);
                      }
                    }
                  }}
                  addToast={addToast}
                />
              )}
              {view === 'payments' && (
                <PaymentsTemplate workspaceId={workspaceId} profileId={profileId} addToast={addToast} />
              )}
              {view === 'settings' && (
                <div className="space-y-6">
                  <SettingsTemplate workspaceId={workspaceId} profileId={profileId} addToast={addToast} />
                  <div className="flex justify-end border-t border-border pt-4">
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      Sign Out / Exit Workspace
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </React.Suspense>
      </DashboardLayout>



      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};



const RoutingRedirects = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const portalToken = params.get('portal');
    if (portalToken) {
      navigate(`/portal/${portalToken}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

function KaryaApp() {
  const [user, setUser] = useState<any | undefined>(undefined);
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [profileId, setProfileId] = useState<string>('');

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Global Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: Toast['type'], message: string, desc?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message, description: desc }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchSession = async () => {
    const res = await AuthService.getCurrentUser();
    if (res.success && res.data) {
      setUser(res.data);
      setProfileId(res.data.id);
      
      const workspacesRes = await WorkspaceService.getWorkspaces(res.data.id);
      if (workspacesRes.success && workspacesRes.data.length > 0) {
        setWorkspaceId(workspacesRes.data[0].id);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchSession();

    // Check if recovery in query params or url hash
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    if (params.get('type') === 'recovery' || hashParams.get('type') === 'recovery') {
      addToast('info', 'Recovery Mode Activated', 'Please enter your new workspace password.');
      navigate('/reset', { replace: true });
    }

    const { data: { subscription } } = AuthService.onAuthChange((_event: string, session: any) => {
      if (session?.user) {
        setUser(session.user);
        setProfileId(session.user.id);
      } else {
        setUser(null);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const mode = location.pathname.replace('/', '') as 'signin' | 'signup' | 'forgot' | 'reset' || 'signin';

    if (mode !== 'reset' && !authEmail.trim()) {
      addToast('warning', 'Validation Warning', 'Email address is required.');
      return;
    }
    
    // Password validation for signup & reset
    if (mode === 'signup' || mode === 'reset') {
      if (authPassword.length < 6) {
        addToast('warning', 'Weak Password', 'Password must be at least 6 characters.');
        return;
      }
      if (authPassword !== authConfirmPassword) {
        addToast('warning', 'Password Mismatch', 'Passwords do not match.');
        return;
      }
    }

    try {
      setAuthLoading(true);
      if (mode === 'signup') {
        const res = await AuthService.signUp(authEmail, authPassword, authName);
        if (res.success) {
          addToast('success', 'Registration Successful', 'Welcome to Karya! Your workspace is seeded.');
          await fetchSession();
        } else {
          throw res.error;
        }
      } else if (mode === 'signin') {
        const res = await AuthService.signIn(authEmail, authPassword);
        if (res.success) {
          addToast('success', 'Sign In Successful');
          await fetchSession();
        } else {
          throw res.error;
        }
      } else if (mode === 'forgot') {
        const res = await AuthService.resetPassword(authEmail);
        if (res.success) {
          addToast('success', 'Recovery Email Sent', 'Check your inbox for password reset instructions.');
          if (res.data?.redirectUrl) {
            // Emulate click for local testing
            addToast('info', '[Mock Recovery Email]', `Click here to reset: ${res.data.redirectUrl}`);
          }
          navigate('/login');
        } else {
          throw res.error;
        }
      } else if (mode === 'reset') {
        const res = await AuthService.updatePassword(authPassword);
        if (res.success) {
          addToast('success', 'Password Updated', 'Your new password is set. Please sign in.');
          navigate('/login');
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          throw res.error;
        }
      }
    } catch (err: any) {
      addToast('error', 'Authentication Failed', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const res = await AuthService.signInWithGoogle();
      if (res.success) {
        addToast('success', 'Google Authentication Successful');
        await fetchSession();
      } else {
        throw res.error;
      }
    } catch (err: any) {
      addToast('error', 'Google Sign In Failed', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    setUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    addToast('info', 'Signed Out');
    navigate('/login');
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-xs text-muted-foreground mt-4">Loading Karya Workspace...</p>
      </div>
    );
  }

  const authProps = {
    authName,
    setAuthName,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authConfirmPassword,
    setAuthConfirmPassword,
    authLoading,
    handleAuth,
    handleGoogleLogin,
    toasts,
    dismissToast,
  };

  const workspaceProps = {
    workspaceId,
    profileId,
    user,
    addToast,
    toasts,
    dismissToast,
    handleSignOut,
  };

  return (
    <>
      <RoutingRedirects />
      <Routes>
        {/* Public Client Portal */}
        <Route path="/portal/:portalToken" element={<PortalView addToast={addToast} toasts={toasts} dismissToast={dismissToast} />} />
        


        {/* Auth Routes */}
        <Route path="/login" element={!user ? <AuthPage mode="signin" {...authProps} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!user ? <AuthPage mode="signup" {...authProps} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot" element={!user ? <AuthPage mode="forgot" {...authProps} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset" element={<AuthPage mode="reset" {...authProps} />} />

        {/* Authenticated Workspace Routes */}
        <Route path="/dashboard" element={user ? <WorkspaceView view="dashboard" {...workspaceProps} /> : <Navigate to="/login" replace />} />
        <Route path="/clients" element={user ? <WorkspaceView view="clients" {...workspaceProps} /> : <Navigate to="/login" replace />} />
        <Route path="/projects" element={user ? <WorkspaceView view="projects" {...workspaceProps} /> : <Navigate to="/login" replace />} />
        <Route path="/projects/:projectId" element={user ? <WorkspaceView view="project-details" {...workspaceProps} /> : <Navigate to="/login" replace />} />
        <Route path="/invoices" element={user ? <WorkspaceView view="invoices" {...workspaceProps} /> : <Navigate to="/login" replace />} />
        <Route path="/payments" element={user ? <WorkspaceView view="payments" {...workspaceProps} /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={user ? <WorkspaceView view="settings" {...workspaceProps} /> : <Navigate to="/login" replace />} />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <KaryaApp />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
