"use client";
import { type FC, useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
interface StaticLogoProps {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  fullLogo?: boolean;
}

export const StaticLogo: FC<StaticLogoProps> = ({
  width = 200,
  height = 58,
  className = "",
  fullLogo = true,
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render the logo after first mount
  useEffect(() => {
    setMounted(true);
  }, []);

  let srcShortLogo =
    mounted && resolvedTheme === "dark"
      ? "/images/logo/NemiLogoLight.svg"
      : "/images/logo/NemiLogoDark.svg";

  let srcFullLogo =
    mounted && resolvedTheme === "dark"
      ? "/images/logo/NemiLight.svg"
      : "/images/logo/NemiDark.svg";

  return (
    <Image
      src={fullLogo ? srcFullLogo : srcShortLogo}
      alt="Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
};
