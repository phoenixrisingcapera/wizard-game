export interface PlayerStats {
  health: number;
  mana: number;
  gold: number;
}

export interface PlayerState {
  stats: PlayerStats;
  inventory: string[];
}

export interface ChoiceRequirement {
  stats?: Partial<PlayerStats>;
  item?: string;
}

export interface ChoiceEffects {
  stats?: Partial<PlayerStats>;
  addItems?: string[];
  removeItems?: string[];
}

export interface Choice {
  id: string;
  text: string;
  next: string;
  outcome?: string;
  lockedText?: string;
  requires?: ChoiceRequirement;
  effects?: ChoiceEffects;
}

export interface StoryNode {
  id: string;
  chapter: string;
  title: string;
  body: string[];
  outcome?: string;
  choices: Choice[];
  ending?: {
    label: string;
    text: string;
  };
}

export interface StoryData {
  start: string;
  player: {
    stats: PlayerStats;
    inventory: string[];
  };
  nodes: Record<string, StoryNode>;
}

export interface GameLogEntry {
  id: string;
  text: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
}

export interface ItemsData {
  items: ItemDefinition[];
}
