import React from 'react';

export const Button = ({ children, onClick, style, variant }: any) => (
  <button onClick={onClick} style={style} data-variant={variant}>
    {children}
  </button>
);
