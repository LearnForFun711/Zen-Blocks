
import React from 'react';

interface BlockCellProps {
  color: string | null;
  size?: 'sm' | 'md' | 'lg';
  isGhost?: boolean;
  isClearing?: boolean;
  style?: React.CSSProperties;
}

const BlockCell: React.FC<BlockCellProps> = ({ color, size = 'md', isGhost = false, isClearing = false, style = {} }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 rounded-[2px]',
    md: 'w-full aspect-square rounded-[6px]',
    lg: 'w-10 h-10 rounded-[8px]',
  };

  if (!color && !isClearing) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-[#efede8]/40 border border-[#e4e1d9]/20 transition-all duration-300`} 
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} shadow-sm transition-all duration-200 ${isClearing ? 'clearing-animation' : ''}`}
      style={{ 
        backgroundColor: color || undefined,
        opacity: isGhost ? 0.6 : 1,
        boxShadow: isGhost ? 'none' : `inset 0 -2px 0 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.05)`,
        border: isGhost ? '1px dashed rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.4)',
        zIndex: isClearing ? 10 : 1,
        ...style
      }}
    />
  );
};

export default BlockCell;