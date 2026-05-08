import React from 'react';

const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = "Card";

export { Card };
