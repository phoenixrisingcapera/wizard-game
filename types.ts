
export interface Vector {
  x: number;
  y: number;
}

export interface Appearance {
  robeColor: string;
  hatStyle: 'pointy' | 'wide' | 'hood';
  beardStyle: 'none' | 'short' | 'long';
}

export interface Stats {
  intelligence: number; // Damage multiplier
  mana: number;        // Fire rate multiplier
  health: number;      // Max health base
}

export interface Weapon {
  name: string;
  type: 'gun' | 'staff';
  damage: number;
  fireRate: number; // ms between shots
  lastShot: number;
  bulletSpeed: number;
  spread: number;
  color: string;
  description: string;
  bulletType: 'arcane' | 'firebook' | 'frost' | 'heal';
}

export interface Player {
  pos: Vector;
  health: number;
  maxHealth: number;
  xp: number;
  level: number;
  appearance: Appearance;
  stats: Stats;
  weapons: Weapon[];
  currentWeaponIndex: number;
}

export interface Bullet {
  pos: Vector;
  vel: Vector;
  damage: number;
  color: string;
  id: string;
  type: Weapon['bulletType'];
  rotation?: number;
}

export interface Enemy {
  id: string;
  pos: Vector;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'slime' | 'goblin' | 'wraith' | 'boss';
  xpValue: number;
  sizeMultiplier?: number;
}

export interface Particle {
  pos: Vector;
  vel: Vector;
  life: number;
  color: string;
}

export interface Collectible {
  id: string;
  pos: Vector;
  vel: Vector;
  type: 'heart';
  life: number; // For fading away
}

export type GameState = 'START' | 'CUSTOMIZE' | 'PLAYING' | 'LEVEL_UP' | 'GAME_OVER' | 'WIN';

export interface PowerUp {
  name: string;
  description: string;
  effect: (player: Player) => Player;
}
