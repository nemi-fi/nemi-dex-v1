"use client";
import { SiDiscord, SiTelegram, SiX } from "@icons-pack/react-simple-icons";
import { sutils } from "@nemi-fi/utils";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer
      className="bg-[#232323] dark:bg-black text-white py-16"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          {/* Logo and Tagline - Left on desktop, centered on mobile */}
          <div className="flex flex-col items-center md:items-start mb-12 md:mb-0">
            <div className="flex flex-col md:flex-row items-center mb-4">
              {/* Nemi Logo */}
              <svg
                width="57"
                height="46"
                viewBox="0 0 57 46"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-3 md:mb-0 md:mr-4"
                aria-hidden="true"
              >
                <path
                  d="M54.1336 22.6352H48.5048C46.9201 22.6352 45.6455 21.3284 45.6947 19.7375C45.7405 18.2042 47.0828 17.0208 48.6235 17.0208C50.115 17.0208 51.3235 15.8154 51.3235 14.3277V8.59656C51.3235 7.04459 50.0625 5.7868 48.5065 5.7868H42.8811C41.3252 5.7868 40.0642 7.04459 40.0642 8.59656C40.0642 10.1773 38.7524 11.4503 37.1575 11.3996C35.6168 11.3505 34.4303 10.0099 34.4303 8.47314V2.98042C34.4303 1.42845 33.1693 0.170654 31.6134 0.170654H25.988C24.4321 0.170654 23.1711 1.42845 23.1711 2.98042V5.7851C23.1711 8.88565 20.6508 11.3996 17.5423 11.3996H13.0796C12.3322 11.3996 11.6169 11.6954 11.0881 12.2212L1.47289 21.8102C0.945779 22.336 0.64917 23.0511 0.64917 23.7967V31.0527C0.64917 32.6046 1.91018 33.8624 3.4661 33.8624H6.27795C9.3915 33.8624 11.9118 36.3763 11.9118 39.4769V42.2866C11.9118 43.8386 13.1728 45.0964 14.7288 45.0964H20.3541C21.9101 45.0964 23.1711 43.8386 23.1711 42.2866V39.4769C23.1711 36.285 25.8406 33.717 29.0727 33.8692C32.0998 34.0112 34.4303 36.613 34.4303 39.6358V42.2883C34.4303 43.8403 35.6914 45.0981 37.2473 45.0981H42.8761C44.432 45.0981 45.693 43.8403 45.693 42.2883V39.4786C45.693 36.378 48.2133 33.8641 51.3218 33.8641H54.1336C55.6896 33.8641 56.9506 32.6063 56.9506 31.0544V25.4433C56.9506 23.8913 55.6896 22.6335 54.1336 22.6335H54.1319L54.1336 22.6352ZM11.9118 25.4044C10.3779 25.4044 9.13387 24.1635 9.13387 22.6335C9.13387 21.1035 10.3779 19.8627 11.9118 19.8627C13.4457 19.8627 14.6898 21.1035 14.6898 22.6335C14.6898 24.1635 13.4457 25.4044 11.9118 25.4044Z"
                  fill="white"
                  className="dark:fill-white"
                />
              </svg>
              <div className="m-6">
                <svg
                  width="84"
                  height="29"
                  viewBox="0 0 84 29"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:hidden mt-2"
                  aria-label="Nemi"
                >
                  <path
                    d="M0.974676 0.985596H5.36995C5.71721 0.985596 6.03763 1.17013 6.2121 1.47209L16.333 18.9106C16.8329 19.7695 18.1498 19.4156 18.1498 18.4224V1.96195C18.1498 1.42344 18.586 0.987272 19.1245 0.987272H21.9126C22.4511 0.987272 22.8873 1.42344 22.8873 1.96195V27.8723C22.8873 28.4108 22.4511 28.8469 21.9126 28.8469H17.5173C17.1701 28.8469 16.8497 28.6624 16.6752 28.3604L6.55432 10.9219C6.0544 10.063 4.7375 10.417 4.7375 11.4101V27.8723C4.7375 28.4108 4.30133 28.8469 3.76282 28.8469H0.974676C0.436171 28.8469 0 28.4108 0 27.8723V1.96195C0 1.42344 0.436171 0.987272 0.974676 0.987272V0.985596Z"
                    fill="white"
                    className="dark:fill-white"
                  />
                  <path
                    d="M28.0069 0.985596H43.6906C44.2291 0.985596 44.6653 1.42177 44.6653 1.96027V4.50853C44.6653 5.04703 44.2291 5.4832 43.6906 5.4832H32.7427C32.2042 5.4832 31.768 5.91938 31.768 6.45788V11.4755C31.768 12.014 32.2042 12.4502 32.7427 12.4502H43.6906C44.2291 12.4502 44.6653 12.8864 44.6653 13.4249V15.9732C44.6653 16.5117 44.2291 16.9478 43.6906 16.9478H32.7427C32.2042 16.9478 31.768 17.384 31.768 17.9225V23.378C31.768 23.9165 32.2042 24.3527 32.7427 24.3527H43.6906C44.2291 24.3527 44.6653 24.7889 44.6653 25.3274V27.8773C44.6653 28.4158 44.2291 28.852 43.6906 28.852H28.0069C27.4684 28.852 27.0322 28.4158 27.0322 27.8773V1.96698C27.0322 1.42848 27.4684 0.992305 28.0069 0.992305V0.985596Z"
                    fill="white"
                    className="dark:fill-white"
                  />
                  <path
                    d="M48.9233 0.985596H54.5064C54.9375 0.985596 55.3149 1.26911 55.4391 1.68012L60.7872 19.59C61.064 20.5177 62.3776 20.5177 62.6544 19.59L67.9992 1.68012C68.1216 1.26743 68.5024 0.985596 68.9319 0.985596H74.4746C75.0131 0.985596 75.4493 1.42177 75.4493 1.96027V27.8706C75.4493 28.4091 75.0131 28.8453 74.4746 28.8453H71.6865C71.148 28.8453 70.7118 28.4091 70.7118 27.8706V14.9347C70.7118 13.8141 69.1282 13.5809 68.8061 14.6562L64.7514 28.1524C64.6289 28.5634 64.2481 28.8453 63.8186 28.8453H59.7287C59.3026 28.8453 58.9234 28.5668 58.7993 28.1591L54.5869 14.4918C54.2564 13.4232 52.6828 13.6614 52.6828 14.777V27.8706C52.6828 28.4091 52.2466 28.8453 51.7081 28.8453H48.92C48.3815 28.8453 47.9453 28.4091 47.9453 27.8706V1.96027C47.9453 1.42177 48.3815 0.985596 48.92 0.985596H48.925H48.9233Z"
                    fill="white"
                    className="dark:fill-white"
                  />
                  <path
                    d="M80.2374 0.985596H83.0255C83.564 0.985596 84.0002 1.42177 84.0002 1.96027V27.8706C84.0002 28.4091 83.564 28.8453 83.0255 28.8453H80.2374C79.6989 28.8453 79.2627 28.4091 79.2627 27.8706V1.96027C79.2627 1.42177 79.6989 0.985596 80.2374 0.985596Z"
                    fill="white"
                    className="dark:fill-white"
                  />
                </svg>
              </div>
            </div>
            <p className="text-lg md:text-left text-center hidden md:block mt-4 dark:text-gray-300">
              Own your assets, own your future.
            </p>
          </div>

          {/* Middle section - Links */}
          <nav
            className="flex flex-col items-center md:items-start mb-8 md:mb-0 space-y-4"
            aria-label="Footer Navigation"
          >
            <Link
              to="https://docs.nemi.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg hover:text-gray-300 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
            >
              Documentation
            </Link>
            <Link
              to="/privacy-policy"
              className="text-lg hover:text-gray-300 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="text-lg hover:text-gray-300 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
            >
              Terms of Service
            </Link>
          </nav>

          {/* Right section - Social Icons */}
          <div
            className="flex justify-center md:justify-end space-x-6 mb-12 md:mb-0"
            aria-label="Social media links"
          >
            {/* Discord Icon */}
            <Link
              to={sutils.appInfo.discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-full p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
              aria-label="Join our Discord community"
            >
              <SiDiscord
                size={24}
                color="#232323"
                className="dark:text-white"
              />
            </Link>

            {/* Twitter/X Icon */}
            <Link
              to="https://x.com/nemi_fi"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-full p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
              aria-label="Follow us on Twitter/X"
            >
              <SiX size={24} color="#232323" className="dark:text-white" />
            </Link>

            {/* Telegram Icon */}
            <Link
              to="https://t.me/nemi_fi"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-full p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
              aria-label="Join our Telegram channel"
            >
              <SiTelegram
                size={24}
                color="#232323"
                className="dark:text-white"
              />
            </Link>
          </div>
        </div>

        {/* Copyright - Always centered */}
        <div className="text-center mt-12 md:mt-16">
          <p className="text-gray-400 dark:text-gray-300">
            © {new Date().getFullYear()} Nemi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
