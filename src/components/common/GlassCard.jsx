import React from 'react';

const GlassCard = ({ children, className = '', style = {}, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-4 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
