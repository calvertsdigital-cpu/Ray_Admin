import React, { useState } from 'react';
import { imageUrl } from '../../utils/apiEndpoints';

/**
 * ProductImage — renders a product/category/blog image with fallback emoji.
 *
 * Props:
 *   src      {string}  raw path from DB  e.g. "uploads/productImages/foo.jpg"
 *   alt      {string}  alt text
 *   size     {number}  width & height in px (default 38)
 *   fallback {string}  emoji to show when no image / load fails (default '📦')
 *   style    {object}  extra style for the img element
 */
export default function ProductImage({ src, alt = '', size = 38, fallback = '📦', style = {} }) {
  const [failed, setFailed] = useState(false);
  const url = imageUrl(src);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: 6,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    fontSize: Math.round(size * 0.5),
  };

  if (!url || failed) {
    return <div style={containerStyle}>{fallback}</div>;
  }

  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: 6,
        border: '1px solid var(--border)',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
