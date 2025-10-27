import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

type GameScreen = 'menu' | 'game' | 'settings' | 'pause' | 'stats';
type Weapon = 'ak47' | 'm4a1' | 'deagle';
type GraphicsQuality = 'very_low' | 'low' | 'medium' | 'high' | 'ultra';

interface PlayerStats {
  hp: number;
  armor: number;
  kills: number;
  deaths: number;
  weapon: Weapon;
  ammo: number;
  maxAmmo: number;
}

interface Settings {
  graphics: GraphicsQuality;
  music: number;
  sound: number;
  sensitivity: number;
  graffiti: boolean;
}

interface Player {
  x: number;
  y: number;
  z: number;
  angle: number;
  pitch: number;
  velocityY: number;
  isJumping: boolean;
}

interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  height: number;
  color: string;
}

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 100,
    armor: 100,
    kills: 0,
    deaths: 0,
    weapon: 'ak47',
    ammo: 30,
    maxAmmo: 30
  });
  const [settings, setSettings] = useState<Settings>({
    graphics: 'medium',
    music: 50,
    sound: 50,
    sensitivity: 50,
    graffiti: true
  });
  const [player, setPlayer] = useState<Player>({
    x: 5,
    y: 0,
    z: 5,
    angle: 0,
    pitch: 0,
    velocityY: 0,
    isJumping: false
  });
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [mouseMovement, setMouseMovement] = useState({ x: 0, y: 0 });
  const [isShooting, setIsShooting] = useState(false);
  const [shootingAnimation, setShootingAnimation] = useState(0);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [lookPosition, setLookPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const walls: Wall[] = [
    { x1: 0, y1: 0, x2: 20, y2: 0, height: 3, color: '#D4A574' },
    { x1: 20, y1: 0, x2: 20, y2: 20, height: 3, color: '#D4A574' },
    { x1: 20, y1: 20, x2: 0, y2: 20, height: 3, color: '#D4A574' },
    { x1: 0, y1: 20, x2: 0, y2: 0, height: 3, color: '#D4A574' },
    { x1: 5, y1: 5, x2: 15, y2: 5, height: 2, color: '#8B7355' },
    { x1: 15, y1: 5, x2: 15, y2: 10, height: 2, color: '#8B7355' },
    { x1: 5, y1: 15, x2: 10, y2: 15, height: 2.5, color: '#2C2416' },
    { x1: 10, y1: 15, x2: 10, y2: 10, height: 2.5, color: '#2C2416' },
  ];

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const handlePointerLockChange = useCallback(() => {
    setIsPointerLocked(document.pointerLockElement === canvasRef.current);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (screen === 'game' && isPointerLocked) {
      setMouseMovement({ x: e.movementX, y: e.movementY });
    }
  }, [screen, isPointerLocked]);

  useEffect(() => {
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handlePointerLockChange, handleMouseMove]);

  const handleCanvasClick = () => {
    if (screen === 'game' && canvasRef.current && !isPointerLocked) {
      canvasRef.current.requestPointerLock();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && screen === 'game') {
        setScreen('pause');
        document.exitPointerLock();
      }
      setKeys(prev => ({ ...prev, [e.code]: true }));
      
      if (e.code === 'KeyR' && screen === 'game') {
        setPlayerStats(prev => ({ ...prev, ammo: prev.maxAmmo }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.code]: false }));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (screen === 'game' && isPointerLocked && e.button === 0) {
        setIsShooting(true);
        setShootingAnimation(1);
        setPlayerStats(prev => prev.ammo > 0 ? { ...prev, ammo: prev.ammo - 1 } : prev);
      }
    };

    const handleMouseUp = () => {
      setIsShooting(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [screen, isPointerLocked]);

  const getGraphicsSettings = (quality: GraphicsQuality) => {
    const configs = {
      very_low: { renderDistance: 8, wallDetail: 1, shadows: false },
      low: { renderDistance: 12, wallDetail: 2, shadows: false },
      medium: { renderDistance: 16, wallDetail: 3, shadows: true },
      high: { renderDistance: 20, wallDetail: 4, shadows: true },
      ultra: { renderDistance: 25, wallDetail: 5, shadows: true }
    };
    return configs[quality];
  };

  useEffect(() => {
    if (screen !== 'game' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const graphicsConfig = getGraphicsSettings(settings.graphics);
    const sensitivity = settings.sensitivity / 1000;

    const gameLoop = () => {
      setPlayer(prev => {
        const newPlayer = { ...prev };

        if (mouseMovement.x !== 0 || mouseMovement.y !== 0) {
          newPlayer.angle += mouseMovement.x * sensitivity;
          newPlayer.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newPlayer.pitch + mouseMovement.y * sensitivity));
          setMouseMovement({ x: 0, y: 0 });
        }

        const speed = 0.1;
        const dirX = Math.cos(newPlayer.angle);
        const dirZ = Math.sin(newPlayer.angle);

        if (keys['KeyW']) {
          newPlayer.x += dirX * speed;
          newPlayer.z += dirZ * speed;
        }
        if (keys['KeyS']) {
          newPlayer.x -= dirX * speed;
          newPlayer.z -= dirZ * speed;
        }
        if (keys['KeyA']) {
          newPlayer.x += Math.cos(newPlayer.angle - Math.PI / 2) * speed;
          newPlayer.z += Math.sin(newPlayer.angle - Math.PI / 2) * speed;
        }
        if (keys['KeyD']) {
          newPlayer.x += Math.cos(newPlayer.angle + Math.PI / 2) * speed;
          newPlayer.z += Math.sin(newPlayer.angle + Math.PI / 2) * speed;
        }

        if (keys['Space'] && !newPlayer.isJumping) {
          newPlayer.velocityY = 0.15;
          newPlayer.isJumping = true;
        }

        newPlayer.velocityY -= 0.01;
        newPlayer.y += newPlayer.velocityY;

        if (newPlayer.y <= 0) {
          newPlayer.y = 0;
          newPlayer.velocityY = 0;
          newPlayer.isJumping = false;
        }

        newPlayer.x = Math.max(0.5, Math.min(19.5, newPlayer.x));
        newPlayer.z = Math.max(0.5, Math.min(19.5, newPlayer.z));

        return newPlayer;
      });

      if (shootingAnimation > 0) {
        setShootingAnimation(prev => Math.max(0, prev - 0.1));
      }

      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const horizonY = canvas.height / 2 + player.pitch * 200;
      
      ctx.fillStyle = '#D4A574';
      ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

      const fov = Math.PI / 3;
      const numRays = canvas.width / graphicsConfig.wallDetail;

      for (let i = 0; i < numRays; i++) {
        const rayAngle = (player.angle - fov / 2) + (i / numRays) * fov;
        const rayDirX = Math.cos(rayAngle);
        const rayDirZ = Math.sin(rayAngle);

        let closestDist = Infinity;
        let closestWall: Wall | null = null;

        walls.forEach(wall => {
          const wallDirX = wall.x2 - wall.x1;
          const wallDirY = wall.y2 - wall.y1;
          const wallLen = Math.sqrt(wallDirX * wallDirX + wallDirY * wallDirY);
          const wallNormX = wallDirX / wallLen;
          const wallNormY = wallDirY / wallLen;

          for (let d = 0; d < wallLen; d += 0.1) {
            const wx = wall.x1 + wallNormX * d;
            const wy = wall.y1 + wallNormY * d;
            
            const toWallX = wx - player.x;
            const toWallY = wy - player.z;
            const dist = Math.sqrt(toWallX * toWallX + toWallY * toWallY);

            if (dist < graphicsConfig.renderDistance) {
              const angle = Math.atan2(toWallY, toWallX);
              const angleDiff = rayAngle - angle;
              const angleDiffNorm = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

              if (Math.abs(angleDiffNorm) < 0.05 && dist < closestDist) {
                closestDist = dist;
                closestWall = wall;
              }
            }
          }
        });

        if (closestWall && closestDist < graphicsConfig.renderDistance) {
          const correctedDist = closestDist * Math.cos(rayAngle - player.angle);
          const wallHeight = (closestWall.height / correctedDist) * 200;
          
          const darkness = Math.max(0.3, 1 - (correctedDist / graphicsConfig.renderDistance));
          const r = parseInt(closestWall.color.slice(1, 3), 16) * darkness;
          const g = parseInt(closestWall.color.slice(3, 5), 16) * darkness;
          const b = parseInt(closestWall.color.slice(5, 7), 16) * darkness;

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          const x = (i / numRays) * canvas.width;
          const y = horizonY - wallHeight / 2;
          ctx.fillRect(x, y, canvas.width / numRays + 1, wallHeight);
        }
      }

      const weaponData = {
        ak47: { name: 'АК-47', color: '#2C2416', length: 0.4 },
        m4a1: { name: 'M4A1', color: '#1A1A1A', length: 0.35 },
        deagle: { name: 'Desert Eagle', color: '#3A3A3A', length: 0.25 }
      };

      const weapon = weaponData[playerStats.weapon];
      const weaponY = canvas.height - 100 + shootingAnimation * 30;
      const weaponX = canvas.width * 0.7;

      ctx.fillStyle = weapon.color;
      ctx.fillRect(weaponX, weaponY - 40, 150, 20);
      ctx.fillRect(weaponX + 120, weaponY - 50, 10, 30);
      ctx.fillRect(weaponX - 20, weaponY - 30, 40, 10);

      if (shootingAnimation > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(weaponX + 150, weaponY - 45, 10 + shootingAnimation * 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#4ECDC4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2);
      ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, canvas.height / 2 - 10);
      ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [screen, player, keys, mouseMovement, playerStats.weapon, shootingAnimation, settings.graphics, settings.sensitivity]);

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    const x = ((touch.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 100;
    const y = ((touch.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 100;
    setJoystickPosition({ x, y });
  };

  const resetJoystick = () => setJoystickPosition({ x: 0, y: 0 });

  const weaponNames = {
    ak47: 'АК-47',
    m4a1: 'M4A1',
    deagle: 'Desert Eagle'
  };

  const graphicsLabels = {
    very_low: 'Очень низко',
    low: 'Низко',
    medium: 'Средне',
    high: 'Высоко',
    ultra: 'Ультра'
  };

  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-[#2C2416] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-6xl font-bold text-[#D4A574] tracking-wider" style={{ textShadow: '4px 4px 0 #000' }}>
              CS 1.6
            </h1>
            <p className="text-[#4ECDC4] text-sm uppercase tracking-widest">Counter-Strike</p>
          </div>
          
          <Card className="bg-black/40 border-[#D4A574]/30 p-6 space-y-3">
            <Button 
              className="w-full h-14 bg-[#D4A574] hover:bg-[#D4A574]/80 text-black font-bold text-lg tracking-wider"
              onClick={() => setScreen('game')}
            >
              <Icon name="Play" className="mr-2" size={20} />
              НОВАЯ ИГРА
            </Button>
            <Button 
              className="w-full h-14 bg-[#4ECDC4] hover:bg-[#4ECDC4]/80 text-black font-bold text-lg tracking-wider"
              onClick={() => setScreen('settings')}
            >
              <Icon name="Settings" className="mr-2" size={20} />
              НАСТРОЙКИ
            </Button>
            <Button 
              className="w-full h-14 bg-[#2C2416] hover:bg-[#2C2416]/80 text-[#D4A574] border-2 border-[#D4A574] font-bold text-lg tracking-wider"
              onClick={() => setScreen('stats')}
            >
              <Icon name="TrendingUp" className="mr-2" size={20} />
              СТАТИСТИКА
            </Button>
          </Card>

          <div className="text-center text-[#D4A574]/50 text-xs uppercase tracking-wider">
            v1.6 | de_dust
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div className="min-h-screen bg-[#2C2416] p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-[#D4A574] tracking-wider">НАСТРОЙКИ</h2>
            <Button 
              variant="ghost" 
              className="text-[#4ECDC4]"
              onClick={() => setScreen('menu')}
            >
              <Icon name="X" size={24} />
            </Button>
          </div>

          <Card className="bg-black/40 border-[#D4A574]/30 p-6">
            <Tabs defaultValue="graphics" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/60">
                <TabsTrigger value="graphics" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-black">
                  ГРАФИКА
                </TabsTrigger>
                <TabsTrigger value="audio" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-black">
                  ЗВУК
                </TabsTrigger>
                <TabsTrigger value="controls" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-black">
                  УПРАВЛЕНИЕ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="graphics" className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label className="text-[#4ECDC4] text-lg">Качество графики</Label>
                  <Select value={settings.graphics} onValueChange={(v: GraphicsQuality) => setSettings({...settings, graphics: v})}>
                    <SelectTrigger className="bg-black/60 border-[#D4A574] text-[#D4A574]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2C2416] border-[#D4A574]">
                      <SelectItem value="very_low" className="text-[#D4A574]">Очень низко</SelectItem>
                      <SelectItem value="low" className="text-[#D4A574]">Низко</SelectItem>
                      <SelectItem value="medium" className="text-[#D4A574]">Средне</SelectItem>
                      <SelectItem value="high" className="text-[#D4A574]">Высоко</SelectItem>
                      <SelectItem value="ultra" className="text-[#D4A574]">Ультра</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Граффити</Label>
                  <Switch 
                    checked={settings.graffiti}
                    onCheckedChange={(v) => setSettings({...settings, graffiti: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label className="text-[#4ECDC4] text-lg">Музыка: {settings.music}%</Label>
                  <Slider 
                    value={[settings.music]} 
                    onValueChange={(v) => setSettings({...settings, music: v[0]})}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[#4ECDC4] text-lg">Звуковые эффекты: {settings.sound}%</Label>
                  <Slider 
                    value={[settings.sound]} 
                    onValueChange={(v) => setSettings({...settings, sound: v[0]})}
                  />
                </div>
              </TabsContent>

              <TabsContent value="controls" className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label className="text-[#4ECDC4] text-lg">Чувствительность мыши: {settings.sensitivity}%</Label>
                  <Slider 
                    value={[settings.sensitivity]} 
                    onValueChange={(v) => setSettings({...settings, sensitivity: v[0]})}
                  />
                </div>
                <div className="bg-black/40 p-4 rounded-lg space-y-2 text-[#D4A574] text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>WASD - Движение</div>
                    <div>ЛКМ - Стрельба</div>
                    <div>Пробел - Прыжок</div>
                    <div>R - Перезарядка</div>
                    <div>Мышь - Обзор</div>
                    <div>ESC - Пауза</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'stats') {
    return (
      <div className="min-h-screen bg-[#2C2416] p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-[#D4A574] tracking-wider">СТАТИСТИКА</h2>
            <Button 
              variant="ghost" 
              className="text-[#4ECDC4]"
              onClick={() => setScreen('menu')}
            >
              <Icon name="X" size={24} />
            </Button>
          </div>

          <Card className="bg-black/40 border-[#D4A574]/30 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/60 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-[#4ECDC4]">{playerStats.kills}</div>
                <div className="text-[#D4A574] text-sm uppercase mt-2">Убийств</div>
              </div>
              <div className="bg-black/60 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-[#FF6B35]">{playerStats.deaths}</div>
                <div className="text-[#D4A574] text-sm uppercase mt-2">Смертей</div>
              </div>
              <div className="bg-black/60 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-[#D4A574]">
                  {playerStats.kills > 0 ? (playerStats.kills / Math.max(playerStats.deaths, 1)).toFixed(2) : '0.00'}
                </div>
                <div className="text-[#D4A574] text-sm uppercase mt-2">K/D Ratio</div>
              </div>
              <div className="bg-black/60 p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-[#4ECDC4]">0</div>
                <div className="text-[#D4A574] text-sm uppercase mt-2">Игр сыграно</div>
              </div>
            </div>

            <div className="bg-black/60 p-4 rounded-lg">
              <h3 className="text-[#4ECDC4] font-bold mb-3">ЛЮБИМОЕ ОРУЖИЕ</h3>
              <div className="flex items-center justify-between">
                <span className="text-[#D4A574] text-xl">АК-47</span>
                <span className="text-[#4ECDC4]">0 убийств</span>
              </div>
            </div>

            <div className="bg-black/60 p-4 rounded-lg">
              <h3 className="text-[#4ECDC4] font-bold mb-3">ЛЮБИМАЯ КАРТА</h3>
              <div className="flex items-center justify-between">
                <span className="text-[#D4A574] text-xl">de_dust</span>
                <span className="text-[#4ECDC4]">0 игр</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'pause') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="bg-[#2C2416] border-[#D4A574]/50 p-8 w-full max-w-md space-y-4">
          <h2 className="text-3xl font-bold text-[#D4A574] text-center tracking-wider">ПАУЗА</h2>
          <div className="space-y-3">
            <Button 
              className="w-full h-12 bg-[#4ECDC4] hover:bg-[#4ECDC4]/80 text-black font-bold"
              onClick={() => {
                setScreen('game');
                canvasRef.current?.requestPointerLock();
              }}
            >
              ПРОДОЛЖИТЬ
            </Button>
            <Button 
              className="w-full h-12 bg-[#D4A574] hover:bg-[#D4A574]/80 text-black font-bold"
              onClick={() => setScreen('settings')}
            >
              НАСТРОЙКИ
            </Button>
            <Button 
              className="w-full h-12 bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white font-bold"
              onClick={() => {
                setScreen('menu');
                document.exitPointerLock();
              }}
            >
              ВЫЙТИ В МЕНЮ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <canvas 
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover cursor-crosshair"
        onClick={handleCanvasClick}
      />

      {!isPointerLocked && screen === 'game' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="text-center space-y-4">
            <Icon name="MousePointer2" size={48} className="text-[#4ECDC4] mx-auto" />
            <p className="text-[#4ECDC4] text-xl font-bold">Нажмите, чтобы играть</p>
            <p className="text-[#D4A574] text-sm">ESC для выхода</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 space-y-2 z-10">
        <div className="bg-black/80 px-4 py-2 rounded border-2 border-[#FF6B35]">
          <div className="flex items-center gap-3">
            <Icon name="Heart" className="text-[#FF6B35]" size={20} />
            <div className="text-[#FF6B35] font-bold text-xl">{playerStats.hp}</div>
          </div>
        </div>
        <div className="bg-black/80 px-4 py-2 rounded border-2 border-[#4ECDC4]">
          <div className="flex items-center gap-3">
            <Icon name="Shield" className="text-[#4ECDC4]" size={20} />
            <div className="text-[#4ECDC4] font-bold text-xl">{playerStats.armor}</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/80 px-6 py-3 rounded border-2 border-[#D4A574] z-10">
        <div className="text-[#4ECDC4] text-sm mb-1">ОРУЖИЕ</div>
        <div className="text-[#D4A574] font-bold text-2xl">{weaponNames[playerStats.weapon]}</div>
        <div className="text-[#4ECDC4] text-lg mt-1">{playerStats.ammo} / {playerStats.maxAmmo}</div>
        <div className="flex gap-2 mt-2">
          {(['ak47', 'm4a1', 'deagle'] as Weapon[]).map((weapon) => (
            <button
              key={weapon}
              onClick={() => setPlayerStats({...playerStats, weapon})}
              className={`px-3 py-1 rounded text-xs font-bold ${
                playerStats.weapon === weapon 
                  ? 'bg-[#4ECDC4] text-black' 
                  : 'bg-black/60 text-[#D4A574] border border-[#D4A574]'
              }`}
            >
              {weapon === 'ak47' ? 'AK' : weapon === 'm4a1' ? 'M4' : 'DE'}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-black/80 px-4 py-2 rounded border-2 border-[#D4A574] text-[#4ECDC4] text-sm z-10">
        Графика: {graphicsLabels[settings.graphics]}
      </div>

      {isMobile && (
        <>
          <div 
            className="absolute bottom-20 left-8 w-32 h-32 bg-black/40 rounded-full border-2 border-[#4ECDC4] z-20"
            onTouchMove={handleJoystickMove}
            onTouchEnd={resetJoystick}
          >
            <div 
              className="absolute top-1/2 left-1/2 w-12 h-12 bg-[#4ECDC4] rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `translate(calc(-50% + ${joystickPosition.x * 0.4}px), calc(-50% + ${joystickPosition.y * 0.4}px))`
              }}
            />
          </div>

          <button
            className="absolute bottom-24 right-24 w-20 h-20 bg-[#FF6B35] rounded-full border-4 border-[#FF6B35]/50 z-20 flex items-center justify-center"
            onTouchStart={() => {
              setIsShooting(true);
              setShootingAnimation(1);
              setPlayerStats(prev => prev.ammo > 0 ? { ...prev, ammo: prev.ammo - 1 } : prev);
            }}
          >
            <Icon name="Crosshair" className="text-white" size={32} />
          </button>
        </>
      )}
    </div>
  );
};

export default Index;
