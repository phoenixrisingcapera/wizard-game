import React, { useEffect, useRef, useState } from 'react';
import { Player, Bullet, Enemy, Particle, Vector, Collectible } from '../types';

interface GameCanvasProps {
  playerInitial: Player;
  onLevelUp: (level: number) => void;
  onGameOver: (score: number, level: number) => void;
  onWin: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ playerInitial, onLevelUp, onGameOver, onWin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const playerRef = useRef<Player>(playerInitial);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const mousePosRef = useRef<Vector>({ x: 0, y: 0 });
  const lastClickTimeRef = useRef<number>(0);
  const lastHitTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const isShootingRef = useRef<boolean>(false);
  const bossSpawnedRef = useRef<boolean>(false);
  const gameStartTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(60);
  const [hitFlash, setHitFlash] = useState(0);

  useEffect(() => {
    playerRef.current = playerInitial;
    bossSpawnedRef.current = false;
    // Reset timer on level initialization
    gameStartTimeRef.current = Date.now();
  }, [playerInitial]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleKeyDown = (e: KeyboardEvent) => (keysRef.current[e.code] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keysRef.current[e.code] = false);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mousePosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('button')) {
        return;
      }

      if ('touches' in e && e.touches.length > 0) {
        e.preventDefault();
        mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }

      const now = Date.now();
      const diff = now - lastClickTimeRef.current;

      if (diff < 300) {
        isShootingRef.current = true;
        setTimeout(() => {
          isShootingRef.current = false;
        }, 400);
      } else {
        setTimeout(() => {
          if (Date.now() - lastClickTimeRef.current >= 300) {
            playerRef.current.currentWeaponIndex =
              (playerRef.current.currentWeaponIndex + 1) % playerRef.current.weapons.length;
          }
        }, 300);
      }
      lastClickTimeRef.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchstart', handleInteraction, { passive: false });
    window.addEventListener('mousedown', handleInteraction);

