import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}

export const Button = ({ children, onClick, disabled }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
