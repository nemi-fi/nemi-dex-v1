import { HomeNavbar } from "#/modules/home/ui/components/home-navar/index.js";
import type { ReactNode } from "react";

export const meta = () => [{ title: "Privacy Policy | Nemi" }];

export default function PrivacyPolicy() {
  return (
    <>
      <header role="banner">
        <HomeNavbar />
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-12 min-h-screen">
        <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: October 14, 2026
        </p>

        <Section title="Summary">
          <p>
            Nemi is a privacy-first, non-custodial decentralized exchange
            interface for the Aztec network. We built it so that we do not need
            to know who you are. We do not ask for your name, email address or
            any other account details, we do not set tracking cookies, and we
            never receive your private keys.
          </p>
        </Section>

        <Section title="Who we are">
          <p>
            This policy covers the website at nemi.fi and the web application
            (the &quot;Interface&quot;) operated by the Nemi team
            (&quot;Nemi&quot;, &quot;we&quot;, &quot;us&quot;). It does not
            cover the Aztec network, third-party wallets, or other services you
            reach through links on the Interface.
          </p>
        </Section>

        <Section title="Information we do not collect">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Names, email addresses, phone numbers or other contact details.
            </li>
            <li>Identity documents. There is no KYC.</li>
            <li>
              Private keys, secret keys or seed phrases. Keys of the built-in
              wallet are generated and kept in your browser; keys of an external
              wallet stay in that wallet.
            </li>
            <li>
              Your private balances or the contents of your private
              transactions. These are encrypted on the Aztec network and are
              only readable with your keys.
            </li>
          </ul>
        </Section>

        <Section title="Data stored on your device">
          <p>
            The Interface keeps some data in your browser so that it works
            between visits. This data stays on your device and is not sent to
            us:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Built-in wallet.</strong> If you create an account with
              the built-in wallet, its secret key, account name and related
              Aztec wallet data are stored in your browser&apos;s IndexedDB.
              Anyone with access to your browser profile may be able to use this
              account. Clearing your browser data deletes the account, and we
              cannot recover it for you.
            </li>
            <li>
              <strong>Preferences.</strong> Local storage holds which wallet
              type you use, which account is selected (a public address), and
              whether you have dismissed notices.
            </li>
          </ul>
          <p>
            You can remove all of this at any time by clearing the site data for
            nemi.fi in your browser.
          </p>
        </Section>

        <Section title="Data processed when you use the Interface">
          <p>
            Like any website, using the Interface involves network requests that
            reveal some technical information, such as your IP address, browser
            user agent and the pages or files requested.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Hosting.</strong> The Interface is served by Cloudflare.
              Cloudflare processes request data to deliver the site and protect
              it from abuse, and may keep short-lived logs.
            </li>
            <li>
              <strong>Aztec network access.</strong> To read on-chain state,
              produce quotes and send transactions, your browser talks directly
              to an Aztec node operated by an RPC provider (currently dRPC) and,
              for some operations, an Ethereum node provider (currently
              Alchemy). These providers see your IP address and the requests
              your browser makes, which may include public addresses.
            </li>
            <li>
              <strong>Token icons.</strong> Token icons are fetched through our
              server from a public GitHub repository. Only the token symbol is
              forwarded.
            </li>
            <li>
              <strong>External wallets.</strong> If you connect an external
              Aztec wallet, the connection runs between the Interface in your
              browser and that wallet. The wallet provider&apos;s own privacy
              policy applies to it.
            </li>
          </ul>
          <p>
            We do not use advertising trackers, and we do not sell, rent or
            trade any information about you.
          </p>
        </Section>

        <Section title="Public blockchain data">
          <p>
            Transactions you submit are processed by the Aztec network, which we
            do not control. Aztec is designed to keep private balances and
            transfers confidential, but some data, such as public function
            calls, public state changes, fees and transaction hashes, may be
            public and permanently recorded. We cannot change or delete data
            stored on a blockchain.
          </p>
        </Section>

        <Section title="Communicating with us">
          <p>
            If you email us or contact us through Telegram, Discord, X or
            another channel, we receive whatever you choose to send, along with
            your email address or your handle on that platform. We use it only
            to reply to you. Those platforms have their own privacy policies.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Interface is not intended for anyone under 18, and we do not
            knowingly collect information from children.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Because we do not hold personal data that identifies you, we usually
            have nothing to access, correct or delete. Data on your device is
            under your control. If you believe we hold personal data about you,
            email us at{" "}
            <a href="mailto:morning@nemi.fi" className="underline">
              morning@nemi.fi
            </a>{" "}
            and we will help where the law requires.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy as the Interface changes. We will change
            the date at the top of this page when we do. Continuing to use the
            Interface after an update means you accept the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy can be sent to{" "}
            <a href="mailto:morning@nemi.fi" className="underline">
              morning@nemi.fi
            </a>
            .
          </p>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-medium mb-3">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}
