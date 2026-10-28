import { HomeNavbar } from "#/modules/home/ui/components/home-navar/index.js";
import type { ReactNode } from "react";
import { Link } from "react-router";

export const meta = () => [{ title: "Terms of Service | Nemi" }];

export default function TermsOfService() {
  return (
    <>
      <header role="banner">
        <HomeNavbar />
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-12 min-h-screen">
        <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: October 14, 2026
        </p>

        <Section title="1. Agreement">
          <p>
            These Terms govern your use of the website at nemi.fi and the web
            application (the &quot;Interface&quot;) provided by the Nemi team
            (&quot;Nemi&quot;, &quot;we&quot;, &quot;us&quot;). By using the
            Interface you agree to these Terms and to our{" "}
            <Link to="/privacy-policy" className="underline">
              Privacy Policy
            </Link>
            . If you do not agree, do not use the Interface.
          </p>
        </Section>

        <Section title="2. What Nemi is">
          <p>
            Nemi is a non-custodial interface to a decentralized exchange
            protocol made of smart contracts on the Aztec network (the
            &quot;Protocol&quot;). Through the Interface you can create or
            connect a wallet, swap tokens, and add or remove liquidity in pools.
            The Interface only prepares transactions; you sign them with your
            own wallet, and they are executed by the Protocol and the Aztec
            network.
          </p>
          <p>
            Nemi is not a broker, exchange operator, custodian, financial
            advisor or counterparty to your trades. We never hold your funds or
            your keys and cannot reverse, cancel or modify a transaction.
          </p>
        </Section>

        <Section title="3. Fees">
          <p>
            Swaps pay the pool fee set by the Protocol, which goes to liquidity
            providers, and transactions may require an Aztec network fee. Fees
            are paid on-chain and cannot be refunded. We may sponsor network
            fees for some transactions, for example from the built-in wallet,
            but we are not obliged to and may stop at any time.
          </p>
        </Section>

        <Section title="4. Eligibility">
          <p>
            You must be at least 18 years old and able to form a binding
            contract to use the Interface. You may not use it if you are subject
            to sanctions, or located in a country or region where using it is
            prohibited, or on behalf of anyone who is. You are responsible for
            complying with the laws that apply to you, including tax
            obligations.
          </p>
        </Section>

        <Section title="5. Your wallet and keys">
          <p>
            The built-in wallet generates a key in your browser and stores it in
            your browser&apos;s storage. We do not receive a copy. If you clear
            your browser data, lose your device, or someone else gains access to
            your browser profile, you may permanently lose access to the account
            or its assets. We cannot recover accounts or keys.
          </p>
          <p>
            If you connect an external wallet, that wallet is provided by a
            third party, and its own terms apply. When connecting, check that
            the verification emoji shown in the Interface matches the one in
            your wallet.
          </p>
        </Section>

        <Section title="6. Transactions and risks">
          <p>
            Using a decentralized exchange carries risk. By using the Interface
            you acknowledge, among others, the following risks:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Smart contracts, zero-knowledge circuits and the Aztec network are
              experimental and may contain bugs or vulnerabilities that lead to
              loss of funds.
            </li>
            <li>
              Quotes are estimates. The amount you receive may differ because of
              price movement, other trades and slippage, within the limits you
              accept.
            </li>
            <li>
              Providing liquidity exposes you to price changes of the pooled
              tokens, including impermanent loss.
            </li>
            <li>
              Transactions may fail, be delayed or be included out of order
              because of network congestion or outages.
            </li>
            <li>
              Some transaction data may be public. Privacy features reduce, but
              do not remove, the possibility that activity is linked to you.
            </li>
            <li>
              Token prices, availability and legal treatment may change quickly.
              Anyone can create a token, and a token appearing in the Interface
              is not an endorsement.
            </li>
          </ul>
          <p>
            You are solely responsible for reviewing and authorizing each
            transaction, and for any fees it requires.
          </p>
        </Section>

        <Section title="7. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              use the Interface for money laundering, terrorist financing,
              sanctions evasion, fraud or any other unlawful purpose;
            </li>
            <li>
              attack, overload or disrupt the Interface or its infrastructure,
              or exploit any bug in it;
            </li>
            <li>manipulate markets or the Protocol, or harm other users;</li>
            <li>impersonate Nemi or its team.</li>
          </ul>
        </Section>

        <Section title="8. Third-party services">
          <p>
            The Interface relies on and links to services we do not control,
            including the Aztec network, node and RPC providers, external
            wallets and block explorers. We are not responsible for their
            availability, accuracy or conduct.
          </p>
        </Section>

        <Section title="9. Intellectual property">
          <p>
            The Nemi name, logo and the design of the Interface belong to Nemi.
            You may use the Interface for its intended purpose, but you may not
            use our name or branding in a way that suggests endorsement or
            affiliation without our permission.
          </p>
        </Section>

        <Section title="10. No warranty">
          <p>
            The Interface is provided &quot;as is&quot; and &quot;as
            available&quot;, without warranties of any kind, express or implied,
            including warranties of merchantability, fitness for a particular
            purpose and non-infringement. We do not guarantee that the Interface
            will be uninterrupted, secure or error-free, or that any information
            shown in it, including prices and quotes, is accurate. Nothing on
            the Interface is financial, investment, legal or tax advice.
          </p>
        </Section>

        <Section title="11. Limitation of liability">
          <p>
            To the maximum extent permitted by law, Nemi and its contributors
            are not liable for any indirect, incidental, special, consequential
            or punitive damages, or for any loss of funds, tokens, data, profits
            or opportunities, arising from your use of or inability to use the
            Interface or the Protocol, even if we were advised of the
            possibility of such damages.
          </p>
        </Section>

        <Section title="12. Indemnity">
          <p>
            You agree to indemnify and hold Nemi and its contributors harmless
            from any claims, losses and expenses arising from your use of the
            Interface or your breach of these Terms or of any law.
          </p>
        </Section>

        <Section title="13. Changes and termination">
          <p>
            We may change, suspend or discontinue the Interface, or restrict
            access to it, at any time and without notice. We may also update
            these Terms; the date at the top of this page shows when they last
            changed. Continuing to use the Interface after an update means you
            accept the updated Terms.
          </p>
        </Section>

        <Section title="14. General">
          <p>
            If any part of these Terms is found unenforceable, the rest remains
            in effect. Our failure to enforce a provision is not a waiver of it.
            These Terms are the entire agreement between you and Nemi about the
            Interface.
          </p>
        </Section>

        <Section title="15. Contact">
          <p>
            Questions about these Terms can be sent to{" "}
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
