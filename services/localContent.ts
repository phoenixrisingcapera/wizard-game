import powerupsData from '../data/powerups.json';
import deathMessagesData from '../data/deathMessages.json';

export interface PowerUpOption {
  name: string;
  description: string;
  attributeAffected: 'damage' | 'fireRate' | 'bulletSpeed' | 'maxHealth' | 'health';
  multiplier: number;
}

interface PowerUpsData {
  powerups: PowerUpOption[];
}

interface DeathMessagesData {
  messages: string[];
}

const powerups = (powerupsData as PowerUpsData).powerups;
const deathMessages = (deathMessagesData as DeathMessagesData).messages;

const pickUnique = <T,>(list: T[], count: number) => {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

export const generatePowerUps = async (): Promise<PowerUpOption[]> => {
  return pickUnique(powerups, 3);
};

export const generateDeathMessage = async (score: number, level: number): Promise<string> => {
  const template = deathMessages[Math.floor(Math.random() * deathMessages.length)] ?? 'You fell in battle.';
  return template.replace('{score}', `${score}`).replace('{level}', `${level}`);
};
