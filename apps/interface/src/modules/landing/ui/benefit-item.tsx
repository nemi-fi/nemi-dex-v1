import { memo, type CSSProperties } from "react";

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
  isLast: boolean;
  svgPath: string;
}

export const BenefitItem = memo(function BenefitItem({
  benefit,
  isLast,
  svgPath,
}: BenefitItemProps) {
  const { color, colorDark, title, description } = benefit;
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

  return (
    <div className="reveal">
      <div className="flex items-center py-6">
        <div
          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center mr-6 shadow-md bg-(--badge) dark:bg-(--badge-dark)"
          style={
            {
              "--badge": color,
              "--badge-dark": colorDark ?? color,
            } as CSSProperties
          }
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
