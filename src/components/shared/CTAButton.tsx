"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface CTAButtonProps {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline" | "whatsapp" | "ghost";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
  target?: "_blank" | "_self";
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    "bg-gradient-to-l from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-700 hover:to-sky-600",
  secondary:
    "bg-white text-blue-700 border border-blue-200 shadow-md hover:bg-blue-50 hover:shadow-lg",
  outline:
    "bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-700",
  whatsapp:
    "bg-gradient-to-l from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30 hover:from-green-700 hover:to-green-600",
  ghost:
    "bg-transparent text-blue-700 hover:bg-blue-50",
};

const sizeClasses = {
  sm: "text-sm px-4 py-2 gap-1.5",
  md: "text-base px-6 py-3 gap-2",
  lg: "text-lg px-8 py-4 gap-2.5",
};

export default function CTAButton({
  label,
  href,
  variant = "primary",
  icon: Icon,
  iconPosition = "right",
  size = "md",
  className,
  target = "_self",
  fullWidth = false,
}: CTAButtonProps) {
  return (
    <motion.a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
    >
      {Icon && iconPosition === "left" && <Icon className="w-5 h-5 flex-shrink-0" />}
      <span>{label}</span>
      {Icon && iconPosition === "right" && <Icon className="w-5 h-5 flex-shrink-0" />}
    </motion.a>
  );
}
