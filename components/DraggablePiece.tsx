
import React from 'react';
import { Piece } from '../types';
import BlockCell from './BlockCell';

interface DraggablePieceProps {
  piece: Piece;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  disabled?: boolean;
}

const DraggablePiece: React.FC<DraggablePieceProps> = ({ piece, onPointerDown, disabled }) => {
  return (
    <div 
      onPointerDown={(e) => !disabled && onPointerDown(e)}
      className={`
        relative p-4 cursor-grab active:cursor-grabbing transition-all duration-300 rounded-2xl flex items-center justify-center
        ${disabled ? 'opacity-0 scale-90 pointer-events-none' : 'bg-[#f5f2ed] hover:bg-white hover:shadow-md'}
      `}
      style={{ minWidth: '100px', minHeight: '100px', touchAction: 'none' }}
    >
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
        }}
      >
        {piece.shape.map((row, r) => 
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className="w-6 h-6">
              {cell === 1 && <BlockCell color={piece.color} size="md" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DraggablePiece;
