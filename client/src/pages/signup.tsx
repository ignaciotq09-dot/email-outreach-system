import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sparkles, ArrowRight, ArrowLeft, Mail, Code } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Step 1 schema: Profile information
const step1Schema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  company: z.string().min(2, "Please enter your company name"),
  position: z.string().min(2, "Please enter your position"),
});

type Step1Form = z.infer<typeof step1Schema>;

const isDevelopment = import.meta.env.DEV;

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [isDevLoading, setIsDevLoading] = useState(false);
  const { toast } = useToast();

  // Handle dev login
  const handleDevLogin = async () => {
    setIsDevLoading(true);
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Logged in as Dev User",
          description: "Redirecting to dashboard...",
        });
        // Redirect to onboarding (skip email but still do company onboarding)
        window.location.href = '/onboarding';
      } else {
        toast({
          title: "Dev login failed",
          description: "Check server logs for details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Dev login error:', error);
      toast({
        title: "Connection error",
        description: "Could not reach the server",
        variant: "destructive",
      });
    } finally {
      setIsDevLoading(false);
    }
  };

  // Form for Step 1: Profile information
  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: "",
      company: "",
      position: "",
    },
  });

  // Handle Step 1 submit: Save data and move to Step 2
  const onStep1Submit = (data: Step1Form) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  // Handle OAuth provider selection
  const handleOAuthProvider = async (provider: 'gmail' | 'outlook' | 'yahoo') => {
    if (!step1Data) return;

    try {
      // Store Step 1 data in server session for OAuth callback to retrieve
      const response = await fetch('/api/signup/set-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1Data),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to store profile data');
        return;
      }

      // Redirect to OAuth flow
      window.location.href = `/api/connect/${provider}`;
    } catch (error) {
      console.error('Error storing profile data:', error);
    }
  };

  // Go back to Step 1
  const goBackToStep1 = () => {
    setCurrentStep(1);
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

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-16 rounded-full transition-all ${currentStep === 1 ? 'bg-purple-600' : 'bg-purple-300 dark:bg-purple-800'}`} />
          <div className={`h-2 w-16 rounded-full transition-all ${currentStep === 2 ? 'bg-purple-600' : 'bg-purple-300 dark:bg-purple-800'}`} />
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-100 dark:border-purple-900 p-8">
          {/* Step 1: Profile Information */}
          {currentStep === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Tell us about yourself
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Step 1 of 2 - We'll personalize your experience
                </p>
              </div>

              <Form {...step1Form}>
                <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
                  <FormField
                    control={step1Form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                            className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            data-testid="input-full-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Company</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Inc."
                            {...field}
                            className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            data-testid="input-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Position</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sales Manager"
                            {...field}
                            className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            data-testid="input-position"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-medium shadow-lg shadow-purple-200 dark:shadow-purple-900/50"
                    data-testid="button-continue-step1"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </Form>

              {/* Dev Login - Only in Development (Skip form entirely) */}
              {isDevelopment && (
                <>
                  <Separator className="my-4" />
                  <Button
                    onClick={handleDevLogin}
                    disabled={isDevLoading}
                    variant="outline"
                    className="w-full h-12 justify-start gap-3 border-dashed border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                    data-testid="button-dev-login-step1"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
                      <Code className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-orange-700 dark:text-orange-300 font-medium">
                      {isDevLoading ? 'Logging in...' : 'Dev Login (Skip OAuth)'}
                    </span>
                  </Button>
                </>
              )}
            </>
          )}

          {/* Step 2: Choose Email Provider */}
          {currentStep === 2 && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connect your email
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Step 2 of 2 - Choose your email provider to continue
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

              {/* Back Button */}
              <Button
                type="button"
                onClick={goBackToStep1}
                variant="ghost"
                className="w-full h-11 mt-4"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {/* Dev Login - Only in Development */}
              {isDevelopment && (
                <>
                  <Separator className="my-4" />
                  <Button
                    onClick={handleDevLogin}
                    disabled={isDevLoading}
                    variant="outline"
                    className="w-full h-12 justify-start gap-3 border-dashed border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                    data-testid="button-dev-login"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
                      <Code className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-orange-700 dark:text-orange-300 font-medium">
                      {isDevLoading ? 'Logging in...' : 'Dev Login (Skip OAuth)'}
                    </span>
                  </Button>
                </>
              )}
            </>
          )}

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              data-testid="link-sign-in"
            >
              Sign in
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
