declare module 'designSystem/Button' {
  interface ButtonProps {
    children: import('react').ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'danger';
    disabled?: boolean;
  }
  export const Button: import('react').ComponentType<ButtonProps>;
}

declare module 'designSystem/GlobalStyles' {
  const GlobalStyles: import('react').ComponentType;
  export default GlobalStyles;
}
