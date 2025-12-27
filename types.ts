
export type Color = string;

export interface Piece {
  id: string;
  shape: number[][]; // 2D array of 0s and 1s
  color: Color;
}

export type Grid = (Color | null)[][];

export enum GameStatus {
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  START = 'START'
}

export interface GameState {
  grid: Grid;
  activePieces: Piece[];
  score: number;
  highScore: number;
  status: GameStatus;
  combo: number;
}
