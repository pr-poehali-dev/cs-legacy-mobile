import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

type GameScreen = 'menu' | 'game' | 'settings' | 'pause' | 'stats';
type Weapon = 'ak47' | 'm4a1' | 'deagle';

interface PlayerStats {
  hp: number;
  armor: number;
  kills: number;
  deaths: number;
  weapon: Weapon;
}

interface Settings {
  graphics: number;
  music: number;
  sound: number;
  sensitivity: number;
  graffiti: boolean;
}

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 100,
    armor: 100,
    kills: 0,
    deaths: 0,
    weapon: 'ak47'
  });
  const [settings, setSettings] = useState<Settings>({
    graphics: 50,
    music: 50,
    sound: 50,
    sensitivity: 50,
    graffiti: true
  });
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [lookPosition, setLookPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    if (screen === 'game' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawGame = () => {
        ctx.fillStyle = '#D4A574';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

        ctx.fillStyle = '#2C2416';
        for (let i = 0; i < 5; i++) {
          const x = (i * canvas.width) / 5 + 50;
          const height = 150 + Math.random() * 100;
          ctx.fillRect(x, canvas.height * 0.6 - height, 100, height);
        }

        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(canvas.width / 2 - 2, canvas.height / 2 - 15, 4, 30);
        ctx.fillRect(canvas.width / 2 - 15, canvas.height / 2 - 2, 30, 4);
      };

      drawGame();
    }
  }, [screen]);

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    const x = ((touch.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 100;
    const y = ((touch.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 100;
    
    const distance = Math.sqrt(x * x + y * y);
    if (distance > 100) {
      const angle = Math.atan2(y, x);
      setJoystickPosition({ x: Math.cos(angle) * 100, y: Math.sin(angle) * 100 });
    } else {
      setJoystickPosition({ x, y });
    }
  };

  const handleLookMove = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    const x = ((touch.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 100;
    const y = ((touch.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 100;
    setLookPosition({ x, y });
  };

  const resetJoystick = () => setJoystickPosition({ x: 0, y: 0 });
  const resetLook = () => setLookPosition({ x: 0, y: 0 });

  const weaponNames = {
    ak47: 'АК-47',
    m4a1: 'M4A1',
    deagle: 'Desert Eagle'
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
                  <Label className="text-[#4ECDC4] text-lg">Качество графики: {settings.graphics}%</Label>
                  <Slider 
                    value={[settings.graphics]} 
                    onValueChange={(v) => setSettings({...settings, graphics: v[0]})}
                    className="[&_[role=slider]]:bg-[#4ECDC4] [&_.slider-track]:bg-[#D4A574]/30"
                  />
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
                    <div>E - Использовать</div>
                    <div>R - Перезарядка</div>
                    <div>Q - Быстрое оружие</div>
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
              onClick={() => setScreen('game')}
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
              onClick={() => setScreen('menu')}
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
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute top-4 left-4 space-y-2 z-10">
        <div className="bg-black/60 px-4 py-2 rounded border-2 border-[#4ECDC4]">
          <div className="flex items-center gap-3">
            <Icon name="Heart" className="text-[#FF6B35]" size={20} />
            <div className="text-[#4ECDC4] font-bold text-xl">{playerStats.hp}</div>
          </div>
        </div>
        <div className="bg-black/60 px-4 py-2 rounded border-2 border-[#4ECDC4]">
          <div className="flex items-center gap-3">
            <Icon name="Shield" className="text-[#4ECDC4]" size={20} />
            <div className="text-[#4ECDC4] font-bold text-xl">{playerStats.armor}</div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          className="bg-black/60 hover:bg-black/80 text-[#D4A574]"
          onClick={() => setScreen('pause')}
        >
          <Icon name="Pause" size={24} />
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 bg-black/60 px-6 py-3 rounded border-2 border-[#D4A574] z-10">
        <div className="text-[#4ECDC4] text-sm mb-1">ОРУЖИЕ</div>
        <div className="text-[#D4A574] font-bold text-2xl">{weaponNames[playerStats.weapon]}</div>
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

      {isMobile && (
        <>
          <div 
            className="absolute bottom-20 left-8 w-32 h-32 bg-black/40 rounded-full border-2 border-[#4ECDC4] z-20"
            onTouchStart={handleJoystickMove}
            onTouchMove={handleJoystickMove}
            onTouchEnd={resetJoystick}
            onMouseDown={handleJoystickMove}
            onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e)}
            onMouseUp={resetJoystick}
            onMouseLeave={resetJoystick}
          >
            <div 
              className="absolute top-1/2 left-1/2 w-12 h-12 bg-[#4ECDC4] rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform"
              style={{
                transform: `translate(calc(-50% + ${joystickPosition.x * 0.4}px), calc(-50% + ${joystickPosition.y * 0.4}px))`
              }}
            />
          </div>

          <div 
            className="absolute bottom-20 right-8 w-32 h-32 bg-black/40 rounded-full border-2 border-[#D4A574] z-20"
            onTouchStart={handleLookMove}
            onTouchMove={handleLookMove}
            onTouchEnd={resetLook}
            onMouseDown={handleLookMove}
            onMouseMove={(e) => e.buttons === 1 && handleLookMove(e)}
            onMouseUp={resetLook}
            onMouseLeave={resetLook}
          >
            <div 
              className="absolute top-1/2 left-1/2 w-12 h-12 bg-[#D4A574] rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform"
              style={{
                transform: `translate(calc(-50% + ${lookPosition.x * 0.4}px), calc(-50% + ${lookPosition.y * 0.4}px))`
              }}
            />
          </div>

          <button
            className="absolute bottom-24 right-48 w-20 h-20 bg-[#FF6B35] rounded-full border-4 border-[#FF6B35]/50 z-20 flex items-center justify-center active:scale-95 transition-transform"
            onTouchStart={() => {}}
            onClick={() => {}}
          >
            <Icon name="Crosshair" className="text-white" size={32} />
          </button>
        </>
      )}
    </div>
  );
};

export default Index;
