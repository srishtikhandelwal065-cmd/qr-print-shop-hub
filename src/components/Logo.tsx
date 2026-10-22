import { Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-display text-lg font-bold text-navy">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-teal-foreground">
        <Printer className="h-4 w-4" />
      </span>
      Printex
    </Link>
  );
}
