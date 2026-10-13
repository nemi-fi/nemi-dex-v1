import generateOgImage from "@/lib/og-generator";

export const runtime = "edge";

// Image metadata
export const alt = "Nemi DeFi";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return generateOgImage("home", {
    title: "Nemi DeFi",
    description: "Privacy-focused DEX",
  });
}
