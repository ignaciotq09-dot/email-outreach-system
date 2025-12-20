import { useState } from 'react';
import { Plus, Upload, Search, UserPlus, Users, Sparkles } from 'lucide-react';
import { FindContactsModal } from './FindContactsModal';

interface AddContactsProps {
  isDarkMode: boolean;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
}

export function AddContacts({ isDarkMode }: AddContactsProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [salutation, setSalutation] = useState<'Mr.' | 'Ms.'>('Mr.');
  const [bulkImportText, setBulkImportText] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showFindContactsModal, setShowFindContactsModal] = useState(false);

  const handleAddContact = () => {
    if (name && email && company) {
      const newContact: Contact = {
        id: Date.now().toString(),
        name,
        email,
        company,
        title,
      };
      setContacts([...contacts, newContact]);
      // Reset form
      setName('');
      setEmail('');
      setCompany('');
      setTitle('');
      setSalutation('Mr.');
    }
  };

  const handleBulkImport = () => {
    // Simulate bulk import
    console.log('Bulk import:', bulkImportText);
    setBulkImportText('');
  };

  return (
    <div
      data-contacts-section
      className={`relative rounded-xl overflow-hidden ${
        isDarkMode
          ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20'
          : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
      } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}
      style={{ animation: 'slide-up 0.4s ease-out' }}
    >
      {/* Decorative gradient overlay */}
      <div
        className={`absolute top-0 left-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${
          isDarkMode ? 'bg-purple-600/10' : 'bg-purple-300/20'
        }`}
      />

      <div className="relative p-5 space-y-6">
        {/* Header */}
        <div>
          <h2
            className="text-base font-semibold mb-1"
            style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
          >
            Step 3: Add Contacts to Your Campaign
          </h2>
          <p
            className="text-xs"
            style={{ color: isDarkMode ? '#a78bfa' : '#6b7280' }}
          >
            Add contacts to receive this email
          </p>
        </div>

        {/* Add New Contact Section */}
        <div
          className={`rounded-xl p-5 border ${
            isDarkMode
              ? 'bg-white/[0.05] border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`p-2 rounded-lg ${
                isDarkMode
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600'
              } shadow-lg shadow-purple-500/30`}
            >
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h3
              className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Add New Contact
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-xs mb-1.5 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-900/60 border-white/10 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                    : 'bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs mb-1.5 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-900/60 border-white/10 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                    : 'bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs mb-1.5 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Company *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc"
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-900/60 border-white/10 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                    : 'bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs mb-1.5 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Title
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="CEO, Product Manager, etc."
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-900/60 border-white/10 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                      : 'bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salutation"
                      value="Mr."
                      checked={salutation === 'Mr.'}
                      onChange={() => setSalutation('Mr.')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span
                      className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Mr.
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salutation"
                      value="Ms."
                      checked={salutation === 'Ms.'}
                      onChange={() => setSalutation('Ms.')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span
                      className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Ms.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddContact}
            disabled={!name || !email || !company}
            className={`mt-4 px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
              !name || !email || !company
                ? isDarkMode
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDarkMode
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>

        {/* AI Bulk Import Section */}
        <div
          className={`rounded-xl p-5 border ${
            isDarkMode
              ? 'bg-white/[0.05] border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`p-2 rounded-lg ${
                isDarkMode
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600'
              } shadow-lg shadow-purple-500/30`}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3
              className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              AI Bulk Import
            </h3>
          </div>

          <p
            className={`text-xs mb-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Paste contact info (names, emails, companies, etc.) and AI will automatically extract and
            add them to your campaign
          </p>

          <div>
            <label
              className={`block text-xs mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Contact Information
            </label>
            <textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder={`Paste contact info here. Examples:\n\nJane Doe, jane@company.com, CEO at TechCorp, 555-123x\nJohn Smith | john@email.org | Marketing Director | Acme Inc\nBob Johnson - Software Engineer @ Startup7 | bob@startup7.com`}
              rows={6}
              className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all resize-none ${
                isDarkMode
                  ? 'bg-gray-900/60 border-white/10 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                  : 'bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
              }`}
            />
            <p
              className={`text-xs mt-1.5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}
            >
              Tip: Works with various formats - lists, tables, LinkedIn profiles, business cards, etc.
            </p>
          </div>

          <button
            onClick={handleBulkImport}
            disabled={!bulkImportText.trim()}
            className={`mt-4 px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
              !bulkImportText.trim()
                ? isDarkMode
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDarkMode
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import Contacts
          </button>
        </div>

        {/* Campaign Contacts Section */}
        <div
          className={`rounded-xl p-5 border ${
            isDarkMode
              ? 'bg-white/[0.05] border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                } shadow-lg shadow-purple-500/30`}
              >
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3
                className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Campaign Contacts ({contacts.length}/25)
              </h3>
            </div>
            <button
              onClick={() => setShowFindContactsModal(true)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                  : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Find Contacts
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <div
                className={`inline-flex p-4 rounded-full mb-3 ${
                  isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
                }`}
              >
                <Users
                  className={`w-8 h-8 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}
                />
              </div>
              <p
                className={`text-sm mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                No contacts added yet
              </p>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}
              >
                Add contacts above to start building your campaign
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isDarkMode
                      ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {contact.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {contact.title} at {contact.company}
                      </p>
                    </div>
                    <p
                      className={`text-xs ${
                        isDarkMode ? 'text-purple-300' : 'text-purple-600'
                      }`}
                    >
                      {contact.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Find Contacts Modal */}
      <FindContactsModal
        isDarkMode={isDarkMode}
        isOpen={showFindContactsModal}
        onClose={() => setShowFindContactsModal(false)}
      />
    </div>
  );
}