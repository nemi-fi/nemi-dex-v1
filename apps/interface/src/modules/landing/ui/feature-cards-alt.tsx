"use client";
import Image from "#/components/Image.js";
import { AspectRatio } from "#/components/ui/aspect-ratio.js";

export default function FeatureCards() {
  return (
    <section className="py-16 relative" aria-labelledby="features-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="reveal flex flex-col lg:flex-row justify-between items-start mb-16 lg:mb-24">
            <h2
              id="features-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#000000] dark:text-white mb-8 lg:mb-0 lg:max-w-md"
            >
              Why Choose Nemi?
            </h2>
            <p className="text-lg lg:text-xl text-[#232323] dark:text-gray-300 lg:max-w-md">
              Experience the next level of decentralised trading with
              unparalleled privacy and programmability.
            </p>
          </div>

          {/* Feature Cards - New Layout with SVG Images */}
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 list-none p-0">
            {/* Private Transactions Card */}
            <li className="reveal relative">
              <article className="puzzle-card h-full">
                <AspectRatio ratio={2} className="w-full">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/cards/1.svg"
                      alt="Private Transactions"
                      fill
                      className="object-contain transition-transform duration-500 "
                    />
                  </div>
                </AspectRatio>
                <div className="card-content absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90">
                  <h3 className="puzzle-title text-lg font-semibold">
                    Private Transactions
                  </h3>
                  <p className="puzzle-description text-sm light:text-gray-900 dark:text-white">
                    Trade without revealing your strategy
                  </p>
                </div>
              </article>
            </li>

            {/* Secure Environment Card */}
            <li className="reveal relative">
              <article className="puzzle-card h-full">
                <AspectRatio ratio={2} className="w-full">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/cards/2.svg"
                      alt="Secure Environment"
                      fill
                      className="object-contain transition-transform duration-500 "
                    />
                  </div>
                </AspectRatio>
                <div className="card-content absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90">
                  <h3 className="puzzle-title text-lg font-semibold">
                    Secure Environment
                  </h3>
                  <p className="puzzle-description text-sm light:text-gray-900 dark:text-white">
                    Protection from front-running and MEV
                  </p>
                </div>
              </article>
            </li>

            {/* Programmable Interface Card */}
            <li className="reveal relative">
              <article className="puzzle-card h-full">
                <AspectRatio ratio={2} className="w-full">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/cards/3.svg"
                      alt="Programmable Interface"
                      fill
                      className="object-contain transition-transform duration-500 "
                    />
                  </div>
                </AspectRatio>
                <div className="card-content absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90">
                  <h3 className="puzzle-title text-lg font-semibold">
                    Programmable Interface
                  </h3>
                  <p className="puzzle-description text-sm light:text-gray-900 dark:text-white">
                    Deploy custom trading algorithms privately
                  </p>
                </div>
              </article>
            </li>
          </ul>

          {/* Footer section */}
          <div className="reveal bg-[#232323] dark:bg-gray-800 text-white p-8 md:p-12 rounded-3xl">
            <div className="flex flex-col lg:flex-row justify-between">
              <div className="mb-6 lg:mb-0 flex align-center items-center">
                <h2 className="text-3xl lg:text-4xl font-bold mb-2">
                  Your Keys, Your Crypto,{" "}
                  <span className="italic">Your Privacy</span>
                </h2>
              </div>
              <div className="lg:max-w-md">
                <p className="text-lg">
                  At Nemi, we are committed to true ownership. Trade with
                  confidence, knowing your assets and strategies remain 100%
                  <span className="p-[4px] bg-[#E9661E] text-white px-2 py-1 rounded-full mx-[6px]">
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
        .puzzle-card {
          position: relative;
          width: 100%;
          transition: all 0.5s ease;
          cursor: pointer;
          overflow: hidden;
          border-radius: 1rem;
        }

        .puzzle-card:hover .puzzle-title {
          color: #e9661e;
        }

        .card-content {
          transition: all 0.3s ease;
          transform: translateY(100%);
          opacity: 0;
        }

        .puzzle-card:hover .card-content {
          transform: translateY(0);
          opacity: 1;
        }

        .puzzle-title {
          color: #11111;
          transition: color 0.3s ease;
        }

        .puzzle-description {
          transition: color 0.3s ease;
        }

        @media (prefers-color-scheme: dark) {
          .puzzle-title {
            color: #ffffff;
          }

          .puzzle-card:hover .puzzle-title {
            color: #f6923d;
          }
        }
      `}</style>
    </section>
  );
}
