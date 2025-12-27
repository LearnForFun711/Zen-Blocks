
import { Grid, Piece } from '../types';
import { GRID_SIZE, BASIC_SHAPES, SPECIAL_SHAPES, COLORS } from '../constants';

export const canPlacePiece = (grid: Grid, piece: Piece, row: number, col: number): boolean => {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] === 1) {
        const targetRow = row + r;
        const targetCol = col + c;

        if (
          targetRow < 0 ||
          targetRow >= GRID_SIZE ||
          targetCol < 0 ||
          targetCol >= GRID_SIZE ||
          grid[targetRow][targetCol] !== null
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

export const placePiece = (grid: Grid, piece: Piece, row: number, col: number): Grid => {
  const newGrid = grid.map(r => [...r]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] === 1) {
        newGrid[row + r][col + c] = piece.color;
      }
    }
  }
  return newGrid;
};

export const checkLines = (grid: Grid): { newGrid: Grid; linesCleared: number } => {
  const rowsToClear = new Set<number>();
  const colsToClear = new Set<number>();

  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every(cell => cell !== null)) rowsToClear.add(r);
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let colFull = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        colFull = false;
        break;
      }
    }
    if (colFull) colsToClear.add(c);
  }

  const newGrid = grid.map((row, r) => 
    row.map((cell, c) => (rowsToClear.has(r) || colsToClear.has(c) ? null : cell))
  );

  return { newGrid, linesCleared: rowsToClear.size + colsToClear.size };
};

export const isGameOver = (grid: Grid, activePieces: Piece[]): boolean => {
  if (activePieces.length === 0) return false;
  return !activePieces.some(piece => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlacePiece(grid, piece, r, c)) return true;
      }
    }
    return false;
  });
};

export const getStrategicPieces = (grid: Grid): Piece[] => {
  const filledCells = grid.flat().filter(cell => cell !== null).length;
  const density = filledCells / (GRID_SIZE * GRID_SIZE);
  
  // Diagonal pieces only appear if density > 65% or with 5% chance
  const allowSpecial = density > 0.65 || Math.random() < 0.05;
  const currentShapePool = allowSpecial ? [...BASIC_SHAPES, ...SPECIAL_SHAPES] : BASIC_SHAPES;

  const pieces: Piece[] = [];
  
  const scoreShape = (shape: number[][]) => {
    let maxLines = 0;
    let canFit = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const dummyPiece: Piece = { id: 'test', shape, color: '' };
        if (canPlacePiece(grid, dummyPiece, r, c)) {
          canFit = true;
          const simulatedGrid = placePiece(grid, dummyPiece, r, c);
          const { linesCleared } = checkLines(simulatedGrid);
          if (linesCleared > maxLines) maxLines = linesCleared;
        }
      }
    }
    return { maxLines, canFit };
  };

  const scoredShapes = currentShapePool.map((shape, index) => ({
    shape,
    ...scoreShape(shape)
  }));

  const getRand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

  // 1. "Hero" piece
  const clearingShapes = scoredShapes.filter(s => s.maxLines > 0);
  const p1Shape = clearingShapes.length > 0 
    ? getRand(clearingShapes).shape 
    : (scoredShapes.filter(s => s.canFit).length > 0 ? getRand(scoredShapes.filter(s => s.canFit)).shape : getRand(BASIC_SHAPES));

  // 2. "Safe" piece (weighted small)
  const fittingShapes = scoredShapes.filter(s => s.canFit);
  const smallFitting = fittingShapes.filter(s => s.shape.flat().filter(x => x === 1).length <= 4);
  const p2Shape = smallFitting.length > 0 ? getRand(smallFitting).shape : (fittingShapes.length > 0 ? getRand(fittingShapes).shape : getRand(BASIC_SHAPES));

  // 3. Random "Diversity" piece
  const p3Shape = getRand(currentShapePool);

  [p1Shape, p2Shape, p3Shape].forEach(shape => {
    pieces.push({
      id: Math.random().toString(36).substr(2, 9),
      shape,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
  });

  return pieces;
};
