import { PasswordProtection } from "#/components/PasswordProtection.js";
import { BlockchainControlsWrapper } from "#/components/BlockchainControlsWrapper.js";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <h1 className="text-3xl font-bold">Blockchain Setup</h1>
        <p className="text-muted-foreground">
          Use the controls below to initialize the blockchain and setup the DEX.
        </p>
        <PasswordProtection>
          <BlockchainControlsWrapper />
        </PasswordProtection>
      </div>
    </main>
  );
}
