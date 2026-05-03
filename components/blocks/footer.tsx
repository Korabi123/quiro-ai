import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  Footer,
  FooterBottom,
  FooterColumn,
  FooterContent,
} from "@/components/ui/footer";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  logo?: ReactNode;
  name?: string;
  columns?: FooterColumnProps[];
  copyright?: string;
  policies?: FooterLink[];
  showModeToggle?: boolean;
  className?: string;
}

export default function FooterSection({
  logo = <img src="./branding/logo-standalone-png.png" alt="Quiro AI" className="h-8 w-auto" />,
  name = "Quiro AI",
  columns = [
    {
      title: "Product",
      links: [
        { text: "Sign Up", href: "/sign-up" },
        { text: "LogIn", href: "/login" },
      ],
    },
    {
      title: "Application",
      links: [
        { text: "Meetings", href: "/meetings" },
        { text: "Skill Reports", href: "/reports" },
        { text: "Agents", href: "/agents" },
      ],
    },
  ],
  copyright = "© 2026 Quiro AI. All rights reserved",
  policies = [
    { text: "Privacy Policy", href: "/legal/privacy-policy" },
    { text: "Terms of Service", href: "/legal/terms-conditions" },
    { text: "Cookies Policy", href: "/legal/cookies-policy" },
  ],
  showModeToggle = false,
  className,
}: FooterProps) {
  return (
  <footer className={cn("bg-black w-full px-4", className)}>
      <div className="max-w-container mx-auto">
        <Footer className="bg-black">
          <FooterContent>
            <FooterColumn className="col-span-2 sm:col-span-3 md:col-span-1">
              <div className="flex items-center gap-2">
                {logo}
                <h3 className="text-xl font-bold">{name}</h3>
              </div>
            </FooterColumn>
            {columns.map((column, index) => (
              <FooterColumn key={index}>
                <h3 className="text-md pt-1 font-semibold">{column.title}</h3>
                {column.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.href}
                    className="text-muted-foreground text-sm"
                  >
                    {link.text}
                  </a>
                ))}
              </FooterColumn>
            ))}
          </FooterContent>
          <FooterBottom>
            <div>{copyright}</div>
            <div className="flex items-center gap-4">
              {policies.map((policy, index) => (
                <a key={index} href={policy.href}>
                  {policy.text}
                </a>
              ))}
              {showModeToggle && <ModeToggle />}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  );
}
