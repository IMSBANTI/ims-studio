import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "red" | "green" | "yellow" | "blue" | "gray" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
          {
            "bg-studio-red text-white": variant === "default",
            "bg-red-100 text-red-800 border border-red-200": variant === "red",
            "bg-green-100 text-green-800 border border-green-200": variant === "green",
            "bg-yellow-100 text-yellow-800 border border-yellow-200": variant === "yellow",
            "bg-blue-100 text-blue-800 border border-blue-200": variant === "blue",
            "bg-zinc-100 text-zinc-800 border border-zinc-200": variant === "gray",
            "border border-studio-gray-border text-studio-black bg-transparent": variant === "outline",
          }
        ),
        className
      )}
      {...props}
    />
  );
};
