import { memo, useEffect, useState } from "react";

interface Benefit {
  id: string;
  number: string;
  color: string;
  colorDark?: string;
  title: string;
  description: string;
}

interface BenefitItemProps {
  benefit: Benefit;
  isVisible: boolean;
  index: number;
  isLast: boolean;
  svgPath: string;
}

export const BenefitItem = memo(function BenefitItem({
  benefit,
  isVisible,
  index,
  isLast,
  svgPath,
}: BenefitItemProps) {
  const { color, colorDark, title, description } = benefit;
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Check initial dark mode preference
      const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(darkModeQuery.matches);

      // Listen for changes in color scheme preference
      const darkModeHandler = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };

      darkModeQuery.addEventListener("change", darkModeHandler);

      // Check if data-theme attribute is set to dark
      const htmlElement = document.documentElement;
      const observer = new MutationObserver(() => {
        if (htmlElement.classList.contains("dark")) {
          setIsDarkMode(true);
        } else if (htmlElement.getAttribute("data-theme") === "dark") {
          setIsDarkMode(true);
        } else {
          setIsDarkMode(darkModeQuery.matches);
        }
      });

      observer.observe(htmlElement, { attributes: true });

      return () => {
        darkModeQuery.removeEventListener("change", darkModeHandler);
        observer.disconnect();
      };
    }
  }, []);

  // Calculate SVG viewBox based on the number
  const getViewBox = (number: string) => {
    switch (number) {
      case "1":
        return "0 0 20 40";
      case "2":
        return "0 0 25 40";
      case "3":
        return "0 0 25 40";
      case "4":
        return "0 0 24 40";
      default:
        return "0 0 24 40";
    }
  };

  // Get the appropriate color based on dark mode
  const getBgColor = () => {
    if (isDarkMode && colorDark) {
      return colorDark;
    }
    return color;
  };

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="flex items-center py-6">
        <div
          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center mr-6 shadow-md"
          style={{ backgroundColor: getBgColor() }}
        >
          <svg
            viewBox={getViewBox(benefit.number)}
            width="24"
            height="24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-10"
            aria-hidden="true"
          >
            <path d={svgPath} fill="white" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-1 text-black dark:text-white">
            {title}
          </h3>
          <p className="text-base text-gray-800 dark:text-gray-200">
            {description}
          </p>
        </div>
      </div>
      {!isLast && (
        <div className="border-t border-gray-300 dark:border-gray-700"></div>
      )}
    </div>
  );
});
