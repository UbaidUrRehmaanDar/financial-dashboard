import React from 'react';

const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  children, 
  showArrow = false,
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variants = {
    default: "bg-white text-black hover:bg-white hover:text-black border border-white hover:border-white",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-white rounded-full bg-transparent hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "underline-offset-4 hover:underline text-primary"
  };
  
  const sizes = {
    default: "h-10 py-2.5 px-5 rounded-lg hover:rounded-none",
    sm: "h-9 px-3 rounded-md hover:rounded-none",
    lg: "h-11 px-8 rounded-lg hover:rounded-none",
    icon: "h-10 w-10 rounded-lg hover:rounded-none"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      ref={ref}
      {...props}
    >
      {children}
      {showArrow && <span className="ml-2">{'>'}</span>}
    </button>
  );
});

Button.displayName = "Button";

export { Button };
