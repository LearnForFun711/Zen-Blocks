
import { Piece } from './types';

export const GRID_SIZE = 8;

export const COLORS = [
  '#FFD1D1', // Soft Pink
  '#FFE3E1', // Pale Rose
  '#D4E2D4', // Sage Green
  '#FFC898', // Soft Orange
  '#B9E9FC', // Sky Blue
  '#F4EAD5', // Cream
  '#C6CBEF', // Lavender
  '#B8E8FC', // Light Cyan
];

export const BASIC_SHAPES: number[][][] = [
  [[1]], // 1x1
  [[1, 1]], // 1x2
  [[1], [1]], // 2x1
  [[1, 1, 1]], // 1x3
  [[1], [1], [1]], // 3x1
  [[1, 1], [1, 1]], // 2x2 Square
  [[1, 1, 1], [0, 1, 0]], // T
  [[0, 1, 0], [1, 1, 1]], // T inverted
  [[1, 1, 1], [1, 0, 0]], // L
  [[1, 1, 1], [0, 0, 1]], // J
  [[1, 1, 0], [0, 1, 1]], // Z
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 1, 1]], // 1x4
  [[1], [1], [1], [1]], // 4x1
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // 3x3
];

export const SPECIAL_SHAPES: number[][][] = [
  [[1, 0], [0, 1]], // 2-Block Diagonal
  [[0, 1], [1, 0]], // 2-Block Diagonal (Alt)
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]], // 3-Block Diagonal
  [[0, 0, 1], [0, 1, 0], [1, 0, 0]], // 3-Block Diagonal (Alt)
  [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], // 4-Block Diagonal
  [[0, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0]], // 4-Block Diagonal (Alt)
];

export const SHAPES = [...BASIC_SHAPES, ...SPECIAL_SHAPES];

export const ZEN_TIPS = [
  "Breathe in, breathe out. Every block finds its place.",
  "Nature does not hurry, yet everything is accomplished.",
  "Focus on the space between the blocks.",
  "A clear mind leads to a clear board.",
  "Patience is the key to a high score.",
  "Let go of the blocks that do not fit.",
  "The journey is the reward, not just the score.",
  "Find your rhythm. Find your flow.",
  "Every line cleared is a small victory.",
  "Simplicity is the ultimate sophistication.",
  "Be like water, flow around the obstacles.",
  "Don't rush. The perfect piece will come.",
  "A single dot can change everything.",
  "Create space, and the score will follow.",
  "Your mind is like this grid; keep it organized.",
  "Quiet the mind and the soul will speak.",
  "One step at a time, one block at a time.",
  "Harmony is found in balance.",
  "Smile. It's just a game of blocks.",
  "There are no mistakes, only happy accidents."
];

export const getRandomTip = () => ZEN_TIPS[Math.floor(Math.random() * ZEN_TIPS.length)];

export const generatePiece = (forceSpecial: boolean = false): Piece => {
  const pool = forceSpecial ? SPECIAL_SHAPES : BASIC_SHAPES;
  const shape = pool[Math.floor(Math.random() * pool.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    id: Math.random().toString(36).substr(2, 9),
    shape,
    color,
  };
};

export const INITIAL_PIECES = (): Piece[] => [
  generatePiece(),
  generatePiece(),
  generatePiece(),
];
