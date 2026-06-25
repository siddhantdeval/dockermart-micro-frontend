import React from 'react';

declare module 'designSystem/Button' {
  interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'danger';
    disabled?: boolean;
  }
  export const Button: React.ComponentType<ButtonProps>;
}

declare module 'designSystem/GlobalStyles' {
  const GlobalStyles: React.ComponentType;
  export default GlobalStyles;
}
