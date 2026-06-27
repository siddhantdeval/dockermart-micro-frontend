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
        * {
          box-sizing: border-box;
        }
        body {
          font-family: ${tokens.fonts.body};
          background-color: ${tokens.colors.background};
          color: ${tokens.colors.text};
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: ${tokens.fonts.body};
          color: ${tokens.colors.text};
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
