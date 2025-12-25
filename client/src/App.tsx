// Reference: blueprint:javascript_log_in_with_replit
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Code-split pages to reduce initial bundle size
const VelocityLanding = lazy(() => import("@/pages/velocity"));
const HomePage = lazy(() => import("@/pages/figma-home"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const SignupPage = lazy(() => import("@/pages/signup"));
const LoginPage = lazy(() => import("@/pages/login"));
const BookingPage = lazy(() => import("@/pages/book"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const PrivacyPolicy = lazy(() => import("@/pages/velocity"));  // Redirect privacy to landing


// Loading fallback component
function PageLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  // If user is not logged in OR auth is still loading, show public routes
  // This ensures /signup and /login render immediately without waiting for auth
  if (!user || isLoading) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/landing" component={VelocityLanding} />
          <Route path="/velocity" component={VelocityLanding} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/book/:slug" component={BookingPage} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/onboarding">
            <Redirect to="/login" />
          </Route>
          <Route path="/" component={VelocityLanding} />
          <Route path="/app">
            <Redirect to="/login" />
          </Route>
          <Route path="/analytics">
            <Redirect to="/login" />
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/landing" component={VelocityLanding} />
        <Route path="/velocity" component={VelocityLanding} />
        <Route path="/signup">
          <Redirect to="/onboarding" />
        </Route>
        <Route path="/login">
          <Redirect to="/onboarding" />
        </Route>
        <Route path="/book/:slug" component={BookingPage} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/app" component={HomePage} />
        <Route path="/analytics" component={AnalyticsPage} />

        <Route path="/">
          <Redirect to="/onboarding" />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

