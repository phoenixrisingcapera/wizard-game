import React, { useCallback, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, Player, Appearance, Stats, Weapon } from './types';
import { generatePowerUps, generateDeathMessage, PowerUpOption } from './services/localContent';

const INITIAL_APPEARANCE: Appearance = {
  robeColor: '#6366f1',
  hatStyle: 'pointy',
  beardStyle: 'short',
};

const INITIAL_STATS: Stats = {
  intelligence: 5,
  mana: 5,
  health: 5,
};

const GUN_WEAPON: Weapon = {
  name: 'Arcane Peacemaker',
  type: 'gun',
  damage: 10,
  fireRate: 300,
  lastShot: 0,
  bulletSpeed: 7,
  spread: 0.05,
  color: '#60a5fa',
  description: 'A standard-issue magical revolver.',
  bulletType: 'arcane',
};

const STAFF_WEAPON: Weapon = {
  name: 'Tome-Caster Staff',
  type: 'staff',
  damage: 25,
  fireRate: 600,
  lastShot: 0,
  bulletSpeed: 5,
  spread: 0.1,
  color: '#f97316',
  description: 'Shoots enchanted fire-books.',
  bulletType: 'firebook',
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [appearance, setAppearance] = useState<Appearance>(INITIAL_APPEARANCE);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [startingSpell, setStartingSpell] = useState<'fireball' | 'frostbolt' | 'heal'>('fireball');
  const [player, setPlayer] = useState<Player | null>(null);
  const [powerUpOptions, setPowerUpOptions] = useState<PowerUpOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [deathMessage, setDeathMessage] = useState('');
  const [score, setScore] = useState(0);

  const startCustomization = () => setGameState('CUSTOMIZE');

  const finalizePlayer = () => {
    const maxHP = stats.health * 20;

    const initialStaff = { ...STAFF_WEAPON };
    if (startingSpell === 'frostbolt') {
      initialStaff.name = 'Glacial Staff';
      initialStaff.bulletType = 'frost';
      initialStaff.color = '#38bdf8';
    } else if (startingSpell === 'heal') {
      initialStaff.name = 'Life-Giver Staff';
      initialStaff.bulletType = 'heal';
      initialStaff.color = '#4ade80';
    }

    const newPlayer: Player = {
      pos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      health: maxHP,
      maxHealth: maxHP,
      xp: 0,
      level: 1,
      appearance,
      stats,
      weapons: [GUN_WEAPON, initialStaff],
      currentWeaponIndex: 0,
    };

    newPlayer.weapons.forEach((w) => (w.damage *= 1 + stats.intelligence * 0.1));
    newPlayer.weapons.forEach((w) => (w.fireRate *= 1.2 - stats.mana * 0.05));

    setPlayer(newPlayer);
    setScore(0);
    setGameState('PLAYING');
  };

  const handleLevelUp = useCallback(async (currentLevel: number) => {
    if (currentLevel >= 120) {
      setGameState('WIN');
      return;
    }

    setGameState('LEVEL_UP');
    setLoading(true);
    const options = await generatePowerUps();
    setPowerUpOptions(options);
    setLoading(false);
  }, []);

  const handleWin = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameState('WIN');
  }, []);

  const handleGameOver = useCallback(async (finalScore: number, finalLevel: number) => {
    setScore(finalScore);
    setGameState('GAME_OVER');
    const msg = await generateDeathMessage(finalScore, finalLevel);
    setDeathMessage(msg);
  }, []);

  const selectPowerUp = (choice: PowerUpOption) => {
    if (!player) return;
    setPlayer((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      updated.weapons.forEach((w) => {
        if (choice.attributeAffected === 'damage') w.damage *= choice.multiplier;
        if (choice.attributeAffected === 'fireRate') w.fireRate *= choice.multiplier;
        if (choice.attributeAffected === 'bulletSpeed') w.bulletSpeed *= choice.multiplier;
      });
      if (choice.attributeAffected === 'maxHealth') {
        updated.maxHealth *= choice.multiplier;
        updated.health = updated.maxHealth;
      }
      if (choice.attributeAffected === 'health') {
        updated.health = Math.min(updated.maxHealth, updated.health + 50);
      }
      return { ...updated, level: updated.level + 1, xp: 0 };
    });
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] bg-slate-900 text-white select-none overflow-hidden font-sans">
      {gameState === 'START' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 p-4 overflow-y-auto">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-4 sm:mb-6 md:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 text-center medieval-font">
            SPELL SLINGER
          </h1>
          <p className="text-base sm:text-xl mb-3 sm:mb-4 text-slate-400 italic text-center">
            "Guns and Grimoires - A Wizard&apos;s New Arsenal"
          </p>
          <div className="text-center mb-6 sm:mb-10 md:mb-12">
            <p className="text-sm sm:text-lg text-yellow-500 animate-pulse pixel-font mb-2 uppercase">
              SURVIVE 1 MINUTE TO ADVANCE LEVEL
            </p>
            <p className="text-sm text-slate-500 pixel-font uppercase">CLEAR 120 STAGES TO TRIUMPH</p>
          </div>
          <button
            onPointerUp={startCustomization}
            className="pixel-font px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-500 transition-colors border-4 border-white shadow-[0_0_20px_rgba(168,85,247,0.5)] touch-manipulation"
          >
            CUSTOMIZE WIZARD
          </button>
        </div>
      )}

      {gameState === 'CUSTOMIZE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50 p-4 overflow-y-auto">
          <h2 className="text-4xl font-bold mb-8 text-blue-400 pixel-font">WIZARD ORIGINS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full bg-slate-800/80 p-8 rounded-2xl border-2 border-slate-700 shadow-2xl">
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-slate-700 pb-2">Appearance</h3>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Robe Color</label>
                <input
                  type="color"
                  value={appearance.robeColor}
                  onChange={(e) => setAppearance({ ...appearance, robeColor: e.target.value })}
                  className="w-full h-10 rounded bg-transparent cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Hat Style</label>
                <div className="flex gap-2">
                  {(['pointy', 'wide', 'hood'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setAppearance({ ...appearance, hatStyle: style })}
                      className={`flex-1 py-2 px-3 text-xs uppercase border ${
                        appearance.hatStyle === style ? 'bg-blue-600 border-white' : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Beard</label>
                <div className="flex gap-2">
                  {(['none', 'short', 'long'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setAppearance({ ...appearance, beardStyle: style })}
                      className={`flex-1 py-2 px-3 text-xs uppercase border ${
                        appearance.beardStyle === style ? 'bg-blue-600 border-white' : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-slate-700 pb-2">Stats & Spells</h3>
              <div className="space-y-4">
                {Object.entries(stats).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{key}</span>
                      <span>{val}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={val}
                      onChange={(e) => setStats({ ...stats, [key]: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Starting Spell (Staff Modification)</label>
                <select
                  className="w-full bg-slate-700 border border-slate-600 p-2 rounded"
                  value={startingSpell}
                  onChange={(e) => setStartingSpell(e.target.value as any)}
                >
                  <option value="fireball">Fireball (Standard)</option>
                  <option value="frostbolt">Frostbolt (Ice Damage)</option>
                  <option value="heal">Life-Link (Healing Focus)</option>
                </select>
              </div>
            </div>
          </div>
          <button
            onPointerUp={finalizePlayer}
            className="mt-8 pixel-font px-12 py-4 bg-green-600 hover:bg-green-500 transition-colors border-4 border-white touch-manipulation"
          >
            ENTER THE FRAY
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && player && (
        <GameCanvas playerInitial={player} onLevelUp={handleLevelUp} onGameOver={handleGameOver} onWin={handleWin} />
      )}

      {gameState === 'LEVEL_UP' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-50 p-8">
          <h2 className="text-4xl font-bold mb-4 text-yellow-400 pixel-font">ASCENSION</h2>
          <p className="mb-8 text-slate-300">Choose your arcane blessing for Level {player ? player.level + 1 : '?'}:</p>
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm italic animate-pulse">Consulting the ancient Grimoire...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
              {powerUpOptions.map((opt, i) => (
                <div
                  key={`${opt.name}-${i}`}
                  onClick={() => selectPowerUp(opt)}
                  className="bg-slate-800 border-2 border-slate-700 p-6 rounded-xl hover:border-yellow-400 hover:bg-slate-700 cursor-pointer transition-all transform hover:-translate-y-1 group"
                >
                  <h3 className="text-xl font-bold text-yellow-400 mb-2 group-hover:scale-105 transition-transform">
                    {opt.name}
                  </h3>
                  <p className="text-sm text-slate-300 italic mb-4">"{opt.description}"</p>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
                    +{opt.attributeAffected} boost
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(gameState === 'GAME_OVER' || gameState === 'WIN') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 p-6 text-center">
          <h2
            className={`text-6xl font-bold mb-4 ${gameState === 'WIN' ? 'text-green-500' : 'text-red-600'} pixel-font`}
          >
            {gameState === 'WIN' ? 'MASTER WIZARD' : 'DEFEATED'}
          </h2>
          <p className="text-2xl text-slate-300 mb-2">
            {gameState === 'WIN' ? 'You cleared Stage 120 and survived the mystical onslaught!' : `You fell at Level ${player?.level}`}
          </p>
          <p className="text-xl text-yellow-400 mb-8">Final Score: {score}</p>
          <div className="max-w-md bg-slate-800/50 p-6 rounded-lg border border-slate-700 mb-12">
            <p className="italic text-lg text-slate-300">
              "{gameState === 'WIN' ? 'The trial of one hundred twenty is complete. Your arcane prowess is unmatched.' : deathMessage}"
            </p>
          </div>
          <button
            onPointerUp={() => setGameState('START')}
            className="pixel-font px-8 py-4 bg-blue-600 hover:bg-blue-500 transition-colors border-4 border-white touch-manipulation"
          >
            RETURN TO MENU
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
