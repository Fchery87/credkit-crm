import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    return (
      <motion.div
        initial={false}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="relative"
      >
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-12 w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all duration-150",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            
            // Default state
            "border-input hover:border-input/80",
            
            // Focus state
            "focus-visible:ring-ring focus-visible:border-primary/50",
            
            // Error state
            error && "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive",
            
            // Success state
            success && "border-success focus-visible:ring-success/20 focus-visible:border-success",
            
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {/* Focus ring animation */}
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute inset-0 rounded-xl border-2 pointer-events-none",
              error ? "border-destructive/20" : success ? "border-success/20" : "border-primary/20"
            )}
          />
        )}
      </motion.div>
    )
  }
)
Input.displayName = "Input"

export { Input }
