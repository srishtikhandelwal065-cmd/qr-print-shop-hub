import { Link } from "@tanstack/react-router";
import printexLogo from "@/assets/printex-logo.png";

export function Logo({ to = "/", className = "h-7" }: { to?: string; className?: string }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center" aria-label="Printex home">
      <img src={printexLogo} alt="Printex" className={`${className} w-auto`} />
    </Link>
  );
}
