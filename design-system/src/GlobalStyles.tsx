import { useEffect } from 'react';
import { tokens } from './tokens';

export default function GlobalStyles() {
  useEffect(() => {
    const styleId = 'mfe-global-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.innerHTML = `
        :root {
          --color-primary: ${tokens.colors.primary};
          --color-primary-hover: ${tokens.colors.primaryHover};
          --color-danger: ${tokens.colors.danger};
          --color-danger-hover: ${tokens.colors.dangerHover};
          --color-secondary: ${tokens.colors.secondary};
          --color-secondary-hover: ${tokens.colors.secondaryHover};
          --color-background: ${tokens.colors.background};
          --color-text: ${tokens.colors.text};
          --color-text-light: ${tokens.colors.textLight};
          --color-white: ${tokens.colors.white};
          --color-border: ${tokens.colors.border};
          
          --spacing-xs: ${tokens.spacing.xs};
          --spacing-sm: ${tokens.spacing.sm};
          --spacing-md: ${tokens.spacing.md};
          --spacing-lg: ${tokens.spacing.lg};
          --spacing-xl: ${tokens.spacing.xl};
          
          --radius-sm: ${tokens.radii.sm};
          --radius-md: ${tokens.radii.md};
          --radius-lg: ${tokens.radii.lg};
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: ${tokens.fonts.body};
          background-color: var(--color-background);
          color: var(--color-text);
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: ${tokens.fonts.body};
          color: var(--color-text);
        }
      `;
      document.head.appendChild(styleElement);
    }

    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, []);

  return null;
}
