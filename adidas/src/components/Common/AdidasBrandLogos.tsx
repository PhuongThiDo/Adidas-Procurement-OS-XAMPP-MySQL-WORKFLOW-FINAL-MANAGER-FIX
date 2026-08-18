import React from "react";

export const AdidasThreeBars: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 48 32" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Adidas 3 slanted stripes */}
    <polygon points="0,28 8,28 16,14 8,14" />
    <polygon points="14,28 22,28 32,7 24,7" />
    <polygon points="28,28 36,28 48,0 40,0" />
  </svg>
);

export const AdidasTrefoil: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 40 32" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 2C18.5 7 15 14 8 16C15 18 18.5 25 20 30C21.5 25 25 18 32 16C25 14 21.5 7 20 2Z" />
    <path d="M4 18C8 16 11 12 12 6C6 8 4 13 4 18Z" />
    <path d="M36 18C32 16 29 12 28 6C34 8 36 13 36 18Z" />
    <line x1="2" y1="20" x2="38" y2="20" stroke="white" strokeWidth="1.5" />
    <line x1="4" y1="24" x2="36" y2="24" stroke="white" strokeWidth="1.5" />
  </svg>
);
