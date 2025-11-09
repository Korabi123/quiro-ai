"use client";

import { User } from "lucide-react";

import { cn } from "@/lib/utils";

import { PricingColumn, PricingColumnProps } from "../../ui/pricing-column";
import { Section } from "@/components/ui/landing-deps/section";

interface PricingProps {
  title?: string | false;
  description?: string | false;
  plans?: PricingColumnProps[] | false;
  className?: string;
}

export default function Pricing({
  title = "Unlock Your Full Potential with Quiro AI",
  description = "Choose the plan that best fits your career goals and start acing your interviews today.",
  plans = [
    {
      name: "Free",
      description: "For aspiring professionals to practice and improve their interview skills.",
      price: 0,
      priceNote: "Free forever. No credit card required.",
      cta: {
        variant: "glow",
        label: "Start Free Practice",
        href: "/auth/sign-up",
        autoUpgrade: false,
      },
      features: [
        "5 AI Interview Simulations",
        "General Tips (Coming soon)",
        "Monthly Coding Problems (Coming soon)",
      ],
      variant: "default",
      className: "hidden lg:flex",
    },
    {
      name: "Pro",
      icon: <User className="size-4" />,
      description: "For serious job seekers and career changers who want to master their interviews.",
      price: 10,
      priceNote: "Billed monthly. Cancel anytime.",
      cta: {
        variant: "default",
        label: "Go Pro",
        href: "/auth/sign-up",
        autoUpgrade: true,
      },
      features: [
        "Unlimited AI Interview Simulations",
        "Advanced Skill Reports & Analytics",
        "Customizable AI Agents",
        "Personalized Hireability Insights",
        "Priority Support",
      ],
      variant: "glow-brand",
    },
  ],
  className = "",
}: PricingProps) {
  return (
    <Section className={cn(className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12">
        {(title || description) && (
          <div className="flex flex-col items-center gap-4 px-4 text-center sm:gap-8">
            {title && (
              <h2 className="text-3xl leading-tight font-extralight tracking-tight sm:text-5xl sm:leading-tight text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-md text-muted-foreground max-w-[600px] font-medium sm:text-xl">
                {description}
              </p>
            )}
          </div>
        )}
        {plans !== false && plans.length > 0 && (
          <div className="max-w-container mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2">
            {plans.map((plan) => (
              <PricingColumn
                key={plan.name}
                name={plan.name}
                icon={plan.icon}
                description={plan.description}
                price={plan.price}
                priceNote={plan.priceNote}
                cta={plan.cta}
                features={plan.features}
                variant={plan.variant}
                className={plan.className}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
