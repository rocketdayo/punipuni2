import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Matter from 'matter-js';
import { useGame } from '../store/GameContext';
import { STAGES } from '../data/stages';
import { CHARACTERS } from '../data/characters';
import { ArrowLeft, Zap } from 'lucide-react';

const PUNI_RADIUS      = 16;
const BIG_PUNI_MULT    = 1.5;
const FEVER_MAX        = 100;
const FEVER_DURATION   = 7000;

// Preload individual character images for ALL ranks
const CHAR_IMAGES: Record<string, HTMLImageElement> = {};
const rankCounts: Record<string, number> = { S:0, A:0, B:0, C:0, D:0, E:0 };
CHARACTERS.forEach(c => {
  rankCounts[c.rank]++;
  const img = new Image();
  img.src = import.meta.env.BASE_URL + `puni_${c.rank.toLowerCase()}_${rankCounts[c.rank]}.png`;
  CHAR_IMAGES[c.id] = img;
});

interface PuniData { charId: string; size: number; level: number; }

const GameScene = () => {
  const { stageId } = useParams();
  const navigate    = useNavigate();
  const { team, characters, clearStage } = useGame();

  const stage = STAGES.find(s => s.id === stageId);

  const sceneRef     = useRef<HTMLDivElement>(null);
  const engineRef    = useRef<Matter.Engine | null>(null);
  const renderRef    = useRef<Matter.Render | null>(null);
  const runnerRef    = useRef<Matter.Runner | null>(null);

  const [enemyHp,     setEnemyHp]     = useState(stage?.enemyHp || 100);
  const [playerHp,    setPlayerHp]    = useState(1);
  const [maxPlayerHp, setMaxPlayerHp] = useState(1);
  const [isGameOver,  setIsGameOver]  = useState(false);
  const [isVictory,   setIsVictory]   = useState(false);
  const [damageTexts, setDamageTexts] = useState<{ id: number; val: number; x: number; y: number; color: string }[]>([]);

  const [feverGauge, setFeverGauge] = useState(0);
  const [isFever,    setIsFever]    = useState(false);
  const feverDmgAccum = useRef(0);
  const [charGauges,  setCharGauges]  = useState<Record<string, number>>({});

  const selectedRef   = useRef<Matter.Body[]>([]);
  const isDragging    = useRef(false);

  // ---------- init player HP ----------
  useEffect(() => {
    if (!team.length) return;
    let hp = 0;
    const g: Record<string, number> = {};
    team.forEach(id => {
      const c = CHARACTERS.find(x => x.id === id);
      if (!c) return;
      hp += c.baseHp + (characters[id]?.level || 1) * 10;
      g[id] = 0;
    });
    setPlayerHp(hp);
    setMaxPlayerHp(hp);
    setCharGauges(g);
  }, [team, characters]);

  // ---------- enemy attack timer ----------
  useEffect(() => {
    if (!stage || isGameOver || isVictory || isFever) return;
    const iv = setInterval(() => {
      setPlayerHp(prev => {
        const next = Math.max(0, prev - stage.enemyAtk);
        if (next === 0) setIsGameOver(true);
        const id = Date.now() + Math.random();
        setDamageTexts(t => [...t, { id, val: stage.enemyAtk, x: 60, y: 40, color: '#ff4444' }]);
        setTimeout(() => setDamageTexts(t => t.filter(x => x.id !== id)), 900);
        return next;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [stage, isGameOver, isVictory, isFever]);

  // ---------- damage / win ----------
  const dealDamage = useCallback((dmg: number) => {
    setEnemyHp(prev => {
      const next = Math.max(0, prev - dmg);
      if (next === 0) {
        setIsVictory(true);
        setTimeout(() => clearStage(stage!.id, stage!.rewardMoney, stage!.rewardYPoints), 2000);
      }
      return next;
    });
  }, [stage, clearStage]);

  // ---------- fever ----------
  useEffect(() => {
    if (feverGauge >= FEVER_MAX && !isFever) {
      setIsFever(true);
      feverDmgAccum.current = 0;
      setTimeout(() => {
        setIsFever(false);
        setFeverGauge(0);
        dealDamage(feverDmgAccum.current);
        const id = Date.now();
        setDamageTexts(p => [...p, { id, val: feverDmgAccum.current, x: 120, y: 80, color: '#ff00ff' }]);
        setTimeout(() => setDamageTexts(p => p.filter(t => t.id !== id)), 1500);
      }, FEVER_DURATION);
    }
  }, [feverGauge, isFever, dealDamage]);

  // ---------- skill ----------
  const triggerSkill = (charId: string) => {
    if ((charGauges[charId] || 0) < 100 || isGameOver || isVictory) return;
    const cd = CHARACTERS.find(c => c.id === charId);
    if (!cd || cd.rank !== 'S' || !cd.skill) return;
    setCharGauges(prev => ({ ...prev, [charId]: 0 }));
    if (cd.skill.type === 'damage') {
      const dmg = Math.floor((cd.baseAtk + (characters[charId]?.level || 1) * 5) * cd.skill.power);
      dealDamage(dmg);
      const id = Date.now();
      setDamageTexts(p => [...p, { id, val: dmg, x: 120, y: 120, color: '#ffff00' }]);
      setTimeout(() => setDamageTexts(p => p.filter(t => t.id !== id)), 1500);
    } else {
      const heal = cd.skill.power;
      setPlayerHp(prev => Math.min(maxPlayerHp, prev + heal));
      const id = Date.now();
      setDamageTexts(p => [...p, { id, val: heal, x: 120, y: 120, color: '#00ff88' }]);
      setTimeout(() => setDamageTexts(p => p.filter(t => t.id !== id)), 1500);
    }
  };

  // ---------- Matter.js — built from actual container size ----------
  useEffect(() => {
    if (!stage || !team.length || isGameOver || isVictory || !sceneRef.current) return;

    const container = sceneRef.current;

    const buildScene = (W: number, H: number) => {
      // Tear down previous instance if it exists
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) renderRef.current.canvas.remove();
      }
      if (runnerRef.current && engineRef.current) {
        Matter.Runner.stop(runnerRef.current);
        Matter.Engine.clear(engineRef.current);
      }

      const { Engine, Render, Runner, Bodies, Composite, Events, Vector } = Matter;

      const engine = Engine.create();
      engineRef.current    = engine;
      engine.world.gravity.y = 1.5;

      const render = Render.create({
        element: container,
        engine,
        options: { width: W, height: H, wireframes: false, background: 'transparent' },
      });
      renderRef.current = render;

      // Canvas fills container exactly
      const cvs = render.canvas;
      cvs.style.position   = 'absolute';
      cvs.style.top        = '0';
      cvs.style.left       = '0';
      cvs.style.width      = '100%';
      cvs.style.height     = '100%';
      cvs.style.touchAction= 'none';

      // Bowl geometry derived from W / H
      const bowlRadius  = Math.min(W / 2, H * 0.9) - 4;
      const bowlCX      = W / 2;
      const bowlCY      = H - bowlRadius + bowlRadius * 0.12;

      // Build bowl from arc segments (more segments = fewer gaps)
      const walls: Matter.Body[] = [];
      const SEG = 48; // More segments for smoother, gapless bowl
      const WALL_THICKNESS = 28; // Thick walls so nothing slips through
      for (let i = 0; i < SEG; i++) {
        const a0 = (i / SEG) * Math.PI;
        const a1 = ((i + 1) / SEG) * Math.PI;
        const x0 = bowlCX + Math.cos(a0) * bowlRadius;
        const y0 = bowlCY + Math.sin(a0) * bowlRadius;
        const x1 = bowlCX + Math.cos(a1) * bowlRadius;
        const y1 = bowlCY + Math.sin(a1) * bowlRadius;
        const cx  = (x0 + x1) / 2;
        const cy  = (y0 + y1) / 2;
        const len = Math.hypot(x1 - x0, y1 - y0) + WALL_THICKNESS; // overlap so no gaps
        const ang = Math.atan2(y1 - y0, x1 - x0);
        walls.push(Bodies.rectangle(cx, cy, len, WALL_THICKNESS, {
          isStatic: true, angle: ang, friction: 0.3,
          restitution: 0.4,
          render: { visible: false },
        }));
      }

      // Solid floor at the very bottom of the bowl
      walls.push(Bodies.rectangle(bowlCX, bowlCY + bowlRadius - 4, bowlRadius * 2, 20, {
        isStatic: true, render: { visible: false },
      }));

      // Left & right vertical walls — tall enough to catch anything that bounces up
      const sideWallH = H * 2;
      walls.push(Bodies.rectangle(bowlCX - bowlRadius - 10, bowlCY - sideWallH / 2, 24, sideWallH, { isStatic: true, render: { visible: false } }));
      walls.push(Bodies.rectangle(bowlCX + bowlRadius + 10, bowlCY - sideWallH / 2, 24, sideWallH, { isStatic: true, render: { visible: false } }));

      // Invisible ceiling so punis can't fly off the top
      walls.push(Bodies.rectangle(bowlCX, -60, W * 2, 40, { isStatic: true, render: { visible: false } }));

      Composite.add(engine.world, walls);

      // Spawn punis
      const spawnPuni = () => {
        const charId  = team[Math.floor(Math.random() * team.length)];
        const cd      = CHARACTERS.find(c => c.id === charId);
        if (!cd) return;
        const lv = characters[charId]?.level || 1;
        const x  = bowlCX + (Math.random() * bowlRadius - bowlRadius / 2) * 0.6;
        const p  = Bodies.circle(x, -PUNI_RADIUS, PUNI_RADIUS, {
          restitution: 0.75, friction: 0.05, density: 0.001,
          render: { fillStyle: cd.color, strokeStyle: '#ffffff', lineWidth: 2 },
        });
        (p as any).puniData = { charId, size: 1, level: lv } as PuniData;
        Composite.add(engine.world, p);
      };

      for (let i = 0; i < 35; i++) setTimeout(spawnPuni, i * 80);
      const spawnIv = setInterval(() => {
        if (Composite.allBodies(engine.world).filter(b => !b.isStatic).length < 40) spawnPuni();
      }, 500);

      // Coordinate scale (canvas internal size == W×H, CSS size == container size)
      const getPos = (e: PointerEvent) => {
        const rect   = cvs.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
      };

      const getPuniAt = (pos: { x: number; y: number }) => {
        for (const b of Composite.allBodies(engine.world).filter(b => !b.isStatic)) {
          if (Vector.magnitude(Vector.sub(b.position, pos)) <= (b.circleRadius ?? 0)) return b;
        }
        return null;
      };

      const mergePunis = (list: Matter.Body[]) => {
        const fd      = (list[0] as any).puniData as PuniData;
        const total   = list.reduce((s, p) => s + ((p as any).puniData.size || 1), 0);
        const center  = list.reduce((s, p) => Vector.add(s, p.position), Vector.create(0, 0));
        const pos     = Vector.mult(center, 1 / list.length);
        Composite.remove(engine.world, list);
        const cd    = CHARACTERS.find(c => c.id === fd.charId)!;
        const newR  = PUNI_RADIUS * Math.pow(total, 0.4);
        const big   = Bodies.circle(pos.x, pos.y, newR, {
          restitution: 0.7, friction: 0.1, density: 0.002,
          render: { fillStyle: cd.color, strokeStyle: '#ffd700', lineWidth: 4 },
        });
        (big as any).puniData = { ...fd, size: total };
        Composite.add(engine.world, big);
      };

      const popPuni = (puni: Matter.Body) => {
        const pd  = (puni as any).puniData as PuniData;
        const cd  = CHARACTERS.find(c => c.id === pd.charId)!;
        const dmg = Math.floor((cd.baseAtk + pd.level * 5) * Math.pow(pd.size, BIG_PUNI_MULT));
        setFeverGauge(prev => Math.min(FEVER_MAX, prev + pd.size * 2));
        setCharGauges(prev => ({ ...prev, [pd.charId]: Math.min(100, (prev[pd.charId] || 0) + pd.size * 5) }));
        setIsFever(fever => {
          if (fever) { feverDmgAccum.current += dmg; } else { dealDamage(dmg); }
          return fever;
        });
        const id = Date.now() + Math.random();
        setDamageTexts(t => [...t, { id, val: dmg, x: puni.position.x, y: puni.position.y, color: '#ff3333' }]);
        setTimeout(() => setDamageTexts(t => t.filter(x => x.id !== id)), 900);
        Composite.remove(engine.world, puni);
      };

      const handleDown = (e: PointerEvent) => {
        const b = getPuniAt(getPos(e));
        if (b) { isDragging.current = true; selectedRef.current = [b]; b.render.lineWidth = 5; }
      };
      const handleMove = (e: PointerEvent) => {
        if (!isDragging.current) return;
        const b = getPuniAt(getPos(e));
        if (b && !selectedRef.current.includes(b)) {
          const first = selectedRef.current[0];
          const last  = selectedRef.current[selectedRef.current.length - 1];
          const fd    = (first as any).puniData as PuniData;
          const hd    = (b as any).puniData    as PuniData;
          if (fd.charId === hd.charId) {
            const maxD = first.circleRadius! + b.circleRadius! + PUNI_RADIUS * 2.5;
            if (Vector.magnitude(Vector.sub(b.position, last.position)) < maxD) {
              selectedRef.current.push(b);
              b.render.lineWidth = 5;
            }
          }
        }
      };
      const handleUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        const sel = selectedRef.current;
        if (sel.length > 1)       mergePunis(sel);
        else if (sel.length === 1) popPuni(sel[0]);
        sel.forEach(b => { if (b.render) b.render.lineWidth = 2; });
        selectedRef.current = [];
      };

      cvs.addEventListener('pointerdown',  handleDown);
      cvs.addEventListener('pointermove',  handleMove);
      cvs.addEventListener('pointerup',    handleUp);
      cvs.addEventListener('pointerleave', handleUp);

      Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        // Bowl border
        ctx.beginPath();
        ctx.arc(bowlCX, bowlCY, bowlRadius, 0, Math.PI);
        ctx.lineWidth   = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();
        // Draw puni sprites (circular image for all, fallback to emoji)
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        for (const b of Composite.allBodies(engine.world).filter(b => !b.isStatic)) {
          const pd = (b as any).puniData as PuniData;
          if (!pd) continue;
          const cd = CHARACTERS.find(c => c.id === pd.charId);
          if (!cd) continue;
          const r = b.circleRadius ?? PUNI_RADIUS;
          const { x, y } = b.position;

          const img = CHAR_IMAGES[cd.id];
          if (img?.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.clip();
            // Draw background color underneath transparent images
            ctx.fillStyle = cd.color;
            ctx.fill();
            // Draw the actual photo
            ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
            ctx.restore();

            // Border color based on rank
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            if (cd.rank === 'S') { ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; }
            else if (cd.rank === 'A') ctx.strokeStyle = '#ffaa00';
            else if (cd.rank === 'B') ctx.strokeStyle = '#ff88aa';
            else if (cd.rank === 'C') ctx.strokeStyle = '#aa5555';
            else if (cd.rank === 'D') ctx.strokeStyle = '#55aa55';
            else ctx.strokeStyle = '#88cc88'; // E
            ctx.stroke();
          } else {
            // Fallback emoji
            ctx.font = `${r * 1.2}px Arial`;
            ctx.fillText(cd.emoji, x, y);
          }
        }
        // Connection lines
        if (isDragging.current && selectedRef.current.length > 1) {
          ctx.beginPath();
          ctx.moveTo(selectedRef.current[0].position.x, selectedRef.current[0].position.y);
          for (let i = 1; i < selectedRef.current.length; i++) {
            ctx.lineTo(selectedRef.current[i].position.x, selectedRef.current[i].position.y);
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth   = 8;
          ctx.lineJoin    = 'round';
          ctx.lineCap     = 'round';
          ctx.stroke();
        }
      });

      Render.run(render);
      const runner = Runner.create();
      runnerRef.current = runner;
      Runner.run(runner, engine);

      return () => {
        clearInterval(spawnIv);
        cvs.removeEventListener('pointerdown',  handleDown);
        cvs.removeEventListener('pointermove',  handleMove);
        cvs.removeEventListener('pointerup',    handleUp);
        cvs.removeEventListener('pointerleave', handleUp);
        Render.stop(render);
        Runner.stop(runner);
        Engine.clear(engine);
        if (render.canvas) render.canvas.remove();
      };
    };

    // Initial build
    let cleanup = buildScene(container.clientWidth || 400, container.clientHeight || 450);

    // Rebuild when container resizes
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        cleanup?.();
        cleanup = buildScene(Math.floor(width), Math.floor(height));
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [stage, team, characters, isGameOver, isVictory, dealDamage]);

  if (!stage || !team.length) return null;

  return (
    <div className="view-container" style={{
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      background: isFever ? 'radial-gradient(circle,#4a1a4a,#1a001a)' : 'var(--bg-color)',
      transition: 'background 0.5s',
    }}>

      {/* ── Enemy + HP bars ── */}
      <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/stages')} style={{ position: 'absolute', left: 10, top: 10, padding: 8 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: '4rem', animation: isFever ? 'none' : 'float 2s infinite', filter: isFever ? 'drop-shadow(0 0 12px #f0f)' : 'none' }}>
          {stage.enemyEmoji}
        </div>
        <div style={{ width: '80%', height: 13, background: '#333', borderRadius: 8, overflow: 'hidden', marginTop: 5, border: '2px solid #555' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#ff3333,#ffaa00)', width: `${(enemyHp / stage.enemyHp) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: '#ffaaaa', marginTop: 3 }}>敵: {Math.ceil(enemyHp)} / {stage.enemyHp}</div>
        <div style={{ width: '80%', height: 9, background: '#333', borderRadius: 6, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ height: '100%', background: '#44ff44', width: `${(playerHp / maxPlayerHp) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: '#aaffaa', marginTop: 3 }}>自分: {Math.ceil(playerHp)} / {maxPlayerHp}</div>
      </div>

      {/* ── Character skill icons ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '4px 10px', flexShrink: 0 }}>
        {team.map(charId => {
          const cd   = CHARACTERS.find(c => c.id === charId);
          if (!cd) return null;
          const isS  = cd.rank === 'S';
          const g    = charGauges[charId] || 0;
          const full = g >= 100;
          return (
            <div key={charId} style={{ position: 'relative' }}>
              <div
                className="char-icon"
                onClick={() => full && isS ? triggerSkill(charId) : undefined}
                style={{
                  backgroundColor: cd.color,
                  width: 50, height: 50, fontSize: '1.5rem',
                  border:    isS && full ? '3px solid #ffff00' : '2px solid #555',
                  boxShadow: isS && full ? '0 0 14px #ff0'    : 'none',
                  cursor:    isS && full ? 'pointer' : 'default',
                  opacity:   full ? 1 : 0.7,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${g}%`, background: 'rgba(255,255,255,0.28)' }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{cd.emoji}</span>
              </div>
              {isS && full && (
                <div style={{ position: 'absolute', top: -10, right: -10, background: '#ffff00', color: '#000', borderRadius: '50%', padding: 2 }}>
                  <Zap size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Fever bar ── */}
      <div style={{ padding: '2px 20px 4px', flexShrink: 0 }}>
        <div style={{ height: 7, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: isFever ? '#f0f' : '#0ff', width: isFever ? '100%' : `${feverGauge}%`, transition: 'width 0.2s' }} />
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: isFever ? '#f0f' : '#0ff', fontWeight: 'bold' }}>
          {isFever ? '🌟 FEVER TIME!! 🌟' : 'FEVER GAUGE'}
        </div>
      </div>

      {/* ── Physics canvas (flex: 1 → fills all remaining space) ── */}
      <div ref={sceneRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {damageTexts.map(dt => (
          <div key={dt.id} className="damage-text" style={{ left: dt.x, top: dt.y, color: dt.color }}>
            {dt.val}
          </div>
        ))}
        {isGameOver && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(40,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <h1 style={{ fontSize: '3.5rem', color: '#ff3333', textShadow: '0 0 20px #f00' }}>GAME OVER</h1>
            <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => navigate('/stages')}>戻る</button>
          </div>
        )}
        {isVictory && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <h1 style={{ fontSize: '3.5rem', color: '#ffd700', textShadow: '0 0 20px #fa0' }}>STAGE CLEAR!</h1>
            <div className="glass-panel" style={{ marginTop: 20, padding: 20, textAlign: 'center' }}>
              <p style={{ color: 'var(--money-color)', fontWeight: 'bold' }}>+ {stage.rewardMoney} コイン</p>
              <p style={{ color: 'var(--y-point-color)', fontWeight: 'bold' }}>+ {stage.rewardYPoints} Yポイント</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/stages')}>戻る</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameScene;
