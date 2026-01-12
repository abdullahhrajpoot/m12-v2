"use client"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last updated: January 2025</p>
        
        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Bippity Boo ("the Service"), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>
              Bippity Boo is an email management service that helps you understand and organize 
              your emails by providing summaries, identifying important messages, and extracting 
              action items. The Service connects to your Google account to access Gmail, Calendar, 
              and Tasks data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must have a valid Google account to use the Service</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate and complete information</li>
              <li>You must be at least 13 years old to use the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Responsibilities</h2>
            <p className="mb-2">You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service only for lawful purposes</li>
              <li>Not attempt to gain unauthorized access to the Service</li>
              <li>Not interfere with or disrupt the Service</li>
              <li>Not use the Service to send spam or malicious content</li>
              <li>Comply with Google's Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Google API Usage</h2>
            <p>
              The Service uses Google APIs to access your Gmail, Calendar, and Tasks data. 
              By using the Service, you also agree to{" "}
              <a 
                href="https://policies.google.com/terms" 
                className="text-indigo-400 hover:text-indigo-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google's Terms of Service
              </a>
              . You can revoke access to your Google data at any time through your{" "}
              <a 
                href="https://myaccount.google.com/permissions" 
                className="text-indigo-400 hover:text-indigo-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Account settings
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <p>
              The Service, including its design, features, and content, is owned by Bippity Boo 
              and is protected by intellectual property laws. You may not copy, modify, or 
              distribute any part of the Service without our written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Privacy</h2>
            <p>
              Your privacy is important to us. Please review our{" "}
              <a href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">
                Privacy Policy
              </a>{" "}
              to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
              ERROR-FREE, OR COMPLETELY SECURE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BIPPITY BOO SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF 
              PROFITS OR REVENUES.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service at any time, with or without 
              cause. You may also terminate your account at any time by revoking Google OAuth 
              access and contacting us to delete your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of 
              significant changes. Continued use of the Service after changes constitutes 
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at:{" "}
              <a href="mailto:support@bippity.boo" className="text-indigo-400 hover:text-indigo-300 underline">
                support@bippity.boo
              </a>
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
