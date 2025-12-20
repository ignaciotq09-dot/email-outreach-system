import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  Mail,
  CheckCircle2,
  Circle,
  Key,
  Clock,
  User,
  Save,
  ChevronDown,
  AlertCircle,
  Zap
} from 'lucide-react';

export function Settings() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [yahooConnected, setYahooConnected] = useState(false);
  const [openAIActive, setOpenAIActive] = useState(true);
  const [checkInterval, setCheckInterval] = useState('30 minutes');
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  
  // Sender info form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const intervalOptions = ['15 minutes', '30 minutes', '1 hour', '2 hours', '4 hours'];

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0a0515]' : 'bg-slate-50'}`}>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isDarkMode ? (
          <>
            <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] animate-blob"></div>
            <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[120px] animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full filter blur-[140px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-300/20 rounded-full filter blur-[100px] animate-blob"></div>
            <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-blue-300/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 relative z-10">
        
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${
            isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
          }`}>
            <SettingsIcon className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h1 className={`text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Settings
            </h1>
            <p className={`text-base mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Email Provider */}
        <div className={`rounded-xl p-5 border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/[0.08] backdrop-blur-xl border-white/10 shadow-lg shadow-purple-500/5 hover:border-white/20'
            : 'bg-white/90 backdrop-blur-xl border-purple-200/50 shadow-lg hover:shadow-xl'
        }`}>
          <div className="mb-4">
            <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Email Provider
            </h2>
            <p className={`text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Connect your email account to send campaigns and track replies
            </p>
          </div>

          <div className="space-y-3">
            {/* Gmail */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-red-500/10' : 'bg-red-100'
                  }`}>
                    <Mail className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Gmail
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {gmailConnected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            Connected with Gmail account to send emails and track replies
                          </p>
                        </>
                      ) : (
                        <>
                          <Circle className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Not Connected
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setGmailConnected(!gmailConnected)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all active:scale-95 ${
                    gmailConnected
                      ? isDarkMode
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20'
                        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:shadow-md'
                      : isDarkMode
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                        : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg'
                  }`}
                >
                  {gmailConnected ? 'Disconnect' : 'Connect Gmail'}
                </button>
              </div>
            </div>

            {/* Outlook */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'
                  }`}>
                    <Mail className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Outlook
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {outlookConnected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            Connected with Outlook account to send emails
                          </p>
                        </>
                      ) : (
                        <>
                          <Circle className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Not Connected
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOutlookConnected(!outlookConnected)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 ${
                    outlookConnected
                      ? isDarkMode
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20'
                        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:shadow-md'
                      : isDarkMode
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                        : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg'
                  }`}
                >
                  {outlookConnected ? 'Disconnect' : 'Connect Outlook'}
                </button>
              </div>
            </div>

            {/* Yahoo Mail */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
                  }`}>
                    <Mail className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Yahoo Mail
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {yahooConnected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            Connected with Yahoo account to send emails
                          </p>
                        </>
                      ) : (
                        <>
                          <Circle className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Not Connected
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setYahooConnected(!yahooConnected)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 ${
                    yahooConnected
                      ? isDarkMode
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20'
                        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:shadow-md'
                      : isDarkMode
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                        : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg'
                  }`}
                >
                  {yahooConnected ? 'Disconnect' : 'Connect Yahoo'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* OpenAI API Configuration */}
        <div className={`rounded-xl p-5 border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/[0.08] backdrop-blur-xl border-white/10 shadow-lg shadow-purple-500/5 hover:border-white/20'
            : 'bg-white/90 backdrop-blur-xl border-purple-200/50 shadow-lg hover:shadow-xl'
        }`}>
          <div className="mb-4">
            <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              OpenAI API Configuration
            </h2>
            <p className={`text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Using Front AI integrations. No API key required.
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${
            isDarkMode
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <Zap className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <h3 className={`text-base ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>
                  AI Integration Active
                </h3>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-green-400/80' : 'text-green-700'}`}>
                  Charges billed to your Front AI credits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Check for Replies */}
        <div className={`rounded-xl p-5 border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/[0.08] backdrop-blur-xl border-white/10 shadow-lg shadow-purple-500/5 hover:border-white/20'
            : 'bg-white/90 backdrop-blur-xl border-purple-200/50 shadow-lg hover:shadow-xl'
        }`}>
          <div className="mb-4">
            <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Auto-Check for Replies
            </h2>
          </div>

          <div>
            <label className={`text-base block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Check every
            </label>
            <div className="relative">
              <button
                onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
                className={`w-full px-4 py-3 rounded-lg text-base text-left border flex items-center justify-between ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                    : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{checkInterval}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showIntervalDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border overflow-hidden shadow-lg z-10 ${
                  isDarkMode
                    ? 'bg-[#1a0f2e] border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  {intervalOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setCheckInterval(option);
                        setShowIntervalDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-base text-left transition-all ${
                        checkInterval === option
                          ? isDarkMode
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-purple-100 text-purple-700'
                          : isDarkMode
                            ? 'text-gray-300 hover:bg-white/5'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sender Information */}
        <div className={`rounded-xl p-5 border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/[0.08] backdrop-blur-xl border-white/10 shadow-lg shadow-purple-500/5 hover:border-white/20'
            : 'bg-white/90 backdrop-blur-xl border-purple-200/50 shadow-lg hover:shadow-xl'
        }`}>
          <div className="mb-4">
            <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sender Information
            </h2>
            <p className={`text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your name and phone number will be automatically included as a signature in all emails
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-base block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className={`w-full px-4 py-3 rounded-lg text-base border outline-none ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-base block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className={`w-full px-4 py-3 rounded-lg text-base border outline-none ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`text-base block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                className={`w-full px-4 py-3 rounded-lg text-base border outline-none ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                }`}
              />
            </div>

            <div>
              <label className={`text-base block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={`w-full px-4 py-3 rounded-lg text-base border outline-none ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                }`}
              />
            </div>

            <button className={`w-full px-6 py-3 rounded-lg text-base transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/50'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
            }`}>
              <Save className="w-5 h-5" />
              <span>Save Information</span>
            </button>
          </div>
        </div>

        {/* Account Management */}
        <div className={`rounded-xl p-5 border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/[0.08] backdrop-blur-xl border-white/10 shadow-lg shadow-purple-500/5 hover:border-white/20'
            : 'bg-white/90 backdrop-blur-xl border-purple-200/50 shadow-lg hover:shadow-xl'
        }`}>
          <div className="mb-4">
            <h2 className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Account Management
            </h2>
          </div>

          <div className="space-y-3">
            <button className={`w-full px-4 py-3 rounded-lg text-base text-left transition-all border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
              Change Password
            </button>

            <button className={`w-full px-4 py-3 rounded-lg text-base text-left transition-all border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
              Export Data
            </button>

            <button className={`w-full px-4 py-3 rounded-lg text-base text-left transition-all border border-red-500/30 ${
              isDarkMode
                ? 'bg-red-500/5 text-red-400 hover:bg-red-500/10'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}