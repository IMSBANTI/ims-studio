import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
            {
              // Variant styles
              "bg-studio-red text-white hover:bg-studio-red-hover focus:ring-studio-red":
                variant === "primary",
              "bg-studio-gray-border text-studio-black hover:bg-zinc-200 focus:ring-zinc-400":
                variant === "secondary",
              "border border-studio-gray-border text-studio-black bg-transparent hover:bg-studio-gray-bg focus:ring-zinc-400":
                variant === "outline",
              "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500":
                variant === "destructive",
              "text-studio-black hover:bg-studio-gray-bg focus:ring-zinc-400":
                variant === "ghost",
              
              // Size styles
              "px-3 py-1.5 text-xs": size === "sm",
              "px-4 py-2 text-sm": size === "md",
              "px-5 py-2.5 text-base": size === "lg",
            }
          ),
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
