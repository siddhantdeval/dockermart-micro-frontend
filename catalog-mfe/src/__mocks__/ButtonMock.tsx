import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
  style?: React.CSSProperties;
}

export const Button = ({ children, onClick, style, variant }: ButtonProps) => (
  <button onClick={onClick} style={style} data-variant={variant}>
    {children}
  </button>
);
