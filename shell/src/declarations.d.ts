import React from 'react';

declare module 'catalogApp/CatalogRoot' {
  const Component: React.ComponentType;
  export default Component;
}

declare module 'cartApp/CartWidget' {
  const Component: React.ComponentType;
  export default Component;
}

declare module 'checkoutApp/CheckoutRoot' {
  const Component: React.ComponentType;
  export default Component;
}

declare module 'accountApp/AccountRoot' {
  const Component: React.ComponentType;
  export default Component;
}

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
