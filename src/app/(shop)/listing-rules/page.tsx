import Footer from "@/components/Footer";
import PolicyLayout, { PolicySection } from "@/components/shared/PolicyLayout";
import React from "react";

export default function ListingRules() {
  return (
    <div className="bg-transparent text-white">
      <PolicyLayout
        title="Listing Rules & Content Guidelines"
        intro={
          <>
            <p>
              To keep{" "}
              <strong className="text-nepal-accent">Auction Nepal</strong> a
              safe and trustworthy marketplace we ask all users to follow the
              rules below. Violations may result in{" "}
              <strong>listing removal</strong> or{" "}
              <strong>account suspension</strong>.
            </p>

            {/* Small quick summary box */}
            <div className="mt-4 glass-panel p-3 rounded-lg">
              <strong>Quick summary</strong>
              <ul className="mt-2 ml-4 list-disc text-sm text-gray-300">
                <li>Only list items you own and can lawfully resell</li>
                <li>No illegal, counterfeit, or regulated items</li>
                <li>Use real photos and accurate descriptions</li>
              </ul>
            </div>
          </>
        }
      >
        {/* Table of contents */}
        <nav className="glass-panel p-4 rounded-md mb-4">
          <strong className="block mb-2">On this page</strong>
          <ul className="ml-4 list-disc text-sm text-gray-300">
            <li>
              <a href="#allowed" className="hover:underline">
                Allowed listings
              </a>
            </li>
            <li>
              <a href="#prohibited" className="hover:underline">
                Prohibited items
              </a>
            </li>
            <li>
              <a href="#requirements" className="hover:underline">
                Listing requirements
              </a>
            </li>
            <li>
              <a href="#conduct" className="hover:underline">
                User conduct
              </a>
            </li>
            <li>
              <a href="#enforcement" className="hover:underline">
                Enforcement & reporting
              </a>
            </li>
          </ul>
        </nav>

        <PolicySection id="allowed" title="Allowed Listings">
          <p className="text-gray-300">
            You may list the following items if they comply with local law:
          </p>
          <ul className="ml-4 list-disc">
            <li>
              <strong>Legal physical goods</strong> — items you own and have the
              right to sell
            </li>
            <li>Used items, collectibles, and refurbished products</li>
            <li>Electronics, vehicles, home goods and similar categories</li>
          </ul>

          <p className="text-gray-300">
            Sellers must ensure they have title to the items and that any
            required paperwork is provided to the buyer off-platform when
            relevant.
          </p>
        </PolicySection>

        <PolicySection
          id="prohibited"
          title="Prohibited Items"
          subtitle={<em>Zero tolerance</em>}
        >
          <p className="text-gray-300 mb-2">
            The following are strictly <strong>not allowed</strong>:
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold">Illegal or Controlled Items</h4>
              <ul className="ml-4 list-disc">
                <li>Weapons, firearms, ammunition, explosives</li>
                <li>Illegal drugs and controlled substances</li>
                <li>Stolen, counterfeit, or unlawfully obtained goods</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Sensitive or Regulated</h4>
              <ul className="ml-4 list-disc">
                <li>Prescription medicines and regulated medical equipment</li>
                <li>Alcohol where sale is restricted by law</li>
                <li>
                  SIM cards, verified accounts, or identity-sensitive services
                </li>
              </ul>
            </div>
          </div>

          <h4 className="mt-4 font-semibold">Harmful or Misleading Content</h4>
          <ul className="ml-4 list-disc">
            <li>
              Scams, phishing, or listings designed to harvest personal data
            </li>
            <li>Pornographic or explicit adult material</li>
          </ul>
        </PolicySection>

        <PolicySection id="requirements" title="Listing Requirements">
          <p>Every listing must include:</p>
          <ul className="ml-4 list-disc">
            <li>
              <strong>Accurate title</strong> and clear, honest description of
              condition (new, used, refurbished)
            </li>
            <li>
              <strong>Real photos</strong> of the actual item. Avoid stock
              photos for unique or second-hand items.
            </li>
            <li>Clear pricing and any known defects</li>
            <li>
              Correct category and accurate delivery/collection instructions
            </li>
          </ul>

          <p className="text-gray-300">
            Manipulated or misleading images and deceptive claims are
            prohibited.
          </p>
        </PolicySection>

        <PolicySection id="conduct" title="User Conduct">
          <h4 className="font-semibold">Sellers</h4>
          <ul className="ml-4 list-disc">
            <li>Respond promptly and honestly to buyer inquiries</li>
            <li>
              Remove items once sold and avoid duplicate or phantom listings
            </li>
            <li>Do not artificially inflate bids or prices</li>
          </ul>

          <h4 className="mt-3 font-semibold">Buyers</h4>
          <ul className="ml-4 list-disc">
            <li>Communicate respectfully and make genuine offers</li>
            <li>Avoid fraudulent offers or bid manipulation</li>
          </ul>
        </PolicySection>

        <PolicySection id="enforcement" title="Enforcement & Reporting">
          <p>
            Users can report suspicious listings. We may review, hide or remove
            listings that violate these rules. Repeat or severe violations may
            result in account suspension.
          </p>
          <div className="mt-3 glass-panel p-3 rounded-md">
            <strong>How to report</strong>
            <ol className="ml-4 list-decimal text-sm text-gray-300">
              <li>Open the listing and click "Report"</li>
              <li>
                Provide a brief reason and any evidence (photos, messages)
              </li>
              <li>Our team will review and act where necessary</li>
            </ol>
          </div>
        </PolicySection>

        <PolicySection title="Platform Rights">
          <p>
            We reserve the right to update these rules, remove harmful content,
            and cooperate with authorities when required. Contact support if you
            need clarification.
          </p>
        </PolicySection>
      </PolicyLayout>
      <Footer />
    </div>
  );
}
