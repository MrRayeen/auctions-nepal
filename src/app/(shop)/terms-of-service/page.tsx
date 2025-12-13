// pages/terms-of-service.tsx
import Footer from "@/components/Footer";
import PolicyLayout, { PolicySection } from "@/components/shared/PolicyLayout";
import React from "react";

export default function TermsOfService() {
  return (
    <div className="bg-transparent text-white">
      <PolicyLayout
        title="Terms of Service"
        updated="December 11, 2025"
        intro={
          <>
            <p>
              These Terms govern your use of{" "}
              <strong className="text-nepal-accent">Auction Nepal</strong>. By
              using the platform you accept these terms — read them carefully.
            </p>
          </>
        }
      >
        <nav className="glass-panel p-4 rounded-md mb-4">
          <strong className="block mb-2">Contents</strong>
          <ul className="ml-4 list-disc text-sm text-gray-300">
            <li>
              <a href="#overview" className="hover:underline">
                General overview
              </a>
            </li>
            <li>
              <a href="#user-resp" className="hover:underline">
                User responsibilities
              </a>
            </li>
            <li>
              <a href="#limits" className="hover:underline">
                Platform role & limitations
              </a>
            </li>
            <li>
              <a href="#suspension" className="hover:underline">
                Account suspension
              </a>
            </li>
            <li>
              <a href="#liability" className="hover:underline">
                IP & liability
              </a>
            </li>
          </ul>
        </nav>

        <PolicySection id="overview" title="General Overview">
          <p>
            <strong>Auction Nepal</strong> is a listing and discovery platform
            for users in Nepal to list items and communicate. At this stage the
            platform does <strong>not</strong> process payments or act as an
            escrow. Transactions and fulfillment are arranged between users.
          </p>
        </PolicySection>

        <PolicySection id="user-resp" title="User Responsibilities">
          <p>As a user, you must:</p>
          <ul className="ml-4 list-disc">
            <li>Provide accurate account information</li>
            <li>Ensure listings comply with Nepalese law</li>
            <li>Avoid posting prohibited or misleading content</li>
            <li>Communicate respectfully and lawfully with other users</li>
          </ul>
        </PolicySection>

        <PolicySection id="limits" title="Platform Role & Limitations">
          <ul className="ml-4 list-disc">
            <li>
              We do not verify all user identities or listing authenticity
            </li>
            <li>We do not handle disputes, payments, or fulfilment</li>
            <li>Users transact at their own risk</li>
          </ul>

          <p className="text-gray-300">
            We recommend using trusted payment channels and verifying
            buyers/sellers before transacting.
          </p>
        </PolicySection>

        <PolicySection id="suspension" title="Account Suspension & Removal">
          <p>
            Accounts that violate these terms, engage in fraud, or compromise
            platform safety may be suspended or removed. We act at our
            discretion to protect the community. For serious breaches we may
            preserve records for legal purposes.
          </p>
        </PolicySection>

        <PolicySection id="liability" title="Intellectual Property & Liability">
          <p>
            Platform content is owned by Auction Nepal. Users retain rights to
            the listing content they create. The platform is provided "as is"
            and we are not liable for user-to-user transactions, losses, or
            disputes to the fullest extent permitted by law.
          </p>

          <p className="text-gray-300">
            If you believe your IP rights have been infringed please contact
            support with details.
          </p>
        </PolicySection>

        <PolicySection title="Governing Law & Changes">
          <p>
            These terms are governed by applicable Nepalese law. We may update
            these terms — the page will display the updated date. Continued use
            indicates acceptance.
          </p>
        </PolicySection>
      </PolicyLayout>
      <Footer />
    </div>
  );
}
