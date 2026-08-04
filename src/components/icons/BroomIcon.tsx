import React from 'react';

export const BroomIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Broom Handle */}
    <path d="M19 3L11 11" />
    {/* Broom Band/Ties */}
    <path d="M9.5 9.5L14.5 14.5" />
    <path d="M8 11L13 16" />
    {/* Broom Sweeping Head */}
    <path d="M6 13L11 18C11 18 6.5 22.5 3 21C2 20.5 2 19 3 17.5C4.5 15.5 6 13 6 13Z" />
  </svg>
);
