import React from 'react';

const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  showArrow = false,
  children,
  ...props
}, ref) => {
  const base = [
    'inline-flex items-center justify-center font-medium',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' ');

  const variants = {
    // Solid — uses foreground/background so it inverts automatically in light mode
    default:     'bg-foreground text-background border border-foreground hover:opacity-85 active:scale-[0.97]',
    // Outline — transparent with foreground border
    outline:     'border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background active:scale-[0.97] rounded-full',
    destructive: 'bg-red-600 text-white hover:bg-red-500 active:scale-[0.97]',
    secondary:   'bg-card text-foreground border border-border hover:border-foreground active:scale-[0.97]',
    ghost:       'bg-transparent text-foreground hover:bg-card active:scale-[0.97]',
    link:        'bg-transparent text-foreground underline-offset-4 hover:underline p-0 h-auto',
  };

  const sizes = {
    default: 'h-12 px-6 rounded-lg hover:rounded-none text-base',
    sm:      'h-10 px-4 rounded-md hover:rounded-none text-sm',
    lg:      'h-14 px-10 rounded-lg hover:rounded-none text-lg',
    icon:    'h-12 w-12 rounded-lg hover:rounded-none',
  };

  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      {...props}
    >
      {children}
      {showArrow && <span className="ml-2">›</span>}
    </button>
  );
});

Button.displayName = 'Button';
export { Button };
