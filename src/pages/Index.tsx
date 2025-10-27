import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from '@/components/ui/use-toast';

type GameScreen = 'menu' | 'game' | 'settings' | 'pause' | 'stats' | 'shop';
type Weapon = 'ak47' | 'm4a1' | 'deagle' | 'awp' | 'knife';
type GraphicsQuality = 'potato' | 'very_low' | 'low' | 'medium' | 'high' | 'ultra';
type Platform = 'desktop' | 'mobile';

interface PlayerStats {
  hp: number;
  armor: number;
  kills: number;
  deaths: number;
  weapon: Weapon;
  ammo: number;
  maxAmmo: number;
  money: number;
}

interface Settings {
  graphics: GraphicsQuality;
  music: number;
  sound: number;
  sensitivity: number;
  graffiti: boolean;
  fov: number;
  vsync: boolean;
  shadows: boolean;
  antialiasing: boolean;
  textures: boolean;
  particleEffects: boolean;
  motionBlur: boolean;
  screenShake: boolean;
  showFPS: boolean;
  platform: Platform;
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
  type?: 'wall' | 'crate' | 'ramp';
}

interface WeaponShopItem {
  id: Weapon;
  name: string;
  price: number;
  damage: number;
  maxAmmo: number;
}

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 100,
    armor: 0,
    kills: 0,
    deaths: 0,
    weapon: 'knife',
    ammo: 0,
    maxAmmo: 0,
    money: 800
  });
  const [settings, setSettings] = useState<Settings>({
    graphics: 'medium',
    music: 50,
    sound: 50,
    sensitivity: 50,
    graffiti: true,
    fov: 90,
    vsync: false,
    shadows: true,
    antialiasing: true,
    textures: true,
    particleEffects: true,
    motionBlur: false,
    screenShake: true,
    showFPS: true,
    platform: 'desktop'
  });
  const [player, setPlayer] = useState<Player>({
    x: 10,
    y: 0,
    z: 10,
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
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(Date.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const wallsCache = useRef<Wall[]>([]);

  const walls: Wall[] = useMemo(() => [
    { x1: 0, y1: 0, x2: 30, y2: 0, height: 3, color: '#D4A574', type: 'wall' },
    { x1: 30, y1: 0, x2: 30, y2: 30, height: 3, color: '#D4A574', type: 'wall' },
    { x1: 30, y1: 30, x2: 0, y2: 30, height: 3, color: '#D4A574', type: 'wall' },
    { x1: 0, y1: 30, x2: 0, y2: 0, height: 3, color: '#D4A574', type: 'wall' },
    { x1: 5, y1: 5, x2: 10, y2: 5, height: 2, color: '#8B7355', type: 'crate' },
    { x1: 10, y1: 5, x2: 10, y2: 10, height: 2, color: '#8B7355', type: 'crate' },
    { x1: 10, y1: 10, x2: 5, y2: 10, height: 2, color: '#8B7355', type: 'crate' },
    { x1: 5, y1: 10, x2: 5, y2: 5, height: 2, color: '#8B7355', type: 'crate' },
    { x1: 20, y1: 8, x2: 25, y2: 8, height: 1.5, color: '#2C2416', type: 'crate' },
    { x1: 25, y1: 8, x2: 25, y2: 12, height: 1.5, color: '#2C2416', type: 'crate' },
    { x1: 25, y1: 12, x2: 20, y2: 12, height: 1.5, color: '#2C2416', type: 'crate' },
    { x1: 20, y1: 12, x2: 20, y2: 8, height: 1.5, color: '#2C2416', type: 'crate' },
    { x1: 12, y1: 20, x2: 18, y2: 20, height: 2.5, color: '#8B7355', type: 'crate' },
    { x1: 18, y1: 20, x2: 18, y2: 22, height: 2.5, color: '#8B7355', type: 'crate' },
    { x1: 18, y1: 22, x2: 12, y2: 22, height: 2.5, color: '#8B7355', type: 'crate' },
    { x1: 12, y1: 22, x2: 12, y2: 20, height: 2.5, color: '#8B7355', type: 'crate' },
    { x1: 5, y1: 20, x2: 8, y2: 23, height: 1, color: '#A08060', type: 'ramp' },
    { x1: 22, y1: 5, x2: 25, y2: 2, height: 0.8, color: '#A08060', type: 'ramp' },
  ], []);

  const weaponShop: WeaponShopItem[] = [
    { id: 'knife', name: 'Нож', price: 0, damage: 50, maxAmmo: 0 },
    { id: 'deagle', name: 'Desert Eagle', price: 700, damage: 50, maxAmmo: 7 },
    { id: 'ak47', name: 'АК-47', price: 2700, damage: 36, maxAmmo: 30 },
    { id: 'm4a1', name: 'M4A1', price: 3100, damage: 33, maxAmmo: 30 },
    { id: 'awp', name: 'AWP', price: 4750, damage: 115, maxAmmo: 10 },
  ];

  useEffect(() => {
    const checkPlatform = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setSettings(prev => ({ ...prev, platform: isMobileDevice ? 'mobile' : 'desktop' }));
    };
    checkPlatform();
    window.addEventListener('resize', checkPlatform);
    return () => window.removeEventListener('resize', checkPlatform);
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
      if (screen === 'menu' && e.code === 'Enter') {
        setScreen('game');
        return;
      }
      
      if (e.code === 'Escape' && screen === 'game') {
        setScreen('pause');
        document.exitPointerLock();
        return;
      }

      if (e.code === 'KeyB' && screen === 'game') {
        setScreen('shop');
        document.exitPointerLock();
        return;
      }
      
      setKeys(prev => ({ ...prev, [e.code]: true }));
      
      if (e.code === 'KeyR' && screen === 'game') {
        setPlayerStats(prev => ({ ...prev, ammo: prev.maxAmmo }));
        toast({ title: 'Перезарядка', description: 'Оружие перезаряжено' });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.code]: false }));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (screen === 'game' && isPointerLocked && e.button === 0) {
        if (playerStats.weapon === 'knife') {
          setIsShooting(true);
          setShootingAnimation(1);
          return;
        }
        if (playerStats.ammo > 0) {
          setIsShooting(true);
          setShootingAnimation(1);
          setPlayerStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));
        }
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
  }, [screen, isPointerLocked, playerStats.weapon, playerStats.ammo]);

  const getGraphicsSettings = useCallback((quality: GraphicsQuality) => {
    const configs = {
      potato: { renderDistance: 5, wallDetail: 8, shadows: false, resolution: 0.4, maxFPS: 30 },
      very_low: { renderDistance: 8, wallDetail: 4, shadows: false, resolution: 0.6, maxFPS: 60 },
      low: { renderDistance: 12, wallDetail: 3, shadows: false, resolution: 0.75, maxFPS: 60 },
      medium: { renderDistance: 16, wallDetail: 2, shadows: true, resolution: 1, maxFPS: 60 },
      high: { renderDistance: 20, wallDetail: 1, shadows: true, resolution: 1, maxFPS: 120 },
      ultra: { renderDistance: 25, wallDetail: 1, shadows: true, resolution: 1, maxFPS: 144 }
    };
    return configs[quality];
  }, []);

  const buyWeapon = (weapon: WeaponShopItem) => {
    if (playerStats.money >= weapon.price) {
      setPlayerStats({
        ...playerStats,
        weapon: weapon.id,
        ammo: weapon.maxAmmo,
        maxAmmo: weapon.maxAmmo,
        money: playerStats.money - weapon.price
      });
      toast({ title: 'Куплено!', description: `${weapon.name} за $${weapon.price}` });
    } else {
      toast({ title: 'Недостаточно средств', description: `Нужно $${weapon.price}`, variant: 'destructive' });
    }
  };

  const buyArmor = () => {
    const armorPrice = 650;
    if (playerStats.money >= armorPrice && playerStats.armor < 100) {
      setPlayerStats({
        ...playerStats,
        armor: 100,
        money: playerStats.money - armorPrice
      });
      toast({ title: 'Куплено!', description: 'Броня за $650' });
    } else if (playerStats.armor >= 100) {
      toast({ title: 'Уже есть', description: 'Броня полная', variant: 'destructive' });
    } else {
      toast({ title: 'Недостаточно средств', description: 'Нужно $650', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (screen !== 'game' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const graphicsConfig = getGraphicsSettings(settings.graphics);
    const sensitivity = settings.sensitivity / 1000;
    let frameCount = 0;
    let lastFpsUpdate = Date.now();

    canvas.width = window.innerWidth * graphicsConfig.resolution;
    canvas.height = window.innerHeight * graphicsConfig.resolution;

    const gameLoop = () => {
      const now = Date.now();
      const delta = now - lastFrameTime;
      
      if (delta < 1000 / graphicsConfig.maxFPS) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      setLastFrameTime(now);
      frameCount++;

      if (now - lastFpsUpdate >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsUpdate = now;
      }

      setPlayer(prev => {
        const newPlayer = { ...prev };

        if (mouseMovement.x !== 0 || mouseMovement.y !== 0) {
          newPlayer.angle += mouseMovement.x * sensitivity;
          newPlayer.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newPlayer.pitch + mouseMovement.y * sensitivity));
          setMouseMovement({ x: 0, y: 0 });
        }

        const speed = 0.15;
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
          newPlayer.velocityY = 0.2;
          newPlayer.isJumping = true;
        }

        newPlayer.velocityY -= 0.015;
        newPlayer.y += newPlayer.velocityY;

        if (newPlayer.y <= 0) {
          newPlayer.y = 0;
          newPlayer.velocityY = 0;
          newPlayer.isJumping = false;
        }

        newPlayer.x = Math.max(1, Math.min(29, newPlayer.x));
        newPlayer.z = Math.max(1, Math.min(29, newPlayer.z));

        return newPlayer;
      });

      if (shootingAnimation > 0) {
        setShootingAnimation(prev => Math.max(0, prev - 0.15));
      }

      ctx.fillStyle = settings.graphics === 'potato' ? '#87CEEB' : 'linear-gradient(to bottom, #87CEEB, #B0D8F0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const horizonY = canvas.height / 2 + player.pitch * 200;
      
      ctx.fillStyle = '#C4A57B';
      ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

      const fov = (settings.fov * Math.PI) / 180;
      const numRays = Math.floor(canvas.width / graphicsConfig.wallDetail);

      for (let i = 0; i < numRays; i++) {
        const rayAngle = (player.angle - fov / 2) + (i / numRays) * fov;
        const rayDirX = Math.cos(rayAngle);
        const rayDirZ = Math.sin(rayAngle);

        let closestDist = Infinity;
        let closestWall: Wall | null = null;

        for (const wall of walls) {
          const wallDirX = wall.x2 - wall.x1;
          const wallDirY = wall.y2 - wall.y1;
          const wallLen = Math.sqrt(wallDirX * wallDirX + wallDirY * wallDirY);
          const wallNormX = wallDirX / wallLen;
          const wallNormY = wallDirY / wallLen;

          const step = settings.graphics === 'potato' ? 0.5 : 0.1;
          for (let d = 0; d < wallLen; d += step) {
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
        }

        if (closestWall && closestDist < graphicsConfig.renderDistance) {
          const correctedDist = closestDist * Math.cos(rayAngle - player.angle);
          const wallHeight = (closestWall.height / correctedDist) * 200;
          
          const darkness = Math.max(0.2, 1 - (correctedDist / graphicsConfig.renderDistance));
          const r = parseInt(closestWall.color.slice(1, 3), 16) * darkness;
          const g = parseInt(closestWall.color.slice(3, 5), 16) * darkness;
          const b = parseInt(closestWall.color.slice(5, 7), 16) * darkness;

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          const x = (i / numRays) * canvas.width;
          const y = horizonY - wallHeight / 2;
          ctx.fillRect(x, y, (canvas.width / numRays) + 1, wallHeight);
        }
      }

      if (settings.graphics !== 'potato') {
        const weaponData = {
          ak47: { name: 'АК-47', color: '#2C2416', length: 0.4 },
          m4a1: { name: 'M4A1', color: '#1A1A1A', length: 0.35 },
          deagle: { name: 'Desert Eagle', color: '#3A3A3A', length: 0.25 },
          awp: { name: 'AWP', color: '#1F1F1F', length: 0.5 },
          knife: { name: 'Нож', color: '#4A4A4A', length: 0.15 }
        };

        const weapon = weaponData[playerStats.weapon];
        const weaponY = canvas.height - 100 + shootingAnimation * 30;
        const weaponX = canvas.width * 0.7;

        if (playerStats.weapon === 'knife') {
          ctx.fillStyle = weapon.color;
          ctx.beginPath();
          ctx.moveTo(weaponX, weaponY - 30);
          ctx.lineTo(weaponX + 40, weaponY - 10);
          ctx.lineTo(weaponX + 30, weaponY + 20);
          ctx.lineTo(weaponX - 10, weaponY);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = weapon.color;
          ctx.fillRect(weaponX, weaponY - 40, 150 * (weapon.length * 2.5), 20);
          ctx.fillRect(weaponX + 120, weaponY - 50, 10, 30);
          ctx.fillRect(weaponX - 20, weaponY - 30, 40, 10);
        }

        if (shootingAnimation > 0 && settings.particleEffects) {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(weaponX + 150, weaponY - 45, 10 + shootingAnimation * 20, 0, Math.PI * 2);
          ctx.fill();
        }
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
  }, [screen, player, keys, mouseMovement, playerStats.weapon, shootingAnimation, settings, walls, getGraphicsSettings]);

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
    deagle: 'Desert Eagle',
    awp: 'AWP',
    knife: 'Нож'
  };

  const graphicsLabels = {
    potato: '🥔 Картошка',
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

          <div className="text-center text-[#D4A574] text-sm">
            Нажмите <span className="font-bold text-[#4ECDC4]">ENTER</span> для старта
          </div>

          <div className="text-center text-[#D4A574]/50 text-xs uppercase tracking-wider">
            v1.6 | de_dust | {settings.platform}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'shop') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <Card className="bg-[#2C2416] border-[#D4A574]/50 p-8 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-[#D4A574] tracking-wider">МАГАЗИН</h2>
            <div className="text-2xl font-bold text-[#4ECDC4]">${playerStats.money}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {weaponShop.map(weapon => (
              <Card key={weapon.id} className="bg-black/40 border-[#D4A574]/30 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-[#D4A574]">{weapon.name}</h3>
                    <p className="text-sm text-[#4ECDC4]">Урон: {weapon.damage} | Патроны: {weapon.maxAmmo || 'Бесконечно'}</p>
                  </div>
                  <div className="text-lg font-bold text-[#4ECDC4]">${weapon.price}</div>
                </div>
                <Button
                  onClick={() => buyWeapon(weapon)}
                  disabled={playerStats.money < weapon.price}
                  className="w-full bg-[#4ECDC4] hover:bg-[#4ECDC4]/80 text-black font-bold disabled:opacity-50"
                >
                  Купить
                </Button>
              </Card>
            ))}
          </div>

          <Card className="bg-black/40 border-[#D4A574]/30 p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-xl font-bold text-[#D4A574]">Броня</h3>
                <p className="text-sm text-[#4ECDC4]">Защита: 100 HP</p>
              </div>
              <div className="text-lg font-bold text-[#4ECDC4]">$650</div>
            </div>
            <Button
              onClick={buyArmor}
              disabled={playerStats.money < 650 || playerStats.armor >= 100}
              className="w-full bg-[#4ECDC4] hover:bg-[#4ECDC4]/80 text-black font-bold disabled:opacity-50"
            >
              Купить броню
            </Button>
          </Card>

          <div className="flex gap-3">
            <Button 
              className="flex-1 h-12 bg-[#D4A574] hover:bg-[#D4A574]/80 text-black font-bold"
              onClick={() => {
                setScreen('game');
                setTimeout(() => canvasRef.current?.requestPointerLock(), 100);
              }}
            >
              Вернуться в игру
            </Button>
            <Button 
              className="h-12 bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white font-bold"
              onClick={() => setScreen('menu')}
            >
              Выйти в меню
            </Button>
          </div>

          <div className="mt-4 text-center text-[#D4A574] text-sm">
            Нажмите <span className="font-bold text-[#4ECDC4]">B</span> в игре для открытия магазина
          </div>
        </Card>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div className="min-h-screen bg-[#2C2416] p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4 py-4">
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
              <TabsList className="grid w-full grid-cols-4 bg-black/60">
                <TabsTrigger value="graphics" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-black">
                  ГРАФИКА
                </TabsTrigger>
                <TabsTrigger value="audio" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-black">
                  ЗВУК
                </TabsTrigger>
                <TabsTrigger value="controls" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-black">
                  УПРАВЛЕНИЕ
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-[#D4A574] data-[state=active]:text-black">
                  ДОПОЛНИТЕЛЬНО
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
                      <SelectItem value="potato" className="text-[#D4A574]">🥔 Картошка (ультра слабые ПК)</SelectItem>
                      <SelectItem value="very_low" className="text-[#D4A574]">Очень низко</SelectItem>
                      <SelectItem value="low" className="text-[#D4A574]">Низко</SelectItem>
                      <SelectItem value="medium" className="text-[#D4A574]">Средне</SelectItem>
                      <SelectItem value="high" className="text-[#D4A574]">Высоко</SelectItem>
                      <SelectItem value="ultra" className="text-[#D4A574]">Ультра</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[#4ECDC4] text-lg">FOV: {settings.fov}°</Label>
                  <Slider 
                    value={[settings.fov]} 
                    min={60}
                    max={120}
                    step={5}
                    onValueChange={(v) => setSettings({...settings, fov: v[0]})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">V-Sync</Label>
                  <Switch 
                    checked={settings.vsync}
                    onCheckedChange={(v) => setSettings({...settings, vsync: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Тени</Label>
                  <Switch 
                    checked={settings.shadows}
                    onCheckedChange={(v) => setSettings({...settings, shadows: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Сглаживание</Label>
                  <Switch 
                    checked={settings.antialiasing}
                    onCheckedChange={(v) => setSettings({...settings, antialiasing: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Текстуры HD</Label>
                  <Switch 
                    checked={settings.textures}
                    onCheckedChange={(v) => setSettings({...settings, textures: v})}
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
                <div className="space-y-3">
                  <Label className="text-[#4ECDC4] text-lg">Платформа</Label>
                  <Select value={settings.platform} onValueChange={(v: Platform) => setSettings({...settings, platform: v})}>
                    <SelectTrigger className="bg-black/60 border-[#D4A574] text-[#D4A574]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2C2416] border-[#D4A574]">
                      <SelectItem value="desktop" className="text-[#D4A574]">💻 Компьютер</SelectItem>
                      <SelectItem value="mobile" className="text-[#D4A574]">📱 Телефон</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-black/40 p-4 rounded-lg space-y-2 text-[#D4A574] text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>WASD - Движение</div>
                    <div>ЛКМ - Стрельба</div>
                    <div>Пробел - Прыжок</div>
                    <div>R - Перезарядка</div>
                    <div>B - Магазин</div>
                    <div>ESC - Пауза</div>
                    <div>Enter - Старт игры</div>
                    <div>Мышь - Обзор</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Граффити</Label>
                  <Switch 
                    checked={settings.graffiti}
                    onCheckedChange={(v) => setSettings({...settings, graffiti: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Эффекты частиц</Label>
                  <Switch 
                    checked={settings.particleEffects}
                    onCheckedChange={(v) => setSettings({...settings, particleEffects: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Размытие в движении</Label>
                  <Switch 
                    checked={settings.motionBlur}
                    onCheckedChange={(v) => setSettings({...settings, motionBlur: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Тряска экрана</Label>
                  <Switch 
                    checked={settings.screenShake}
                    onCheckedChange={(v) => setSettings({...settings, screenShake: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#4ECDC4] text-lg">Показывать FPS</Label>
                  <Switch 
                    checked={settings.showFPS}
                    onCheckedChange={(v) => setSettings({...settings, showFPS: v})}
                    className="data-[state=checked]:bg-[#4ECDC4]"
                  />
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
                <div className="text-4xl font-bold text-[#4ECDC4]">${playerStats.money}</div>
                <div className="text-[#D4A574] text-sm uppercase mt-2">Денег</div>
              </div>
            </div>

            <div className="bg-black/60 p-4 rounded-lg">
              <h3 className="text-[#4ECDC4] font-bold mb-3">ТЕКУЩЕЕ ОРУЖИЕ</h3>
              <div className="flex items-center justify-between">
                <span className="text-[#D4A574] text-xl">{weaponNames[playerStats.weapon]}</span>
                <span className="text-[#4ECDC4]">{playerStats.ammo} / {playerStats.maxAmmo}</span>
              </div>
            </div>

            <div className="bg-black/60 p-4 rounded-lg">
              <h3 className="text-[#4ECDC4] font-bold mb-3">КАРТА</h3>
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
                setTimeout(() => canvasRef.current?.requestPointerLock(), 100);
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
        className="absolute inset-0 w-full h-full object-cover cursor-crosshair"
        onClick={handleCanvasClick}
      />

      {!isPointerLocked && screen === 'game' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="text-center space-y-4">
            <Icon name="MousePointer2" size={48} className="text-[#4ECDC4] mx-auto" />
            <p className="text-[#4ECDC4] text-xl font-bold">Нажмите, чтобы играть</p>
            <p className="text-[#D4A574] text-sm">ESC - пауза | B - магазин</p>
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
        <div className="bg-black/80 px-4 py-2 rounded border-2 border-[#D4A574]">
          <div className="flex items-center gap-3">
            <Icon name="DollarSign" className="text-[#D4A574]" size={20} />
            <div className="text-[#D4A574] font-bold text-xl">{playerStats.money}</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/80 px-6 py-3 rounded border-2 border-[#D4A574] z-10">
        <div className="text-[#4ECDC4] text-sm mb-1">ОРУЖИЕ</div>
        <div className="text-[#D4A574] font-bold text-2xl">{weaponNames[playerStats.weapon]}</div>
        {playerStats.weapon !== 'knife' && (
          <div className="text-[#4ECDC4] text-lg mt-1">{playerStats.ammo} / {playerStats.maxAmmo}</div>
        )}
        <div className="flex gap-2 mt-2">
          {(['knife', 'deagle', 'ak47', 'm4a1', 'awp'] as Weapon[]).map((weapon) => (
            <button
              key={weapon}
              onClick={() => setPlayerStats({...playerStats, weapon})}
              className={`px-3 py-1 rounded text-xs font-bold ${
                playerStats.weapon === weapon 
                  ? 'bg-[#4ECDC4] text-black' 
                  : 'bg-black/60 text-[#D4A574] border border-[#D4A574]'
              }`}
            >
              {weapon === 'knife' ? '🔪' : weapon === 'ak47' ? 'AK' : weapon === 'm4a1' ? 'M4' : weapon === 'deagle' ? 'DE' : 'AWP'}
            </button>
          ))}
        </div>
      </div>

      {settings.showFPS && (
        <div className="absolute top-4 right-4 bg-black/80 px-4 py-2 rounded border-2 border-[#4ECDC4] text-[#4ECDC4] font-bold text-lg z-10">
          {fps} FPS
        </div>
      )}

      <div className="absolute top-16 right-4 bg-black/80 px-4 py-2 rounded border-2 border-[#D4A574] text-[#4ECDC4] text-sm z-10">
        {graphicsLabels[settings.graphics]}
      </div>

      {settings.platform === 'mobile' && (
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
              if (playerStats.weapon === 'knife' || playerStats.ammo > 0) {
                setIsShooting(true);
                setShootingAnimation(1);
                if (playerStats.weapon !== 'knife') {
                  setPlayerStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));
                }
              }
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
