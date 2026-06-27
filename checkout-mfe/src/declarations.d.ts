declare module 'designSystem/Button' {
  interface ButtonProps {
    children: import('react').ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
    disabled?: boolean;
    style?: import('react').CSSProperties;
  }
  export const Button: import('react').ComponentType<ButtonProps>;
}

declare module 'designSystem/GlobalStyles' {
  const GlobalStyles: import('react').ComponentType;
  export default GlobalStyles;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: any;
  export default content;
}
