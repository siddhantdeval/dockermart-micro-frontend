import React, { useState } from 'react';
import { tokens } from './tokens';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Button = ({ children, onClick, variant = 'primary', disabled = false, style }: ButtonProps) => {
  const [hovered, setHovered] = useState(false);

  const getColors = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: hovered ? tokens.colors.dangerHover : tokens.colors.danger,
          text: tokens.colors.white,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: hovered ? tokens.colors.secondaryHover : tokens.colors.secondary,
          text: tokens.colors.white,
          border: 'transparent',
        };
      case 'primary':
      default:
        return {
          bg: hovered ? tokens.colors.primaryHover : tokens.colors.primary,
          text: tokens.colors.white,
          border: 'transparent',
        };
    }
  };

  const colors = getColors();

  const buttonStyle: React.CSSProperties = {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: tokens.radii.md,
    fontSize: '14px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontFamily: tokens.fonts.body,
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={buttonStyle}
    >
      {children}
    </button>
  );
};
