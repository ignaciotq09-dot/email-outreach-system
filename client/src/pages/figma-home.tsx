import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

// Import Figma design components
import { FigmaTabBar } from "@/components/FigmaTabBar";
import { FindContacts } from "@/components/figma-tabs/FindContacts";
import { ComposeAndSend } from "@/components/figma-tabs/ComposeAndSend";
import { Workflows } from "@/components/figma-tabs/Workflows";
import { SentEmails } from "@/components/figma-tabs/SentEmails";
import { Inbox } from "@/components/figma-tabs/Inbox";
import { Meetings } from "@/components/figma-tabs/Meetings";
import { Analytics } from "@/components/figma-tabs/Analytics";
import { Personalize } from "@/components/figma-tabs/Personalize";
import { Settings } from "@/components/figma-tabs/Settings";

// Import Figma styles
import "@/styles/figma-globals.css";

export default function FigmaHomePage() {
    const [activeTab, setActiveTab] = useState("find-contacts");

    // Dark mode state with localStorage persistence (defaults to true for Figma dark design)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('outreach-dark-mode');
        // Default to dark mode (Figma design), only use light if explicitly set to 'false'
        return saved !== 'false';
    });

    // Apply dark mode class to HTML element
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        if (isDarkMode) {
            html.classList.add('dark');
            body.classList.add('dark');
        } else {
            html.classList.remove('dark');
            body.classList.remove('dark');
        }

        localStorage.setItem('outreach-dark-mode', String(isDarkMode));
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    const { user } = useAuth();
    const { data: gmailStatus } = useQuery<{ connected: boolean; email: string | null }>({
        queryKey: ['/api/connect/gmail/status'],
    });

    const gmailConnected = gmailStatus?.connected ?? false;
    const userEmail = gmailStatus?.email ?? "Not connected";

    const handleSignOut = async () => {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/';
    };

    const getUserInitials = () => {
        if (!user) return "JD";
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        if (user.firstName) return user.firstName[0].toUpperCase();
        if (user.email) return user.email[0].toUpperCase();
        return "JD";
    };

    return (
        <div className={`min-h-screen text-gray-900 transition-colors duration-500 ${isDarkMode
            ? 'bg-gradient-to-b from-[#1a0f2e] via-[#0f0820] to-[#0a0515] text-gray-100'
            : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50'
            }`}>

            {/* DARK MODE - Soft atmospheric glows */}
            {isDarkMode && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-violet-600/15 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-600/15 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-900/5 rounded-full filter blur-[120px]"></div>
                </div>
            )}

            {/* LIGHT MODE - Soft pastel blobs */}
            {!isDarkMode && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
                </div>
            )}

            {/* Application Header - Exact Figma Design */}
            <header className={`relative h-[70px] flex items-center justify-between px-8 shadow-xl overflow-hidden transition-all duration-500 ${isDarkMode
                ? 'bg-black/40 backdrop-blur-xl border-b border-purple-500/20 shadow-purple-500/10'
                : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-purple-500/20'
                }`}>
                {/* Top glow border for dark mode */}
                {isDarkMode && (
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
                )}

                {/* Top glow border for light mode */}
                {!isDarkMode && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                )}

                {/* Bottom glow border */}
                <div className={`absolute bottom-0 left-0 right-0 h-[1px] ${isDarkMode
                    ? 'bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0'
                    : 'bg-gradient-to-r from-purple-400/0 via-purple-400/50 to-purple-400/0'
                    }`}></div>

                {/* Animated gradient overlay - only in light mode */}
                {!isDarkMode && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/10 to-purple-500/0 opacity-40"></div>
                )}

                {/* Noise texture for premium feel */}
                <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
                }}></div>

                {/* Floating particles - light mode only */}
                {!isDarkMode && (
                    <div className="absolute inset-0 overflow-hidden opacity-30">
                        <div className="absolute top-4 left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        <div className="absolute top-6 left-[40%] w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute top-3 left-[60%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute top-5 left-[80%] w-1 h-1 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </div>
                )}

                {/* Left Section - Enhanced Branding */}
                <div className="flex items-center gap-4 relative z-10">
                    {/* Enhanced Logo */}
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                        <div className="relative w-11 h-11 bg-gradient-to-br from-white via-purple-50 to-blue-50 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/40 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-purple-500/50 active:scale-95">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <span className="relative z-10 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent font-bold text-2xl">O</span>
                        </div>
                    </div>

                    {/* Brand Name with tagline */}
                    <div className="flex flex-col">
                        <span className="text-white font-semibold text-xl tracking-wide">Outreach AI</span>
                        <span className="text-white/60 text-xs tracking-wider -mt-0.5">AI-Powered Outreach</span>
                    </div>

                    {/* Enhanced Pro Badge */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                        <div className="relative px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full font-semibold text-xs text-purple-900 shadow-lg shadow-yellow-500/30">
                            PRO
                        </div>
                    </div>
                </div>

                {/* Right Section - Enhanced Actions */}
                <div className="flex items-center gap-3 relative z-10">
                    {/* Gmail Status */}
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        {gmailConnected ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-green-400" data-testid="icon-gmail-connected" />
                                <span data-testid="text-gmail-status" className="hidden md:inline">{userEmail}</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4 text-red-400" data-testid="icon-gmail-disconnected" />
                                <span data-testid="text-gmail-status" className="hidden md:inline">Gmail not connected</span>
                            </>
                        )}
                    </div>

                    {/* Grouped buttons container */}
                    <div className="flex items-center gap-2 px-2 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-yellow-500/20 overflow-hidden group"
                            aria-label="Toggle dark mode"
                            title={isDarkMode ? "Light mode" : "Dark mode"}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/30 group-hover:to-yellow-400/10 transition-all duration-300 rounded-xl"></div>
                            <span className="text-xl relative z-10 transition-transform group-hover:rotate-12 duration-300">
                                {isDarkMode ? '☀️' : '🌙'}
                            </span>
                        </button>
                    </div>

                    {/* User Profile Avatar with status */}
                    <div className="relative group cursor-pointer" onClick={handleSignOut} title="Sign out">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-all duration-300"></div>
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-300 to-blue-300 flex items-center justify-center shadow-lg shadow-purple-500/40 ring-2 ring-white/60 transition-all hover:scale-110 active:scale-95 hover:shadow-xl hover:shadow-purple-500/50 hover:ring-white/80">
                            {user?.profileImageUrl ? (
                                <Avatar className="w-full h-full rounded-xl">
                                    <AvatarImage src={user.profileImageUrl} />
                                    <AvatarFallback className="bg-transparent">{getUserInitials()}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <span className="text-purple-900 text-sm font-bold">{getUserInitials()}</span>
                            )}
                            {/* Online status indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-lg">
                                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Bar - Exact Figma Design */}
            <FigmaTabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content - ALL Figma Tab Components */}
            <div className="relative h-[calc(100vh-118px)] overflow-hidden">
                <div
                    key={activeTab}
                    className="h-full"
                    style={{
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                >
                    {activeTab === 'compose' && <ComposeAndSend />}
                    {activeTab === 'find-contacts' && <FindContacts isDarkMode={isDarkMode} />}
                    {activeTab === 'workflows' && <Workflows />}
                    {activeTab === 'sent' && <SentEmails />}
                    {activeTab === 'inbox' && <Inbox />}
                    {activeTab === 'meetings' && <Meetings />}
                    {activeTab === 'analytics' && <Analytics />}
                    {activeTab === 'personalize' && <Personalize />}
                    {activeTab === 'settings' && <Settings />}
                </div>
            </div>

            {/* Fade-in animation */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
