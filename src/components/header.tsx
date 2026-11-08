"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

const links = [
  ["/app", "Verify & send"],
  ["/contacts", "Contacts"],
  ["/activity", "Activity"],
  ["/learn", "Safety guide"],
] as const;

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="SendShield home">
          <span className="brand-icon"><ShieldCheck size={24} strokeWidth={1.9} /></span>
          <span>Send<span className="brand-light">Shield</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={pathname === href ? "active" : ""}>{label}</Link>
          ))}
        </nav>
        <a className="header-docs" href="https://solana.com/docs/payments/send-payments/verify-address" target="_blank" rel="noreferrer">Solana docs <ArrowUpRight size={15} /></a>
      </div>
    </header>
  );
}
