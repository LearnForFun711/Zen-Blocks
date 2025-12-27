
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GameState, Grid, Piece } from './types';
import { GRID_SIZE, getRandomTip, COLORS } from './constants';
import { canPlacePiece, placePiece, checkLines, isGameOver, getStrategicPieces } from './utils/gameLogic';
import { asmr } from './utils/audioUtils';
import BlockCell from './components/BlockCell';
import DraggablePiece from './components/DraggablePiece';

type AnimSpeed = 'none' | 'fast' | 'medium' | 'slow';

const SPEED_MAP: Record<AnimSpeed, number> = {
  none: 0,
  fast: 200,
  medium: 400,
  slow: 800
};

const DRAG_CELL_SIZE = 40;
const DRAG_CELL_GAP = 4;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
    activePieces: [], 
    score: 0,
    highScore: parseInt(localStorage.getItem('zenBlocks_highScore') || '0'),
    status: GameStatus.START,
    combo: 0,
  });

  const [draggingPiece, setDraggingPiece] = useState<Piece | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number, y: number } | null>(null);
  const [grabOffset, setGrabOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [hoverPos, setHoverPos] = useState<{ r: number, c: number } | null>(null);
  const [zenTip, setZenTip] = useState<string>("Breathe in. Every block has a place.");
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showPerfect, setShowPerfect] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animSpeed, setAnimSpeed] = useState<AnimSpeed>('medium');
  const [showSettings, setShowSettings] = useState(false);
  
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [isProcessingClear, setIsProcessingClear] = useState(false);
  const [perfectGrid, setPerfectGrid] = useState<Grid | null>(null);
  const [isFadingOutPerfect, setIsFadingOutPerfect] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--anim-speed', `${SPEED_MAP[animSpeed]}ms`);
  }, [animSpeed]);

  const rotateTip = useCallback(() => {
    setZenTip(getRandomTip());
  }, []);

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
      if (gameState.activePieces.length === 0) {
        setGameState(prev => ({ ...prev, activePieces: getStrategicPieces(prev.grid) }));
      }
    }
  }, [gameState.status, gameState.activePieces.length]);

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && !isProcessingClear && !perfectGrid && isGameOver(gameState.grid, gameState.activePieces)) {
      // Small delay before showing game over for better flow
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, status: GameStatus.GAMEOVER }));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.grid, gameState.activePieces, gameState.status, isProcessingClear, perfectGrid]);

  useEffect(() => {
    if (gameState.score > gameState.highScore) {
      localStorage.setItem('zenBlocks_highScore', gameState.score.toString());
      setGameState(prev => ({ ...prev, highScore: gameState.score }));
    }
  }, [gameState.score, gameState.highScore]);

  const handleStart = () => {
    const emptyGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    setGameState({
      grid: emptyGrid,
      activePieces: getStrategicPieces(emptyGrid),
      score: 0,
      highScore: parseInt(localStorage.getItem('zenBlocks_highScore') || '0'),
      status: GameStatus.PLAYING,
      combo: 0,
    });
    setDraggingPiece(null);
    setShowPerfect(false);
    rotateTip();
    setShowHowToPlay(false);
    setPerfectGrid(null);
  };

  const handleDragStart = (piece: Piece, e: React.PointerEvent) => {
    if (gameState.status !== GameStatus.PLAYING || isProcessingClear || perfectGrid) return;
    
    const cols = piece.shape[0].length;
    const rows = piece.shape.length;
    const width = cols * DRAG_CELL_SIZE + (cols - 1) * DRAG_CELL_GAP;
    const height = rows * DRAG_CELL_SIZE + (rows - 1) * DRAG_CELL_GAP;
    
    setGrabOffset({ x: width / 2, y: height / 2 });
    setDraggingPiece(piece);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingPiece) return;
    setDragPosition({ x: e.clientX, y: e.clientY });

    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const cellSize = rect.width / GRID_SIZE;
      const visualX = e.clientX - grabOffset.x;
      const visualY = e.clientY - grabOffset.y;
      const r = Math.round((visualY - rect.top) / cellSize);
      const c = Math.round((visualX - rect.left) / cellSize);

      if (r >= -5 && r < GRID_SIZE && c >= -5 && c < GRID_SIZE) {
        setHoverPos({ r, c });
      } else {
        setHoverPos(null);
      }
    }
  }, [draggingPiece, grabOffset]);

  const runPerfectClearSequence = async (clearedGrid: Grid, nextScore: number, nextPieces: Piece[]) => {
    setShowPerfect(true);
    if (soundEnabled) asmr.playPerfectClear();

    // Step 1: Fill screen with random colors gradually
    const fillGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        fillGrid[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
      setPerfectGrid([...fillGrid.map(row => [...row])]);
      await new Promise(res => setTimeout(res, 30));
    }

    await new Promise(res => setTimeout(res, 500));
    
    // Step 2: Global fade out
    setIsFadingOutPerfect(true);
    await new Promise(res => setTimeout(res, 400));

    // Finalize state
    setGameState(prev => ({
      ...prev,
      grid: clearedGrid,
      score: nextScore,
      activePieces: nextPieces,
      combo: prev.combo + 1
    }));

    setPerfectGrid(null);
    setIsFadingOutPerfect(false);
    setShowPerfect(false);
  };

  const handlePointerUp = useCallback(async () => {
    if (!draggingPiece) return;

    const currentPiece = draggingPiece;
    const currentHover = hoverPos;

    setDraggingPiece(null);
    setDragPosition(null);
    setHoverPos(null);

    if (currentHover && canPlacePiece(gameState.grid, currentPiece, currentHover.r, currentHover.c)) {
      const placedGrid = placePiece(gameState.grid, currentPiece, currentHover.r, currentHover.c);
      const piecePoints = currentPiece.shape.flat().filter(x => x === 1).length;
      
      // Update grid immediately so piece is visible
      setGameState(prev => ({ ...prev, grid: placedGrid }));

      const rowsToClear = new Set<number>();
      const colsToClear = new Set<number>();
      for (let r = 0; r < GRID_SIZE; r++) {
        if (placedGrid[r].every(cell => cell !== null)) rowsToClear.add(r);
      }
      for (let c = 0; c < GRID_SIZE; c++) {
        let colFull = true;
        for (let r = 0; r < GRID_SIZE; r++) {
          if (placedGrid[r][c] === null) { colFull = false; break; }
        }
        if (colFull) colsToClear.add(c);
      }

      const linesCleared = rowsToClear.size + colsToClear.size;

      if (linesCleared > 0) {
        setIsProcessingClear(true);
        const newClearingSet = new Set<string>();
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (rowsToClear.has(r) || colsToClear.has(c)) {
              newClearingSet.add(`${r}-${c}`);
            }
          }
        }
        setClearingCells(newClearingSet);
        if (soundEnabled) asmr.playClearSound(gameState.combo);
        
        if (animSpeed !== 'none') {
          await new Promise(resolve => setTimeout(resolve, SPEED_MAP[animSpeed]));
        }
        
        const { newGrid: clearedGrid } = checkLines(placedGrid);
        const linePoints = linesCleared * 10 * (linesCleared + (gameState.combo > 0 ? gameState.combo : 1));
        const isBoardEmpty = clearedGrid.flat().every(cell => cell === null);
        const perfectBonus = isBoardEmpty ? 500 : 0;

        let remainingPieces = gameState.activePieces.filter(p => p.id !== currentPiece.id);
        const shouldReplenishTray = remainingPieces.length === 0 || isBoardEmpty;
        const nextPieces = shouldReplenishTray ? getStrategicPieces(clearedGrid) : remainingPieces;

        const nextScore = gameState.score + piecePoints + linePoints + perfectBonus;

        setClearingCells(new Set());
        setIsProcessingClear(false);

        if (isBoardEmpty) {
          await runPerfectClearSequence(clearedGrid, nextScore, nextPieces);
        } else {
          setGameState(prev => ({
            ...prev,
            grid: clearedGrid,
            score: nextScore,
            activePieces: nextPieces,
            combo: prev.combo + 1
          }));
        }
      } else {
        if (soundEnabled) asmr.playPlaceSound();
        let remainingPieces = gameState.activePieces.filter(p => p.id !== currentPiece.id);
        const shouldReplenishTray = remainingPieces.length === 0;
        const nextPieces = shouldReplenishTray ? getStrategicPieces(placedGrid) : remainingPieces;

        setGameState(prev => ({
          ...prev,
          grid: placedGrid,
          score: prev.score + piecePoints,
          activePieces: nextPieces,
          combo: 0
        }));
      }

      if (linesCleared > 0 || Math.random() > 0.8) rotateTip();
    }
  }, [draggingPiece, hoverPos, gameState, rotateTip, soundEnabled, animSpeed]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-6 px-4 relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md flex justify-between items-center mb-2 z-10">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-[#9a8c81]">Zen Blocks</h1>
          <p className="text-sm font-medium text-[#b7ada3] max-w-[220px] leading-tight min-h-[40px] italic">
            "{zenTip}"
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex gap-2 mb-1">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-white shadow-sm text-pink-400' : 'text-gray-400 hover:text-gray-600'}`}
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full transition-colors ${soundEnabled ? 'text-blue-400' : 'text-gray-300'}`}
            >
              {soundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              )}
            </button>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-[#b7ada3]">High Score</div>
          <div className="text-2xl font-bold text-[#8a7e75]">{gameState.highScore}</div>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-24 right-4 z-50 glass-panel p-4 rounded-3xl shadow-xl w-48 transition-all">
          <h3 className="text-xs font-bold text-[#9a8c81] mb-3 uppercase tracking-wider">Animation Speed</h3>
          <div className="flex flex-col gap-2">
            {(['none', 'fast', 'medium', 'slow'] as AnimSpeed[]).map(speed => (
              <button 
                key={speed}
                onClick={() => { setAnimSpeed(speed); setShowSettings(false); }}
                className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all ${animSpeed === speed ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-50 text-gray-500'}`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-md flex flex-col items-center relative">
        <div className="mb-4 flex flex-col items-center">
          <span className="text-5xl font-bold text-[#7d6e63] mb-1">{gameState.score}</span>
          {gameState.combo > 1 && (
            <span className="text-sm font-bold text-pink-400 bg-pink-50 px-3 py-1 rounded-full animate-pulse">
              {gameState.combo} COMBO!
            </span>
          )}
        </div>

        {showPerfect && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none">
            <div className="perfect-ripple w-64 h-64" style={{ animationDelay: '0s' }}></div>
            <div className="perfect-ripple w-64 h-64" style={{ animationDelay: '0.2s' }}></div>
            <div className="bg-yellow-400 text-white font-black text-4xl px-8 py-4 rounded-full shadow-2xl scale-110 animate-bounce tracking-widest border-4 border-white">
              PERFECT!
            </div>
            <div className="text-yellow-600 font-bold text-xl mt-2 drop-shadow-sm">+500 BONUS</div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-[24px] shadow-xl border-8 border-white relative overflow-hidden">
          <div 
            ref={gridRef}
            className={`game-grid grid grid-cols-8 gap-1 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] ${isFadingOutPerfect ? 'perfect-fade-out' : ''}`}
          >
            {gameState.grid.map((row, r) => (
              row.map((cell, c) => {
                const cellId = `${r}-${c}`;
                const isClearing = clearingCells.has(cellId);
                const perfectCell = perfectGrid ? perfectGrid[r][c] : null;
                
                let ghostColor = null;
                let isInvalid = false;
                if (draggingPiece && hoverPos) {
                  const localR = r - hoverPos.r;
                  const localC = c - hoverPos.c;
                  if (
                    localR >= 0 && localR < draggingPiece.shape.length &&
                    localC >= 0 && localC < draggingPiece.shape[0].length &&
                    draggingPiece.shape[localR][localC] === 1
                  ) {
                    const isValid = canPlacePiece(gameState.grid, draggingPiece, hoverPos.r, hoverPos.c);
                    ghostColor = isValid ? draggingPiece.color : '#e0e0e0'; 
                    isInvalid = !isValid;
                  }
                }

                return (
                  <div key={cellId} className="relative">
                    <BlockCell 
                      color={perfectCell || cell || ghostColor} 
                      isGhost={!cell && !!ghostColor && !isClearing && !perfectCell} 
                      isClearing={isClearing}
                      style={{
                        ...(isInvalid ? { 
                          opacity: 0.15, 
                          backgroundColor: '#666', 
                          border: '1px solid #333',
                          boxShadow: 'none'
                        } : {}),
                        ...(perfectCell ? { animation: 'quick-fill 0.15s ease-out forwards' } : {})
                      }}
                    />
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-md flex justify-around items-center gap-2 mt-4">
        {gameState.activePieces.map((piece) => (
          <DraggablePiece 
            key={piece.id}
            piece={piece}
            isSelected={false}
            onPointerDown={(e) => handleDragStart(piece, e)}
            disabled={gameState.status !== GameStatus.PLAYING || draggingPiece?.id === piece.id || isProcessingClear || !!perfectGrid}
          />
        ))}
      </div>

      <div className="w-full max-w-md mt-6 px-2">
        <div className="w-full h-16 bg-[#f5f2ed] border border-[#e4e1d9] rounded-xl flex items-center justify-center relative overflow-hidden group hover:bg-[#fffdfa] transition-colors cursor-pointer">
          <div className="absolute top-1 left-2 text-[8px] font-bold text-[#b7ada3] uppercase tracking-tighter">Advertisement</div>
          <div className="text-[#9a8c81] text-xs font-medium opacity-60">Google Ads Banner Space</div>
          <div className="absolute right-2 text-[#9a8c81] opacity-20 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </div>
        </div>
      </div>

      {draggingPiece && dragPosition && (
        <div 
          className="fixed pointer-events-none z-[100] transform transition-transform duration-75"
          style={{ 
            left: dragPosition.x - grabOffset.x, 
            top: dragPosition.y - grabOffset.y,
            willChange: 'transform'
          }}
        >
          <div 
            className="grid"
            style={{ 
              gridTemplateColumns: `repeat(${draggingPiece.shape[0].length}, ${DRAG_CELL_SIZE}px)`,
              gap: `${DRAG_CELL_GAP}px`,
            }}
          >
            {draggingPiece.shape.map((row, r) => 
              row.map((cell, c) => (
                <div key={`drag-${r}-${c}`} style={{ width: DRAG_CELL_SIZE, height: DRAG_CELL_SIZE }}>
                  {cell === 1 && <BlockCell color={draggingPiece.color} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {(gameState.status === GameStatus.START || gameState.status === GameStatus.GAMEOVER) && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-overlay">
          <div className="max-w-xs w-full bg-[#fdfaf6] p-8 rounded-[40px] shadow-2xl border-4 border-white floating overflow-y-auto max-h-[90vh]">
            {gameState.status === GameStatus.START ? (
              <>
                <h2 className="text-4xl font-bold text-[#7d6e63] mb-4">Zen Blocks</h2>
                <p className="text-[#b7ada3] mb-6 leading-relaxed">Relax your mind, drag blocks to the grid, and find your flow.</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleStart}
                    className="w-full py-4 bg-[#b9e9fc] hover:bg-[#a8def3] text-[#5b7a85] font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    Start Journey
                  </button>
                  <button 
                    onClick={() => setShowHowToPlay(true)}
                    className="w-full py-3 bg-[#f5f2ed] hover:bg-[#ebe8e3] text-[#9a8c81] font-semibold rounded-2xl transition-all"
                  >
                    How to Play
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-[#7d6e63] mb-2">Game Over</h2>
                <div className="text-sm text-[#b7ada3] mb-6 font-medium">Your score: {gameState.score}</div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleStart}
                    className="w-full py-4 bg-[#ffd1d1] hover:bg-[#fcc1c1] text-[#915656] font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => setShowHowToPlay(true)}
                    className="w-full py-3 bg-[#f5f2ed] hover:bg-[#ebe8e3] text-[#9a8c81] font-semibold rounded-2xl transition-all"
                  >
                    Rules & Scoring
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showHowToPlay && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-overlay">
          <div className="max-w-md w-full bg-white p-8 rounded-[40px] shadow-2xl border-4 border-white overflow-y-auto max-h-[85vh] text-left">
            <h2 className="text-3xl font-bold text-[#7d6e63] mb-6 text-center">How to Play</h2>
            <div className="space-y-6 text-[#9a8c81]">
              <section>
                <h3 className="text-lg font-bold text-[#7d6e63] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xs">1</span>
                  The Objective
                </h3>
                <p className="text-sm leading-relaxed">Fill the 8x8 grid with blocks. Clear full rows or columns to keep the board open and earn points.</p>
              </section>
              <section>
                <h3 className="text-lg font-bold text-[#7d6e63] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center text-xs">2</span>
                  Scoring System
                </h3>
                <ul className="text-sm space-y-2 list-disc pl-5">
                  <li><strong>Placement:</strong> Get 1 point for every single block in the piece you place.</li>
                  <li><strong>Line Clears:</strong> Clearing a line grants <strong>10 base points</strong>.</li>
                  <li><strong>Combos:</strong> Clear lines on consecutive turns for multipliers.</li>
                  <li><strong>Perfect Clear:</strong> Clear the entire board for <strong>500 bonus points</strong> and a beautiful celebration!</li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-bold text-[#7d6e63] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center text-xs">3</span>
                  Strategy
                </h3>
                <p className="text-sm leading-relaxed">The game ends when no pieces can fit. <strong>Special Diagonal Pieces</strong> appear only when the board is nearly full to help you out!</p>
              </section>
            </div>
            <button onClick={() => setShowHowToPlay(false)} className="mt-8 w-full py-4 bg-[#f4ead5] hover:bg-[#ede0c5] text-[#8a7e75] font-bold rounded-2xl transition-all shadow-md active:scale-95">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
