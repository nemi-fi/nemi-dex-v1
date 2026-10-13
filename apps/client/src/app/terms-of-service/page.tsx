import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service | NEMI",
  description: "Terms of Service for NEMI platform",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms of Service</h1>

      <div className="space-y-6 text-sm md:text-base">
        <p>Last updated: 28.04.2025</p>

        <p>
          Please read these Terms of Service ("Terms", "Terms of Service")
          carefully before using the Nemi platform operated by Nemi ("us", "we",
          or "our").
        </p>

        <section>
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            1. Acceptance of Terms
          </h2>
          <p className="mb-3">
            By accessing or using our platform, you agree to be bound by these
            Terms. If you disagree with any part of the terms, then you may not
            access our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            2. Use of the Platform
          </h2>
          <p className="mb-3">
            You agree to use our platform only for lawful purposes and in
            accordance with these Terms. You are responsible for ensuring that
            your use of the platform complies with applicable laws and
            regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            3. Privacy Policy
          </h2>
          <p className="mb-3">
            Your use of our platform is also governed by our Privacy Policy,
            which is incorporated into these Terms by reference.
          </p>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            4. Intellectual Property
          </h2>
          <p className="mb-3">
            The platform and its original content, features, and functionality
            are owned by Nemi and are protected by international copyright,
            trademark, patent, trade secret, and other intellectual property or
            proprietary rights laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            5. Limitation of Liability
          </h2>
          <p className="mb-3">
            In no event shall Nemi, nor its directors, employees, partners,
            agents, suppliers, or affiliates, be liable for any indirect,
            incidental, special, consequential or punitive damages, including
            without limitation, loss of profits, data, use, goodwill, or other
            intangible losses, resulting from your access to or use of or
            inability to access or use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            6. Changes to Terms
          </h2>
          <p className="mb-3">
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. We will provide notice of any significant
            changes to these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            7. Contact Us
          </h2>
          <p className="mb-3">
            If you have any questions about these Terms, please contact us at{" "}
            <a
              href="mailto:morning@nemi.fi"
              className="text-purple-500 hover:text-purple-400 underline"
            >
              morning@nemi.fi
            </a>
          </p>
          <p>Last updated: 06.05.2025</p>
        </section>

        <div className="mt-8">
          <Button
            size="sm"
            asChild
            className="group flex items-center gap-2 hover:gap-3 transition-all"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
