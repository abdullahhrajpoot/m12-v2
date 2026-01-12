"use client"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: January 2025</p>
        
        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Bippity Boo ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and safeguard your information 
              when you use our email management service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-white mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address and profile information from your Google account</li>
              <li>Preferences and settings you configure in the app</li>
            </ul>
            
            <h3 className="text-xl font-medium text-white mt-4 mb-2">2.2 Information We Access</h3>
            <p className="mb-2">When you connect your Google account, we request access to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Gmail (Read-only):</strong> To scan and summarize your emails</li>
              <li><strong>Gmail Labels:</strong> To help organize and filter emails</li>
              <li><strong>Google Calendar:</strong> To identify calendar-related emails and events</li>
              <li><strong>Google Tasks:</strong> To help manage action items from emails</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide email summaries and insights</li>
              <li>Identify important emails and action items</li>
              <li>Improve our service and user experience</li>
              <li>Send you service-related notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We use Supabase for secure data storage with encryption at rest</li>
              <li>OAuth tokens are stored securely and refreshed automatically</li>
              <li>We do not store the full content of your emails</li>
              <li>We implement industry-standard security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties. 
              We may share information only:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>With service providers who assist in operating our service (e.g., cloud hosting)</li>
              <li>If required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and download your data</li>
              <li>Delete your account and associated data</li>
              <li>Revoke Google OAuth access at any time via your Google Account settings</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p>
              We retain your data only as long as necessary to provide our services. 
              When you delete your account, we will delete your personal data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Google API Services User Data Policy</h2>
            <p>
              Our use of information received from Google APIs adheres to the{" "}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                className="text-indigo-400 hover:text-indigo-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:support@bippity.boo" className="text-indigo-400 hover:text-indigo-300 underline">
                support@bippity.boo
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700">
          <a href="/" className="text-indigo-400 hover:text-indigo-300">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
