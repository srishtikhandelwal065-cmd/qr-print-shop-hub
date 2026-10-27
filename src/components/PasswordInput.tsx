import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, style, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn(
            "field pr-11 transition-colors",
            className
          )}
          style={{
            color: "#0f172a",
            backgroundColor: "#ffffff",
            caretColor: "#0f172a",
            ...style,
          }}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
