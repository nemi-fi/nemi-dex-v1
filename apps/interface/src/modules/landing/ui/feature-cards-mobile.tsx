"use client";
import Image from "#/components/Image.js";
import { AspectRatio } from "#/components/ui/aspect-ratio.js";

export default function FeatureCardsMobile() {
  return (
    <section
      className="py-16 relative md:hidden dark:bg-black"
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="reveal flex flex-col justify-between items-start mb-12">
            <h2
              id="features-heading"
              className="text-4xl font-bold text-[#000000] dark:text-white mb-6"
            >
              Why Choose Nemi?
            </h2>
            <p className="text-lg text-[#232323] dark:text-gray-300">
              Experience the next level of decentralised trading with
              unparalleled privacy and programmability.
            </p>
          </div>

          {/* Mobile Feature Cards (Vertical Stack) */}
          <div className="flex flex-col gap-6 mb-16">
            {/* Private Transactions Card */}
            <article className="reveal">
              <div className="puzzle-card-mobile">
                <AspectRatio ratio={1.2} className="w-full">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/cards/small_1.svg"
                      alt="Private Transactions Feature - Secure and anonymous blockchain trading"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      className="object-contain"
                    />
                  </div>
                </AspectRatio>
              </div>
            </article>

            {/* Secure Environment Card */}
            <article className="reveal">
              <div className="puzzle-card-mobile">
                <AspectRatio ratio={1.2} className="w-full">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/cards/small_2.svg"
                      alt="Secure Environment Feature - Protected trading platform with advanced encryption"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                </AspectRatio>
              </div>
            </article>

            {/* Programmable Interface Card */}
            <article className="reveal">
              <div className="puzzle-card-mobile">
                <AspectRatio ratio={1.2} className="w-full">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/cards/small_3.svg"
                      alt="Programmable Interface Feature - Customizable trading strategies and automation"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                </AspectRatio>
              </div>
            </article>
          </div>

          {/* Footer section */}
          <div className="reveal bg-[#232323] dark:bg-gray-800 text-white p-8 rounded-3xl">
            <div className="flex flex-col">
              <div className="mb-6 flex align-center items-center">
                <h3 className="text-3xl font-bold mb-2">
                  Your Keys, Your Crypto,{" "}
                  <span className="italic">Your Privacy</span>
                </h3>
              </div>
              <div>
                <p className="text-lg">
                  At Nemi, we are committed to true ownership. Trade with
                  confidence, knowing your assets and strategies remain 100%
                  <span className="p-[4px] bg-[#E9661E] text-white px-2 py-1 rounded-full mx-[6px]">
                    {" "}
                    private
                  </span>
                  and in your control
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Styling */}
      <style>{`
        .puzzle-card-mobile {
          position: relative;
          width: 100%;
          transition: transform 0.3s ease;
          cursor: pointer;
          overflow: hidden;
          border-radius: 1rem;
        }

        .puzzle-card-mobile:active {
          transform: scale(0.98);
        }

        @media (prefers-color-scheme: dark) {
          .puzzle-card-mobile {
            box-shadow:
              0 4px 6px -1px rgba(0, 0, 0, 0.2),
              0 2px 4px -1px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </section>
  );
}
