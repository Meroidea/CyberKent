import { Hero } from "@/components/landing/Hero";
import { ConsoleShowcase } from "@/components/landing/ConsoleShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Capabilities } from "@/components/landing/Capabilities";
import { CommunityAlerts } from "@/components/landing/CommunityAlerts";
import { Awareness } from "@/components/landing/Awareness";
import { TrustAndEthics } from "@/components/landing/TrustAndEthics";
import { SubscribeCta } from "@/components/landing/SubscribeCta";

/**
 * Section order is deliberate: check it → see the service → understand the
 * steps → what is covered → what is circulating → learn → limits → subscribe.
 */
export function LandingPage() {
  return (
    <>
      <Hero />
      <ConsoleShowcase />
      <HowItWorks />
      <Capabilities />
      <CommunityAlerts />
      <Awareness />
      <TrustAndEthics />
      <SubscribeCta />
    </>
  );
}
