import React, { useMemo, useState } from 'react';
import storyData from './data/story.json';
import itemsData from './data/items.json';
import { Choice, GameLogEntry, StoryData, StoryNode, PlayerState, ItemsData } from './types';

const story = storyData as StoryData;
const items = itemsData as ItemsData;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const App: React.FC = () => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(story.start);
  const [player, setPlayer] = useState<PlayerState>({
    stats: { ...story.player.stats },
    inventory: [...story.player.inventory],
  });
  const [log, setLog] = useState<GameLogEntry[]>([]);

  const currentNode = story.nodes[currentNodeId] as StoryNode;
  const itemIndex = useMemo(() => {
    return new Map(items.items.map((item) => [item.id, item]));
  }, []);

  const resetGame = () => {
    setCurrentNodeId(story.start);
    setPlayer({
      stats: { ...story.player.stats },
      inventory: [...story.player.inventory],
    });
    setLog([]);
  };

  const meetsRequirement = (choice: Choice) => {
    if (!choice.requires) return true;
    const statReq = choice.requires.stats;
    if (statReq) {
      if (statReq.health !== undefined && player.stats.health < statReq.health) return false;
      if (statReq.mana !== undefined && player.stats.mana < statReq.mana) return false;
      if (statReq.gold !== undefined && player.stats.gold < statReq.gold) return false;
    }
    if (choice.requires.item && !player.inventory.includes(choice.requires.item)) return false;
    return true;
  };

  const applyChoice = (choice: Choice) => {
    const nextNode = story.nodes[choice.next];
    if (!nextNode) return;

    setPlayer((prev) => {
      const nextStats = { ...prev.stats };
      const effects = choice.effects?.stats;
      if (effects) {
        if (effects.health !== undefined) nextStats.health = clamp(nextStats.health + effects.health, 0, 12);
        if (effects.mana !== undefined) nextStats.mana = clamp(nextStats.mana + effects.mana, 0, 12);
        if (effects.gold !== undefined) nextStats.gold = clamp(nextStats.gold + effects.gold, 0, 99);
      }

      const nextInventory = new Set(prev.inventory);
      choice.effects?.addItems?.forEach((id) => nextInventory.add(id));
      choice.effects?.removeItems?.forEach((id) => nextInventory.delete(id));

      return {
        stats: nextStats,
        inventory: Array.from(nextInventory),
      };
    });

    if (choice.outcome) {
      setLog((prev) => [...prev, { id: crypto.randomUUID(), text: choice.outcome }].slice(-6));
    }
    setCurrentNodeId(choice.next);
  };

  const isEnding = currentNode.ending !== null && currentNode.ending !== undefined;

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__glow" />
        <div className="hero__content">
          <span className="hero__tag">SpellSlinger: The Quiet Edition</span>
          <h1>Wizard with a Gun</h1>
          <p>
            A data-driven tale of hexes, hextech, and hard choices. No APIs. Just spells, steel, and story.
          </p>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <span>Health</span>
            <div className="meter">
              <div className="meter__fill" style={{ width: `${(player.stats.health / 12) * 100}%` }} />
            </div>
            <strong>{player.stats.health}</strong>
          </div>
          <div className="stat">
            <span>Mana</span>
            <div className="meter meter--mana">
              <div className="meter__fill" style={{ width: `${(player.stats.mana / 12) * 100}%` }} />
            </div>
            <strong>{player.stats.mana}</strong>
          </div>
          <div className="stat">
            <span>Gold</span>
            <div className="meter meter--gold">
              <div className="meter__fill" style={{ width: `${(player.stats.gold / 20) * 100}%` }} />
            </div>
            <strong>{player.stats.gold}</strong>
          </div>
        </div>
      </header>

      <main className="play">
        <section className="scene">
          <div className="scene__frame">
            <div className="scene__title">
              <span className="scene__chapter">{currentNode.chapter}</span>
              <h2>{currentNode.title}</h2>
            </div>
            <div className="scene__body">
              {currentNode.body.map((line, index) => (
                <p key={`${currentNodeId}-${index}`}>{line}</p>
              ))}
            </div>
            {currentNode.outcome && <div className="scene__outcome">{currentNode.outcome}</div>}

            <div className="scene__choices">
              {currentNode.choices.length === 0 && (
                <button className="choice choice--primary" onClick={resetGame}>
                  Begin anew
                </button>
              )}
              {currentNode.choices.map((choice) => {
                const canUse = meetsRequirement(choice);
                return (
                  <button
                    key={choice.id}
                    className={`choice ${canUse ? '' : 'choice--locked'}`}
                    disabled={!canUse || isEnding}
                    onClick={() => applyChoice(choice)}
                  >
                    <span>{choice.text}</span>
                    {!canUse && <em>{choice.lockedText ?? 'You lack the means.'}</em>}
                  </button>
                );
              })}
            </div>

            {isEnding && (
              <div className="ending">
                <strong>{currentNode.ending?.label}</strong>
                <p>{currentNode.ending?.text}</p>
                <button className="choice choice--primary" onClick={resetGame}>
                  Replay the legend
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="sidebar">
          <div className="panel">
            <h3>Satchel</h3>
            <ul className="inventory">
              {player.inventory.length === 0 && <li className="inventory__empty">Nothing but lint.</li>}
              {player.inventory.map((itemId) => {
                const item = itemIndex.get(itemId);
                return (
                  <li key={itemId}>
                    <strong>{item?.name ?? itemId}</strong>
                    <span>{item?.description ?? 'An unmarked relic.'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="panel">
            <h3>Chronicle</h3>
            <div className="log">
              {log.length === 0 && <p className="log__empty">Your tale has yet to begin.</p>}
              {log.map((entry) => (
                <p key={entry.id}>{entry.text}</p>
              ))}
            </div>
          </div>
          <div className="panel panel--hint">
            <h3>How to Play</h3>
            <p>Choose a path, watch your stats, and collect artifacts to unlock hidden routes.</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
