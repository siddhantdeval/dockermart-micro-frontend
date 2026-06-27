declare module 'catalogApp/CatalogRoot' {
  const Component: import('react').ComponentType;
  export default Component;
}

declare module 'cartApp/CartWidget' {
  const Component: import('react').ComponentType;
  export default Component;
}

declare module 'checkoutApp/CheckoutRoot' {
  const Component: import('react').ComponentType;
  export default Component;
}

declare module 'accountApp/AccountRoot' {
  const Component: import('react').ComponentType;
  export default Component;
}

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
