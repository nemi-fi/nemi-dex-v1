import Image from "#/components/Image.js";
import { Link } from "react-router";

export default function FeaturedByAztec() {
  return (
    <section
      id="featured-by-aztec"
      className="relative w-full overflow-hidden pb-8 dark:bg-black"
      aria-labelledby="featured-heading"
    >
      <div className="container relative z-10 mx-auto px-4">
        <div className="reveal mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2
            id="featured-heading"
            className="mb-14 text-4xl font-bold text-black md:text-5xl dark:text-white"
          >
            Powered By
          </h2>

          <Link
            to="https://aztec.network"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more about Aztec Network"
            className="inline-block w-full max-w-[280px] py-5 transition-[scale,filter] duration-300 hover:scale-105 hover:brightness-110"
          >
            {/* Both logos are rendered; CSS picks the one for the current theme */}
            <Image
              src="/images/aztec/aztec-logo-dark.svg"
              alt="Aztec Logo"
              width={90}
              height={30}
              className="h-auto w-full object-contain dark:hidden"
              style={{ aspectRatio: "3/1" }}
            />
            <Image
              src="/images/aztec/aztec-logo-light.svg"
              alt="Aztec Logo"
              width={90}
              height={30}
              className="hidden h-auto w-full object-contain dark:block"
              style={{ aspectRatio: "3/1" }}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
