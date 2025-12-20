import { Button } from "@/components/ui/button";
import { Sparkles, Mail } from "lucide-react";

export default function LoginPage() {
  // Handle OAuth provider selection
  const handleOAuthProvider = (provider: 'gmail' | 'outlook' | 'yahoo') => {
    // Redirect to OAuth flow
    window.location.href = `/api/connect/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-950 dark:to-fuchsia-950 p-4">
      {/* Decorative blur orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-violet-400/30 rounded-full blur-3xl" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-fuchsia-400/30 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg shadow-purple-200 dark:shadow-purple-900">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Outreach
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-100 dark:border-purple-900 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your email provider to sign in
            </p>
          </div>

          <div className="space-y-3">
            {/* Gmail Button */}
            <Button
              onClick={() => handleOAuthProvider('gmail')}
              variant="outline"
              className="w-full h-12 justify-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              data-testid="button-gmail"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white font-medium">Continue with Gmail</span>
            </Button>

            {/* Outlook Button */}
            <Button
              onClick={() => handleOAuthProvider('outlook')}
              variant="outline"
              className="w-full h-12 justify-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              data-testid="button-outlook"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white font-medium">Continue with Outlook</span>
            </Button>

            {/* Yahoo Button */}
            <Button
              onClick={() => handleOAuthProvider('yahoo')}
              variant="outline"
              className="w-full h-12 justify-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              data-testid="button-yahoo"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white font-medium">Continue with Yahoo</span>
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              data-testid="link-signup"
            >
              Sign up
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
