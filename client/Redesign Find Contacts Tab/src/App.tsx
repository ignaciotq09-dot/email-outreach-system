import { useState, useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { FindContacts } from './components/FindContacts';
import { ComposeAndSend } from './components/ComposeAndSend';
import { Workflows } from './components/Workflows';
import { SentEmails } from './components/SentEmails';
import { Inbox } from './components/Inbox';
import { Meetings } from './components/Meetings';
import { Analytics } from './components/Analytics';
import { Personalize } from './components/Personalize';
import { Settings } from './components/Settings';
import './styles/globals.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('find-contacts');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('outreach-dark-mode');
    const initialValue = saved === 'true';
    console.log('🎬 INITIAL LOAD - localStorage value:', saved, '→ parsed as:', initialValue);
    return initialValue;
  });

  // Apply dark mode class to HTML element
  useEffect(() => {
    try {
      const html = document.documentElement;
      const body = document.body;
      
      console.log('🔄 useEffect triggered - isDarkMode:', isDarkMode);
      console.log('📍 Before change - HTML classes:', html.className);
      
      if (isDarkMode) {
        html.classList.add('dark');
        body.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
        console.log('✅ DARK MODE ENABLED');
      } else {
        html.classList.remove('dark');
        body.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
        console.log('☀️ LIGHT MODE ENABLED');
      }
      
      console.log('📍 After change - HTML classes:', html.className);
      console.log('📍 After change - HTML classList contains dark?', html.classList.contains('dark'));
      console.log('📍 After change - data-theme:', html.getAttribute('data-theme'));
      
      // Save to localStorage
      localStorage.setItem('outreach-dark-mode', String(isDarkMode));
      console.log('💾 Saved to localStorage:', isDarkMode);
      
      // Force a reflow to ensure styles are applied
      void html.offsetHeight;
      
    } catch (error) {
      console.error('❌ ERROR in useEffect:', error);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    console.log('');
    console.log('🖱️ ========================================');
    console.log('🖱️ TOGGLE BUTTON CLICKED!');
    console.log('🖱️ Current isDarkMode state:', isDarkMode);
    console.log('🖱️ Will change to:', !isDarkMode);
    console.log('🖱️ ========================================');
    console.log('');
    
    setIsDarkMode(prev => {
      const newValue = !prev;
      console.log('⚡ State setter called - new value:', newValue);
      return newValue;
    });
  };

  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab(newTab);
        setIsTransitioning(false);
      }, 150);
    }
  };

  return (
    <div className={`min-h-screen text-gray-900 transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#1a0f2e] via-[#0f0820] to-[#0a0515] text-gray-100' 
        : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50'
    }`}>
      
      {/* INVERTED ELEGANCE - Soft atmospheric glows for dark mode (mirrors light mode) */}
      {isDarkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Soft purple glow - top left (mirrors light mode blob) */}
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-[100px] animate-blob"></div>
          {/* Soft violet glow - top right (mirrors light mode blob) */}
          <div className="absolute top-0 -right-4 w-96 h-96 bg-violet-600/15 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
          {/* Soft indigo glow - bottom left (mirrors light mode blob) */}
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-600/15 rounded-full filter blur-[100px] animate-blob animation-delay-4000"></div>
          {/* Subtle accent - center depth */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-900/5 rounded-full filter blur-[120px]"></div>
        </div>
      )}
      
      {/* LIGHT MODE - Soft pastel blobs */}
      {!isDarkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      )}

      {/* Application Header */}
      <header className={`relative h-[70px] flex items-center justify-between px-8 shadow-xl overflow-hidden transition-all duration-500 ${
        isDarkMode
          ? 'bg-black/40 backdrop-blur-xl border-b border-purple-500/20 shadow-purple-500/10'
          : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-purple-500/20'
      }`}>
        {/* INVERTED ELEGANCE - Subtle glow top border for dark mode */}
        {isDarkMode && (
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
        )}
        
        {/* LIGHT MODE - Soft glow border */}
        {!isDarkMode && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        )}
        
        {/* Bottom glow border - subtle in both modes */}
        <div className={`absolute bottom-0 left-0 right-0 h-[1px] ${
          isDarkMode
            ? 'bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0'
            : 'bg-gradient-to-r from-purple-400/0 via-purple-400/50 to-purple-400/0'
        }`}></div>
        
        {/* Animated gradient overlay - only in light mode */}
        {!isDarkMode && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/10 to-purple-500/0 animate-shimmer opacity-40"></div>
        )}
        
        {/* Noise texture for premium feel */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
        }}></div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-4 left-[20%] w-1 h-1 bg-white rounded-full animate-float"></div>
          <div className="absolute top-6 left-[40%] w-1.5 h-1.5 bg-white/70 rounded-full animate-float-slow"></div>
          <div className="absolute top-3 left-[60%] w-1 h-1 bg-white rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-5 left-[80%] w-1 h-1 bg-white/50 rounded-full animate-float-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
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
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full blur-md opacity-40 animate-pulse-glow"></div>
            <div className="relative px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full font-semibold text-xs text-purple-900 shadow-lg shadow-yellow-500/30 animate-float-slow">
              PRO
            </div>
          </div>
        </div>

        {/* Right Section - Enhanced Actions */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Grouped buttons container */}
          <div className="flex items-center gap-2 px-2 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            {/* Settings */}
            <button className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-blue-500/20 overflow-hidden group" title="Settings">
              <svg className="w-5 h-5 relative z-10 transition-transform group-hover:rotate-90 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-400/0 group-hover:from-blue-400/30 group-hover:to-blue-400/10 transition-all duration-300 rounded-xl"></div>
            </button>

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
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-all duration-300"></div>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-300 to-blue-300 flex items-center justify-center shadow-lg shadow-purple-500/40 ring-2 ring-white/60 transition-all hover:scale-110 active:scale-95 hover:shadow-xl hover:shadow-purple-500/50 hover:ring-white/80">
              <span className="text-purple-900 text-sm font-bold">JD</span>
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-lg">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="relative h-[calc(100vh-108px)]">
        <div 
          key={activeTab}
          className="h-full"
          style={{
            animation: 'fade-in 0.3s ease-out'
          }}
        >
          {activeTab === 'compose' && <ComposeAndSend />}
          {activeTab === 'find-contacts' && <FindContacts />}
          {activeTab === 'workflows' && <Workflows />}
          {activeTab === 'sent-emails' && <SentEmails />}
          {activeTab === 'inbox' && <Inbox />}
          {activeTab === 'meetings' && <Meetings />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'personalize' && <Personalize />}
          {activeTab === 'settings' && <Settings />}
          {activeTab !== 'find-contacts' && activeTab !== 'compose' && activeTab !== 'workflows' && activeTab !== 'sent-emails' && activeTab !== 'inbox' && activeTab !== 'meetings' && activeTab !== 'analytics' && activeTab !== 'personalize' && activeTab !== 'settings' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')} tab content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}