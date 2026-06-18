import React from 'react';

export default function Button({ children, isLoading, className = '', ...props }) {
  return (
    <button className={`btn-primary ${className}`} {...props}>
      {isLoading ? (
        <>
          <span className="loading-spinner"></span>
          Authenticating...
        </>
      ) : (
        children
      )}
    </button>
  );
}
