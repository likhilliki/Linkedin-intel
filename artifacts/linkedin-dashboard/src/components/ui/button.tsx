import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      default: "bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:from-primary/90 hover:to-blue-600/90",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline: "border border-white/10 bg-transparent hover:bg-white/5 text-foreground",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost: "hover:bg-white/5 hover:text-white text-muted-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      glass: "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white shadow-lg",
    }

    const sizes = {
      default: "h-11 px-5 py-2",
      sm: "h-9 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-11 w-11",
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
