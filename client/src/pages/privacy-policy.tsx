import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6" data-testid="text-privacy-title">
              Privacy Policy - LinkedIn Outreach Connector
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Last updated: December 2024
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Overview</h2>
              <p className="text-foreground/80 leading-relaxed">
                The LinkedIn Outreach Connector browser extension ("Extension") is designed to help you 
                connect your LinkedIn account to your outreach platform for sending automated connection 
                requests and messages. We take your privacy seriously and are committed to protecting 
                your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data We Collect</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                The Extension collects the following data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>
                  <strong>LinkedIn Session Cookies:</strong> We collect your LinkedIn session cookies 
                  (li_at and JSESSIONID) to authenticate API requests on your behalf. These cookies 
                  are encrypted using AES-256-GCM encryption before storage.
                </li>
                <li>
                  <strong>Connection Token:</strong> A temporary token you provide to link the extension 
                  to your account. This token expires after 15 minutes and can only be used once.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>To authenticate and send LinkedIn connection requests on your behalf</li>
                <li>To send LinkedIn messages to your connections</li>
                <li>To verify your LinkedIn session is active and valid</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-foreground/80 leading-relaxed">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
                <li>All session cookies are encrypted at rest using AES-256-GCM encryption</li>
                <li>Connection tokens are short-lived (15 minutes) and single-use</li>
                <li>All communication between the extension and our servers uses HTTPS</li>
                <li>We never store your LinkedIn password</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Sharing</h2>
              <p className="text-foreground/80 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties. 
                Your LinkedIn session data is used solely to perform actions you explicitly request 
                through the outreach platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-foreground/80 leading-relaxed">
                Your LinkedIn session cookies are stored until you disconnect your LinkedIn account 
                from the platform, or until the session expires naturally. You can disconnect at any 
                time through the Settings page, which will immediately delete all stored session data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-foreground/80 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
                <li>Disconnect your LinkedIn account at any time</li>
                <li>Request deletion of all your data</li>
                <li>Access information about what data we store</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Permissions</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                The Extension requests the following browser permissions:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>
                  <strong>cookies:</strong> Required to read LinkedIn session cookies for authentication
                </li>
                <li>
                  <strong>storage:</strong> Used to store your app URL and connection status locally
                </li>
                <li>
                  <strong>activeTab:</strong> Used to verify you are on LinkedIn when connecting
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-foreground/80 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any 
                changes by posting the new privacy policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-foreground/80 leading-relaxed">
                If you have any questions about this privacy policy or our data practices, 
                please contact us through the platform's support channels.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
