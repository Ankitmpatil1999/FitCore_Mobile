import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`login-card ${className}`}>
      {children}
    </div>
  );
}
