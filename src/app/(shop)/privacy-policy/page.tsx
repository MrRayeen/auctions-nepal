// pages/privacy-policy.tsx
import Footer from "@/components/Footer";
import PolicyLayout, { PolicySection } from "@/components/shared/PolicyLayout";
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="bg-transparent text-white">
      <PolicyLayout
        title="Privacy Policy"
        updated="December 11, 2025"
        intro={
          <>
            <p>
              This Privacy Policy explains how{" "}
              <strong className="text-nepal-accent">Auction Nepal</strong>{" "}
              collects and uses information. We aim to be transparent and limit
              collection to what is necessary for core functionality.
            </p>
          </>
        }
      >
        <nav className="glass-panel p-4 rounded-md mb-4">
          <strong className="block mb-2">Jump to</strong>
          <ul className="ml-4 list-disc text-sm text-gray-300">
            <li>
              <a href="#collect" className="hover:underline">
                Information we collect
              </a>
            </li>
            <li>
              <a href="#use" className="hover:underline">
                How we use your information
              </a>
            </li>
            <li>
              <a href="#share" className="hover:underline">
                Sharing & legal requests
              </a>
            </li>
            <li>
              <a href="#cookies" className="hover:underline">
                Cookies & tracking
              </a>
            </li>
            <li>
              <a href="#rights" className="hover:underline">
                Your rights
              </a>
            </li>
          </ul>
        </nav>

        <PolicySection id="collect" title="Information We Collect">
          <h4 className="font-semibold">Information you provide</h4>
          <ul className="ml-4 list-disc">
            <li>Full name, email address, phone (if provided)</li>
            <li>Listing details (title, description, category, images)</li>
            <li>Messages and support communications</li>
          </ul>

          <h4 className="mt-3 font-semibold">Automatically collected data</h4>
          <ul className="ml-4 list-disc">
            <li>IP address, device and browser metadata</li>
            <li>Pages viewed, interactions, timestamps</li>
            <li>Basic analytics for performance and security</li>
          </ul>

          <p className="text-gray-300">
            We do not collect payment card details because no payment gateway is
            integrated.
          </p>
        </PolicySection>
        <PolicySection id="use" title="How We Use Your Information">
          <p>
            We use data for account management, displaying listings, and safety:
          </p>
          <ul className="ml-4 list-disc">
            <li>Creating and managing user accounts</li>
            <li>Communicating about listings and support</li>
            <li>Detecting abuse and improving the service</li>
          </ul>

          <p className="text-gray-300">
            <strong>We do not sell your personal information.</strong>
          </p>
        </PolicySection>

        <PolicySection id="share" title="Sharing & Legal Requests">
          <p>
            We may share information to comply with legal obligations or with
            service providers who support our platform (hosting, analytics).
            Third parties are required to protect the data they process on our
            behalf.
          </p>

          <div className="mt-3 glass-panel p-3 rounded-md text-sm text-gray-300">
            <strong>Examples of sharing</strong>
            <ul className="ml-4 list-disc mt-2">
              <li>Hosting provider for site storage</li>
              <li>Analytics provider for anonymized metrics</li>
              <li>Law enforcement when required by valid legal request</li>
            </ul>
          </div>
        </PolicySection>

        <PolicySection id="cookies" title="Cookies & Tracking">
          <p>
            We use cookies and similar technologies for session management,
            analytics, and security. Disabling cookies may affect some features.
          </p>
        </PolicySection>

        <PolicySection id="rights" title="Your Rights">
          <p>
            Within Nepal, you can request access, correction, or deletion of
            your personal data by contacting our support team. Certain data may
            be retained for legal reasons.
          </p>
        </PolicySection>

        <PolicySection title="Security, Children & Changes">
          <h4 className="font-semibold">Data security & retention</h4>
          <p>
            We use reasonable technical measures (HTTPS, secure servers) to
            protect data. We retain information only as necessary for accounts,
            active listings, and legal requirements.
          </p>

          <h4 className="mt-3 font-semibold">Children</h4>
          <p>
            The platform is not intended for individuals under 16 years of age.
          </p>

          <h4 className="mt-3 font-semibold">Changes to this policy</h4>
          <p>
            We may update this policy periodically. Significant changes will be
            posted with an updated date on this page.
          </p>
        </PolicySection>
      </PolicyLayout>
      <Footer />
    </div>
  );
}