    const spawnEnemy = (typeParam?: Enemy['type']) => {
      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = Math.random() * canvas.width;
        y = -100;
      }
      if (side === 1) {
        x = canvas.width + 100;
        y = Math.random() * canvas.height;
      }
      if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 100;
      }
      if (side === 3) {
        x = -100;
        y = Math.random() * canvas.height;
      }

      const level = playerRef.current.level;
      const type =
        typeParam ||
        (['slime', 'goblin', 'wraith'][Math.floor(Math.random() * Math.min(3, 1 + Math.floor(level / 5)))] as Enemy['type']);

      let health = 15 + level * 8 + Math.pow(level, 1.2) * 2;
      let speed = 0.7;
      let xpValue = 10 + Math.floor(level * 0.5);
      let sizeMultiplier = 1;

      const baseSpeedByType: Record<Enemy['type'], number> = {
        slime: 0.55,
        goblin: 0.03,
        wraith: 0.75,
        boss: 0.6,
      };
      const speedScale = 0.3 + (level - 1) * 0.02;
      speed = baseSpeedByType[type] * speedScale;

      if (type === 'boss') {
        health = level * 250 + Math.pow(level, 1.5);
        speed = baseSpeedByType.boss * speedScale;
        xpValue = level * 150;
        sizeMultiplier = 4.0;
      }

      enemiesRef.current.push({
        id: Math.random().toString(36).substr(2, 9),
        pos: { x, y },
        health,
        maxHealth: health,
        speed,
        type,
        xpValue,
        sizeMultiplier,
      });
    };

    const spawnHeart = (pos: Vector) => {
      collectiblesRef.current.push({
        id: Math.random().toString(36),
        pos: { ...pos },
        vel: {
          x: (Math.random() - 0.5) * 12,
          y: (Math.random() - 0.5) * 12,
        },
        type: 'heart',
        life: 1.0,
      });
    };

    const createParticles = (pos: Vector, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          pos: { ...pos },
          vel: {
            x: (Math.random() - 0.5) * 6,
            y: (Math.random() - 0.5) * 6,
          },
          life: 1,
          color,
        });
      }
    };

    const update = () => {
      frameCountRef.current++;
      const p = playerRef.current;
      const weapon = p.weapons[p.currentWeaponIndex];

      const elapsed = Date.now() - gameStartTimeRef.current;
      const remaining = Math.max(0, 60 - Math.floor(elapsed / 1000));
      if (remaining !== timeLeft) setTimeLeft(remaining);

      if (remaining <= 0) {
        cancelAnimationFrame(requestRef.current!);
        onLevelUp(p.level);
        return;
      }

      const moveSpeed = 4;
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) p.pos.y -= moveSpeed;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) p.pos.y += moveSpeed;
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) p.pos.x -= moveSpeed;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) p.pos.x += moveSpeed;

      p.pos.x = Math.max(20, Math.min(canvas.width - 20, p.pos.x));
      p.pos.y = Math.max(20, Math.min(canvas.height - 20, p.pos.y));

      const now = Date.now();
      if (isShootingRef.current && now - weapon.lastShot > weapon.fireRate) {
        const angle = Math.atan2(mousePosRef.current.y - p.pos.y, mousePosRef.current.x - p.pos.x);
        const finalAngle = angle + (Math.random() - 0.5) * weapon.spread;

        bulletsRef.current.push({
          id: Math.random().toString(36),
          pos: { ...p.pos },
          vel: {
            x: Math.cos(finalAngle) * weapon.bulletSpeed,
            y: Math.sin(finalAngle) * weapon.bulletSpeed,
          },
          damage: weapon.damage,
          color: weapon.color,
          type: weapon.bulletType,
          rotation: weapon.bulletType === 'firebook' ? Math.random() * Math.PI * 2 : 0,
        });
        weapon.lastShot = now;
      }

      if (p.level % 10 === 0 && remaining < 15 && !bossSpawnedRef.current) {
        spawnEnemy('boss');
        bossSpawnedRef.current = true;
      }

      if (frameCountRef.current % Math.max(8, 60 - p.level * 4) === 0) {
        spawnEnemy();
      }

      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.pos.x += b.vel.x;
        b.pos.y += b.vel.y;
        if (b.type === 'firebook') {
          b.rotation! += 0.1;
          if (frameCountRef.current % 3 === 0) createParticles(b.pos, '#f97316', 1);
        }
        return (
          b.pos.x > -100 &&
          b.pos.x < canvas.width + 100 &&
          b.pos.y > -100 &&
          b.pos.y < canvas.height + 100
        );
      });

      let beingHit = false;
      enemiesRef.current.forEach((e) => {
        const dx = p.pos.x - e.pos.x;
        const dy = p.pos.y - e.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = e.type === 'boss' ? 70 : 30;

        e.pos.x += (dx / dist) * e.speed;
        e.pos.y += (dy / dist) * e.speed;

        if (dist < hitRadius) {
          beingHit = true;
        }
      });

      if (beingHit) {
        if (now - lastHitTimeRef.current > 1000) {
          p.health = Math.max(0, p.health - 10);
          lastHitTimeRef.current = now;
          setHitFlash(1);
          createParticles(p.pos, '#ef4444', 25);
          spawnHeart(p.pos);

          if (p.health <= 0) {
            cancelAnimationFrame(requestRef.current!);
            onGameOver(scoreRef.current, p.level);
          }
        }
      }

      collectiblesRef.current = collectiblesRef.current.filter((c) => {
        c.pos.x += c.vel.x;
        c.pos.y += c.vel.y;
        c.vel.x *= 0.95;
        c.vel.y *= 0.95;
        c.life -= 0.002;

        const dx = p.pos.x - c.pos.x;
        const dy = p.pos.y - c.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 35) {
          p.health = Math.min(p.maxHealth, p.health + 8);
          createParticles(c.pos, '#fb7185', 10);
          return false;
        }

        return c.life > 0;
      });

      bulletsRef.current.forEach((b, bi) => {
        enemiesRef.current.forEach((e, ei) => {
          const dx = b.pos.x - e.pos.x;
          const dy = b.pos.y - e.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const collisionRadius = e.type === 'boss' ? 60 : 28;

          if (dist < collisionRadius) {
            e.health -= b.damage;
            createParticles(b.pos, b.color, 4);
            if (b.type === 'frost') e.speed *= 0.85;
            if (b.type === 'heal') p.health = Math.min(p.maxHealth, p.health + 0.5);

            bulletsRef.current.splice(bi, 1);

            if (e.health <= 0) {
              const pCount = e.type === 'boss' ? 120 : 15;
              createParticles(e.pos, '#ef4444', pCount);
              scoreRef.current += Math.floor(e.xpValue * 1.5);
              enemiesRef.current.splice(ei, 1);
              p.xp += e.xpValue;
            }
          }
        });
      });

      particlesRef.current = particlesRef.current.filter((part) => {
        part.pos.x += part.vel.x;
        part.pos.y += part.vel.y;
        part.life -= 0.02;
        return part.life > 0;
      });

      if (hitFlash > 0) setHitFlash((prev) => Math.max(0, prev - 0.05));
    };

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + size / 4);
      ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
      ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
      ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
      ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      particlesRef.current.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      collectiblesRef.current.forEach((c) => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.life * 5);
        ctx.fillStyle = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f43f5e';
        const pulse = 1 + Math.sin(frameCountRef.current * 0.1) * 0.1;
        drawHeart(ctx, c.pos.x, c.pos.y - 10, 20 * pulse);
        ctx.restore();
      });

      enemiesRef.current.forEach((e) => {
        ctx.save();
        const sm = e.sizeMultiplier || 1;
        const bounce = Math.sin(frameCountRef.current * 0.15 + e.id.charCodeAt(0)) * (2 * sm);
        ctx.translate(e.pos.x, e.pos.y + bounce);
        ctx.scale(sm, sm);

        let skinColor = '#84cc16';
        let tunicColor = '#3f6212';
        let eyeColor = 'yellow';

        if (e.type === 'slime') {
          skinColor = '#10b981';
          tunicColor = '#064e3b';
          eyeColor = '#bef264';
        } else if (e.type === 'wraith') {
          skinColor = '#94a3b8';
          tunicColor = '#334155';
          eyeColor = '#f8fafc';
          ctx.globalAlpha = 0.5;
        } else if (e.type === 'boss') {
          skinColor = '#7e22ce';
          tunicColor = '#4c1d95';
          eyeColor = '#fbbf24';
          ctx.shadowBlur = 20;
          ctx.shadowColor = skinColor;
        }

        if (e.type === 'slime') {
          ctx.fillStyle = skinColor;
          ctx.beginPath();
          ctx.arc(0, 2, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = tunicColor;
          ctx.beginPath();
          ctx.arc(-6, -2, 4, 0, Math.PI * 2);
          ctx.arc(6, -2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.arc(-4, -4, 1.8, 0, Math.PI * 2);
          ctx.arc(4, -4, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'wraith') {
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = skinColor;
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(18, 18);
          ctx.lineTo(8, 10);
          ctx.lineTo(0, 18);
          ctx.lineTo(-8, 10);
          ctx.lineTo(-18, 18);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = tunicColor;
          ctx.beginPath();
          ctx.arc(0, -6, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = tunicColor;
          ctx.beginPath();
          ctx.moveTo(-10, 15);
          ctx.lineTo(10, 15);
          ctx.lineTo(0, -5);
          ctx.fill();
          ctx.strokeStyle = skinColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-8, 5);
          ctx.lineTo(-14, 12);
          ctx.moveTo(8, 5);
          ctx.lineTo(14, 12);
          ctx.stroke();
          ctx.fillStyle = skinColor;
          ctx.beginPath();
          ctx.arc(0, -8, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(-8, -10);
          ctx.lineTo(-20, -18);
          ctx.lineTo(-8, -2);
          ctx.moveTo(8, -10);
          ctx.lineTo(20, -18);
          ctx.lineTo(8, -2);
          ctx.fill();
          if (e.type === 'goblin') {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(-6, -20);
            ctx.lineTo(-12, -30);
            ctx.lineTo(-2, -26);
            ctx.moveTo(6, -20);
            ctx.lineTo(12, -30);
            ctx.lineTo(2, -26);
            ctx.fill();
          }
        }

        if (e.type === 'boss') {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(-8, -18);
          ctx.lineTo(-10, -28);
          ctx.lineTo(-5, -23);
          ctx.lineTo(0, -32);
          ctx.lineTo(5, -23);
          ctx.lineTo(10, -28);
          ctx.lineTo(8, -18);
          ctx.closePath();
          ctx.fill();
        }

        if (e.type !== 'slime' && e.type !== 'wraith') {
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.arc(-4, -10, 2, 0, Math.PI * 2);
          ctx.arc(4, -10, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(-4, -10, 0.8, 0, Math.PI * 2);
          ctx.arc(4, -10, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        const barW = e.type === 'boss' ? 200 : 40;
        const barY = e.type === 'boss' ? -100 : -40;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(e.pos.x - barW / 2, e.pos.y + barY, barW, 8);
        ctx.fillStyle = e.type === 'boss' ? '#a855f7' : '#ef4444';
        ctx.fillRect(e.pos.x - barW / 2, e.pos.y + barY, barW * (e.health / e.maxHealth), 8);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(e.pos.x - barW / 2, e.pos.y + barY, barW, 8);
        if (e.type === 'boss') {
          ctx.fillStyle = 'white';
          ctx.font = '10px "Press Start 2P"';
          ctx.textAlign = 'center';
          ctx.fillText('BOSS', e.pos.x, e.pos.y + barY - 10);
        }
      });

      bulletsRef.current.forEach((b) => {
        ctx.save();
        ctx.translate(b.pos.x, b.pos.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        if (b.type === 'firebook') {
          ctx.rotate(b.rotation || 0);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-8, -10, 16, 20);
          ctx.fillStyle = 'white';
          ctx.fillRect(-6, -8, 12, 16);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f97316';
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      const p = playerRef.current;
      const now = Date.now();
      const isInvincible = now - lastHitTimeRef.current < 1000;

      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      if (isInvincible && Math.floor(now / 80) % 2 === 0) ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 20, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.appearance.robeColor;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(22, 22);
      ctx.lineTo(-22, 22);
      ctx.closePath();
      ctx.fill();
      if (p.appearance.beardStyle !== 'none') {
        ctx.fillStyle = 'white';
        const blen = p.appearance.beardStyle === 'long' ? 28 : 14;
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.lineTo(8, 5);
        ctx.lineTo(0, 5 + blen);
        ctx.fill();
      }
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(0, -5, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.appearance.robeColor;
      if (p.appearance.hatStyle === 'pointy') {
        ctx.beginPath();
        ctx.moveTo(-18, -12);
        ctx.lineTo(18, -12);
        ctx.lineTo(0, -48);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.appearance.hatStyle === 'wide') {
        ctx.beginPath();
        ctx.ellipse(0, -12, 28, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-14, -12);
        ctx.lineTo(14, -12);
        ctx.lineTo(0, -32);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, -8, 15, Math.PI, 0);
        ctx.fill();
      }
      const angle = Math.atan2(mousePosRef.current.y - p.pos.y, mousePosRef.current.x - p.pos.x);
      const weapon = p.weapons[p.currentWeaponIndex];
      ctx.rotate(angle);
      if (weapon.type === 'gun') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(12, -4, 25, 8);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(12, 0, 9, 12);
      } else {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(10, -3, 45, 6);
        ctx.fillStyle = weapon.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = weapon.color;
        ctx.beginPath();
        ctx.arc(55, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
      ctx.globalAlpha = 1.0;

      if (hitFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${hitFlash * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = 'white';
      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.fillText(`STAGE ${p.level}`, 30, 50);
      ctx.fillText(`SCORE: ${scoreRef.current}`, 30, 80);
      ctx.fillStyle = weapon.color;
      ctx.fillText(`${weapon.name}`, 30, 110);

      const barBaseY = canvas.height - 60;
      const barW = 450;
      const barX = canvas.width / 2 - barW / 2;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barBaseY, barW, 25);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barBaseY, barW * (p.health / p.maxHealth), 25);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barBaseY, barW, 25);
      ctx.fillStyle = 'white';
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(p.health)} / ${Math.ceil(p.maxHealth)} HP`, canvas.width / 2, barBaseY + 17);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barBaseY + 32, barW, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(barX, barBaseY + 32, barW * ((60 - timeLeft) / 60), 12);
      ctx.strokeRect(barX, barBaseY + 32, barW, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('STAGE PROGRESS', canvas.width / 2, barBaseY + 41);

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(canvas.width / 2 - 100, 20, 200, 50);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(canvas.width / 2 - 100, 20, 200, 50);
      ctx.fillStyle = timeLeft < 10 ? '#ef4444' : '#fbbf24';
      ctx.font = '20px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(`${timeLeft}s`, canvas.width / 2, 55);
    };

    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [onLevelUp, onGameOver, hitFlash, timeLeft, onWin]);

  const onBtnClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const diff = now - lastClickTimeRef.current;
    if (diff < 300) {
      isShootingRef.current = true;
      setTimeout(() => {
        isShootingRef.current = false;
      }, 400);
    } else {
      setTimeout(() => {
        if (Date.now() - lastClickTimeRef.current >= 300) {
          playerRef.current.currentWeaponIndex =
            (playerRef.current.currentWeaponIndex + 1) % playerRef.current.weapons.length;
        }
      }, 300);
    }
    lastClickTimeRef.current = now;
  };

  const setMovement = (key: string, value: boolean, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      if ('touches' in e) e.preventDefault();
    }
    keysRef.current[key] = value;
  };

  return (
    <div className="relative w-full h-full game-canvas">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-2">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button
            onMouseDown={(e) => setMovement('KeyW', true, e)}
            onMouseUp={() => setMovement('KeyW', false)}
            onMouseLeave={() => setMovement('KeyW', false)}
            onTouchStart={(e) => setMovement('KeyW', true, e)}
            onTouchEnd={() => setMovement('KeyW', false)}
            className="w-14 h-14 bg-slate-800/60 hover:bg-slate-700/80 active:scale-95 border-2 border-white rounded-lg flex items-center justify-center pixel-font text-white"
          >
            ▲
          </button>
          <div />
          <button
            onMouseDown={(e) => setMovement('KeyA', true, e)}
            onMouseUp={() => setMovement('KeyA', false)}
            onMouseLeave={() => setMovement('KeyA', false)}
            onTouchStart={(e) => setMovement('KeyA', true, e)}
            onTouchEnd={() => setMovement('KeyA', false)}
            className="w-14 h-14 bg-slate-800/60 hover:bg-slate-700/80 active:scale-95 border-2 border-white rounded-lg flex items-center justify-center pixel-font text-white"
          >
            ◀
          </button>
          <button
            onMouseDown={(e) => setMovement('KeyS', true, e)}
            onMouseUp={() => setMovement('KeyS', false)}
            onMouseLeave={() => setMovement('KeyS', false)}
            onTouchStart={(e) => setMovement('KeyS', true, e)}
            onTouchEnd={() => setMovement('KeyS', false)}
            className="w-14 h-14 bg-slate-800/60 hover:bg-slate-700/80 active:scale-95 border-2 border-white rounded-lg flex items-center justify-center pixel-font text-white"
          >
            ▼
          </button>
          <button
            onMouseDown={(e) => setMovement('KeyD', true, e)}
            onMouseUp={() => setMovement('KeyD', false)}
            onMouseLeave={() => setMovement('KeyD', false)}
            onTouchStart={(e) => setMovement('KeyD', true, e)}
            onTouchEnd={() => setMovement('KeyD', false)}
            className="w-14 h-14 bg-slate-800/60 hover:bg-slate-700/80 active:scale-95 border-2 border-white rounded-lg flex items-center justify-center pixel-font text-white"
          >
            ▶
          </button>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2">
        <button
          onMouseDown={onBtnClick}
          onTouchStart={onBtnClick}
          className="w-24 h-24 bg-red-600/50 hover:bg-red-500/80 active:scale-95 border-4 border-white rounded-full flex items-center justify-center pixel-font text-xs text-white shadow-2xl backdrop-blur-sm transition-all"
        >
          SHOOT
        </button>
        <span className="text-[8px] pixel-font text-slate-400 uppercase">Double Tap to Shoot</span>
      </div>
    </div>
  );
};

export default GameCanvas;
