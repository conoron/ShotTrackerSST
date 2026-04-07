/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Undo2, 
  Trophy, 
  XCircle, 
  User, 
  RotateCcw, 
  BarChart3,
  Settings,
  X,
  List,
  Clock,
  Flame,
  Layers,
  Timer,
  ChevronDown,
  ChevronUp,
  History,
  Trash2
} from 'lucide-react';

type ShotType = 'winner' | 'mistake';
type Player = 'P1' | 'P2';

interface Shot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: ShotType;
  player: Player;
  timestamp: number;
  gameNumber: number;
}

interface MatchRecord {
  id: string;
  playerNames: Record<Player, string>;
  gameWins: Record<Player, number>;
  shots: Shot[];
  startTime: number;
  endTime: number;
  duration: number;
  winner: Player;
}

export default function App() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [activePlayer, setActivePlayer] = useState<Player>('P1');
  const [activeType, setActiveType] = useState<ShotType>('winner');
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastMatches, setPastMatches] = useState<MatchRecord[]>([]);
  const [isLogCollapsed, setIsLogCollapsed] = useState(true);
  const [statsMode, setStatsMode] = useState<'overall' | 'recent'>('overall');
  const [highlightedShotId, setHighlightedShotId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapPlayer, setHeatmapPlayer] = useState<'All' | Player>('All');
  const [currentGameNumber, setCurrentGameNumber] = useState(1);
  const [gameWins, setGameWins] = useState<Record<Player, number>>({ P1: 0, P2: 0 });
  const [matchStartTime, setMatchStartTime] = useState<number>(Date.now());
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [now, setNow] = useState<number>(Date.now());
  const [playerNames, setPlayerNames] = useState<Record<Player, string>>({
    P1: 'Player 1',
    P2: 'Player 2',
  });
  const courtRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('squash_match_history');
    if (saved) {
      try {
        setPastMatches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('squash_match_history', JSON.stringify(pastMatches));
  }, [pastMatches]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!courtRef.current || matchWinner) return;

    const rect = courtRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newShot: Shot = {
      id: Math.random().toString(36).substring(7),
      x,
      y,
      type: activeType,
      player: activePlayer,
      timestamp: Date.now(),
      gameNumber: currentGameNumber,
    };

    setShots([...shots, newShot]);
    setHighlightedShotId(newShot.id);
  };

  const undoLastShot = () => {
    setShots(shots.slice(0, -1));
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const resetMatch = () => {
    setShots([]);
    setGameWins({ P1: 0, P2: 0 });
    setCurrentGameNumber(1);
    setMatchStartTime(Date.now());
    setGameStartTime(Date.now());
    setShowResetConfirm(false);
  };

  const saveAndEndMatch = () => {
    if (!matchWinner) return;

    const record: MatchRecord = {
      id: Math.random().toString(36).substring(7),
      playerNames: { ...playerNames },
      gameWins: { ...gameWins, [matchWinner]: gameWins[matchWinner] + 1 },
      shots: [...shots],
      startTime: matchStartTime,
      endTime: Date.now(),
      duration: now - matchStartTime,
      winner: matchWinner,
    };

    setPastMatches([record, ...pastMatches]);
    resetMatch();
  };

  const deleteMatchRecord = (id: string) => {
    setPastMatches(pastMatches.filter(m => m.id !== id));
  };

  const getCurrentGameScore = () => {
    let p1 = 0;
    let p2 = 0;
    shots.filter(s => s.gameNumber === currentGameNumber).forEach(shot => {
      if (shot.player === 'P1') {
        if (shot.type === 'winner') p1++;
        else p2++;
      } else {
        if (shot.type === 'winner') p2++;
        else p1++;
      }
    });
    return { p1, p2 };
  };

  const currentScore = getCurrentGameScore();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));
    return parts.join(':');
  };

  const matchDuration = now - matchStartTime;
  const gameDuration = now - gameStartTime;

  const checkGameWinner = () => {
    const { p1, p2 } = currentScore;
    if (p1 >= 11 && p1 - p2 >= 2) return 'P1';
    if (p2 >= 11 && p2 - p1 >= 2) return 'P2';
    return null;
  };

  const gameWinner = checkGameWinner();
  const matchWinner = (gameWinner === 'P1' && gameWins.P1 === 2) ? 'P1' : 
                     (gameWinner === 'P2' && gameWins.P2 === 2) ? 'P2' : null;

  const startNextGame = () => {
    if (gameWinner) {
      setGameWins(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }));
      setCurrentGameNumber(prev => prev + 1);
      setGameStartTime(Date.now());
    }
  };


  const getStats = (player: Player, mode: 'overall' | 'recent' = 'overall') => {
    const relevantShots = mode === 'recent' ? shots.slice(-5) : shots;
    const playerShots = relevantShots.filter(s => s.player === player);
    return {
      winners: playerShots.filter(s => s.type === 'winner').length,
      mistakes: playerShots.filter(s => s.type === 'mistake').length,
      total: playerShots.length,
    };
  };

  const p1Stats = getStats('P1', statsMode);
  const p2Stats = getStats('P2', statsMode);

  const HeatmapOverlay = ({ shots, playerFilter }: { shots: Shot[], playerFilter: 'All' | Player }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const filteredShots = playerFilter === 'All' ? shots : shots.filter(s => s.player === playerFilter);
      if (filteredShots.length === 0) return;

      // Heatmap settings
      const radius = 60; // radius of each point
      
      // Create a temporary canvas to draw the density
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Draw points as radial gradients (alpha only)
      filteredShots.forEach(shot => {
        const x = (shot.x / 100) * canvas.width;
        const y = (shot.y / 100) * canvas.height;

        const gradient = tempCtx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0.25)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        tempCtx.fillStyle = gradient;
        tempCtx.beginPath();
        tempCtx.arc(x, y, radius, 0, Math.PI * 2);
        tempCtx.fill();
      });

      // Colorize the density map
      const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          let r, g, b;
          if (playerFilter === 'P1') {
             r = 99; g = 102; b = 241; // indigo-500
          } else if (playerFilter === 'P2') {
             r = 245; g = 158; b = 11; // amber-500
          } else {
             r = 255; g = 255; b = 255; // white for all
          }
          
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = Math.min(255, alpha * 2.5); 
        }
      }
      ctx.putImageData(imageData, 0, 0);

    }, [shots, playerFilter]);

    return (
      <canvas 
        ref={canvasRef}
        width={800}
        height={1200}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70 mix-blend-screen transition-opacity duration-500"
      />
    );
  };

  const getApproxLocation = (x: number, y: number) => {
    let vertical = '';
    if (y < 33) vertical = 'Front';
    else if (y < 66) vertical = 'Mid';
    else vertical = 'Back';

    let horizontal = '';
    if (x < 33) horizontal = 'Left';
    else if (x < 66) horizontal = 'Center';
    else horizontal = 'Right';

    return `${vertical} ${horizontal}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Player Names</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Player 1</label>
                  <input 
                    type="text" 
                    value={playerNames.P1}
                    onChange={(e) => setPlayerNames({ ...playerNames, P1: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Enter name..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Player 2</label>
                  <input 
                    type="text" 
                    value={playerNames.P2}
                    onChange={(e) => setPlayerNames({ ...playerNames, P2: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Enter name..."
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full mt-8 py-2 rounded-lg bg-indigo-600 font-medium hover:bg-indigo-500 transition-colors"
              >
                Save Changes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Match History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-bold">Match History</h2>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {pastMatches.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 italic">
                    No matches saved yet.
                  </div>
                ) : (
                  pastMatches.map((match) => (
                    <div key={match.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative group">
                      <button 
                        onClick={() => deleteMatchRecord(match.id)}
                        className="absolute top-4 right-4 p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        {new Date(match.endTime).toLocaleDateString()} • {new Date(match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${match.winner === 'P1' ? 'text-indigo-400' : 'text-slate-400'}`}>
                            {match.playerNames.P1}
                          </span>
                          <span className={`text-sm font-bold ${match.winner === 'P2' ? 'text-amber-400' : 'text-slate-400'}`}>
                            {match.playerNames.P2}
                          </span>
                        </div>
                        <div className="flex flex-col items-end font-mono font-black text-lg">
                          <span className={match.winner === 'P1' ? 'text-white' : 'text-slate-600'}>{match.gameWins.P1}</span>
                          <span className={match.winner === 'P2' ? 'text-white' : 'text-slate-600'}>{match.gameWins.P2}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-bold uppercase">
                        <span>{match.shots.length} Shots</span>
                        <span>{formatDuration(match.duration)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2">Reset Match?</h3>
              <p className="text-slate-400 text-sm mb-6">This will permanently delete all recorded shots for this session.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={resetMatch}
                  className="flex-1 py-2 rounded-lg bg-rose-600 font-medium hover:bg-rose-500 transition-colors"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Quick Undo Button (Mobile FAB style) */}
      <AnimatePresence>
        {shots.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={undoLastShot}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-500 active:scale-90 transition-all border-2 border-indigo-400/30"
            aria-label="Undo last shot"
          >
            <Undo2 className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Match Winner Modal */}
      <AnimatePresence>
        {matchWinner && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-slate-900 border-4 border-indigo-500/50 p-10 rounded-[2.5rem] max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
              
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
              </motion.div>
              
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Match Point!</h2>
              <p className="text-slate-400 mb-8">
                <span className="text-2xl font-bold text-indigo-400 block mb-2">{playerNames[matchWinner]}</span>
                has won the match
                <span className="text-4xl font-black text-white mt-4 block tracking-widest">
                  3 - {matchWinner === 'P1' ? gameWins.P2 : gameWins.P1}
                </span>
                <span className="text-xs text-slate-500 mt-2 block uppercase tracking-widest">Final Game Score: {currentScore.p1} - {currentScore.p2}</span>
              </p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={saveAndEndMatch}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <History className="w-6 h-6" />
                  Save & End Match
                </button>
                <button 
                  onClick={undoLastShot}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl transition-all active:scale-95"
                >
                  Undo Last Shot
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Winner Modal */}
      <AnimatePresence>
        {gameWinner && !matchWinner && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-slate-900 border-2 border-emerald-500/30 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center"
            >
              <Trophy className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white mb-2">Game Over!</h2>
              <p className="text-slate-400 mb-6">
                <span className="text-emerald-400 font-bold">{playerNames[gameWinner]}</span> wins Game {currentGameNumber}
                <br />
                <span className="text-3xl font-mono text-white mt-2 block">
                  {currentScore.p1} - {currentScore.p2}
                </span>
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={startNextGame}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Start Game {currentGameNumber + 1}
                </button>
                <button 
                  onClick={undoLastShot}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Undo2 className="w-4 h-4" />
                  Undo Last Shot
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">SquashTracker</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Games</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{gameWins.P1} - {gameWins.P2}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Game {currentGameNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mr-auto ml-8">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Match Time</span>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300">
              <Timer className="w-3 h-3 text-indigo-400" />
              {formatDuration(matchDuration)}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Game Time</span>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300">
              <Clock className="w-3 h-3 text-amber-400" />
              {formatDuration(gameDuration)}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            title="Match History"
          >
            <History className="w-5 h-5 text-indigo-400" />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              setIsLogCollapsed(!isLogCollapsed);
              if (showStats) setShowStats(false);
            }}
            className={`p-2 rounded-full transition-colors ${!isLogCollapsed ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              setShowStats(!showStats);
              if (!isLogCollapsed) setIsLogCollapsed(true);
            }}
            className={`p-2 rounded-full transition-colors ${showStats ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`p-2 rounded-full transition-colors ${showHeatmap ? 'bg-orange-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Flame className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-rose-400"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column: Squash Court & Legend */}
        <div className="flex-1 flex flex-col gap-6 max-w-2xl mx-auto lg:mx-0 w-full">
          {/* Dashboard Grid (Moved to be above court) */}
          <div className={`grid gap-4 ${showHeatmap ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Selection Controls */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-center gap-3 h-32">
              <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                {(['P1', 'P2'] as Player[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePlayer(p)}
                    className={`flex-1 py-2 rounded-lg transition-all truncate px-3 flex items-center justify-between ${
                      activePlayer === p 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">{playerNames[p]}</span>
                    <span className={`font-mono font-black text-lg ${activePlayer === p ? 'text-white' : 'text-slate-400'}`}>
                      {p === 'P1' ? currentScore.p1 : currentScore.p2}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                {(['winner', 'mistake'] as ShotType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeType === t 
                        ? t === 'winner' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-rose-500/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Heatmap Controls (Conditional) */}
            <AnimatePresence>
              {showHeatmap && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-center gap-3 h-32"
                >
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                    <Flame className="w-3 h-3" /> Heatmap Filter
                  </div>
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {(['All', 'P1', 'P2'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setHeatmapPlayer(p)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                          heatmapPlayer === p 
                            ? 'bg-orange-600 text-white shadow-lg' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {p === 'All' ? 'Both' : playerNames[p]}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Squash Court */}
          <div className="relative w-full aspect-[6.4/9.75] bg-[#1e293b] rounded-lg border-4 border-slate-700 overflow-hidden shadow-2xl"
               ref={courtRef}
               onClick={handleCourtClick}>
            {/* Zone Grid Lines (Subtle) */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              {/* Vertical lines */}
              <div className="absolute left-[33.3%] top-0 w-[1px] h-full bg-slate-400" />
              <div className="absolute left-[66.6%] top-0 w-[1px] h-full bg-slate-400" />
              {/* Horizontal lines */}
              <div className="absolute top-[33.3%] left-0 w-full h-[1px] bg-slate-400" />
              <div className="absolute top-[66.6%] left-0 w-full h-[1px] bg-slate-400" />
            </div>

            {/* Court Lines */}
            {/* Front Wall Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-500/50" />
            
            {/* Short Line (approx 4.26m from back wall, court is 9.75m long) */}
            <div className="absolute top-[56.3%] left-0 w-full h-[2px] bg-rose-500/50" />
            
            {/* Half Court Line */}
            <div className="absolute top-[56.3%] left-1/2 w-[2px] h-[43.7%] bg-rose-500/50" />
            
            {/* Service Boxes */}
            <div className="absolute top-[56.3%] left-0 w-[25%] h-[16.4%] border-r-2 border-b-2 border-rose-500/50" />
            <div className="absolute top-[56.3%] right-0 w-[25%] h-[16.4%] border-l-2 border-b-2 border-rose-500/50" />

            {/* Heatmap Overlay */}
            {showHeatmap && <HeatmapOverlay shots={shots} playerFilter={heatmapPlayer} />}

            {/* Shots */}
            <AnimatePresence>
              {shots.map((shot) => (
                <motion.div
                  key={shot.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: highlightedShotId === shot.id ? 1.5 : 1,
                    opacity: 1,
                    zIndex: highlightedShotId === shot.id ? 10 : 1
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 flex items-center justify-center shadow-lg pointer-events-none transition-all duration-300 ${
                    highlightedShotId === shot.id ? 'ring-4 ring-white ring-opacity-50' : ''
                  } ${
                    shot.player === 'P1' ? 'border-indigo-400' : 'border-amber-400'
                  } ${
                    shot.type === 'winner' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
                >
                  <span className="text-[8px] font-bold text-white">
                    {playerNames[shot.player].charAt(0).toUpperCase()}
                  </span>
                  {highlightedShotId === shot.id && (
                    <motion.div 
                      layoutId="highlight-ring"
                      className="absolute inset-0 rounded-full border-2 border-white animate-ping"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Court Label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] pointer-events-none">
              Back Wall
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] pointer-events-none">
              Front Wall
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" /> Winner
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" /> Mistake
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-indigo-400" /> {playerNames.P1}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-amber-400" /> {playerNames.P2}
            </div>
          </div>
        </div>

        {/* Right Column: Dashboard, Stats, History */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Prominent Quick Undo */}
          <button
            onClick={undoLastShot}
            disabled={shots.length === 0}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 border-2 border-indigo-500/20 rounded-xl flex items-center justify-center gap-3 text-indigo-400 font-bold transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100 shadow-xl"
          >
            <Undo2 className="w-5 h-5" />
            Undo Last Shot
          </button>

          {/* Stats Overlay/Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-900 rounded-2xl border border-slate-800 shadow-xl"
              >
                {/* Stats Mode Toggle */}
                <div className="flex justify-center p-2 border-b border-slate-800 bg-slate-900/50">
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button 
                      onClick={() => setStatsMode('overall')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${statsMode === 'overall' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <BarChart3 className="w-3 h-3" />
                      Overall
                    </button>
                    <button 
                      onClick={() => setStatsMode('recent')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${statsMode === 'recent' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Clock className="w-3 h-3" />
                      Last 5 Points
                    </button>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2 truncate">
                      <User className="w-4 h-4 flex-shrink-0" /> {playerNames.P1}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Winners</span>
                      <span className="text-emerald-400 font-mono">{p1Stats.winners}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Mistakes</span>
                      <span className="text-rose-400 font-mono">{p1Stats.mistakes}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2 truncate">
                      <User className="w-4 h-4 flex-shrink-0" /> {playerNames.P2}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Winners</span>
                      <span className="text-emerald-400 font-mono">{p2Stats.winners}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Mistakes</span>
                      <span className="text-rose-400 font-mono">{p2Stats.mistakes}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot History (Collapsible) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <button 
              onClick={() => setIsLogCollapsed(!isLogCollapsed)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Shot History</h3>
                {isLogCollapsed ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronUp className="w-4 h-4 text-slate-600" />}
              </div>
              <span className="text-xs text-slate-500">{shots.length} shots</span>
            </button>
            
            <AnimatePresence>
              {!isLogCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar pt-2 border-t border-slate-800">
                    {shots.length === 0 ? (
                      <div className="py-8 text-center text-slate-600 text-sm italic">
                        No shots recorded yet
                      </div>
                    ) : (
                      [...shots].reverse().map((shot) => (
                        <motion.div
                          key={shot.id}
                          onClick={() => setHighlightedShotId(shot.id === highlightedShotId ? null : shot.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            highlightedShotId === shot.id 
                              ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full ${shot.type === 'winner' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <div>
                              <div className="text-sm font-bold flex items-center gap-2">
                                <span className={shot.player === 'P1' ? 'text-indigo-400' : 'text-amber-400'}>
                                  {playerNames[shot.player]}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                                  shot.type === 'winner' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {shot.type}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {getApproxLocation(shot.x, shot.y)}
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            {new Date(shot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="p-8 text-center text-slate-500 text-sm">
        <p>Tap on the court to record a shot.</p>
        <p className="mt-1 opacity-50 italic">Designed for mobile tracking</p>
      </footer>
    </div>
  );
}
