import React from 'react';
import './PageWrapper.css';

export default function PageWrapper({ children, className = '' }) {
  return <div className={`page-wrapper ${className}`}>{children}</div>;
}
