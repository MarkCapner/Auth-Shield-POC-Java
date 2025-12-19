import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface KeystrokeEvent {
  key: string;
  keyDown: number;
  keyUp: number;
  holdTime: number;
  flightTime?: number;
}

interface KeystrokeTrackerProps {
  onDataCapture?: (data: KeystrokeEvent[]) => void;
  isActive?: boolean;
  placeholder?: string;
}

export function KeystrokeTracker({
  onDataCapture,
  isActive = true,
  placeholder = "Type here to analyze your keystroke pattern...",
}: KeystrokeTrackerProps) {
  const [text, setText] = useState("");
  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [stats, setStats] = useState({
    avgHoldTime: 0,
    avgFlightTime: 0,
    typingSpeed: 0,
    keyCount: 0,
  });
  const pendingKeysRef = useRef<Map<string, number>>(new Map());
  const lastKeyUpRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawRhythm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const recentEvents = events.slice(-30);
    if (recentEvents.length < 2) {
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "12px 'IBM Plex Sans', system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Start typing to see your rhythm", width / 2, height / 2);
      return;
    }

    const barWidth = (width - 20) / recentEvents.length;
    const maxHold = Math.max(...recentEvents.map(e => e.holdTime), 200);
    const maxFlight = Math.max(...recentEvents.map(e => e.flightTime || 0), 200);

    recentEvents.forEach((event, i) => {
      const x = 10 + i * barWidth;
      
      // Hold time bar (bottom)
      const holdHeight = (event.holdTime / maxHold) * (height / 2 - 10);
      ctx.fillStyle = "hsl(var(--chart-1))";
      ctx.fillRect(x + 2, height - holdHeight, barWidth - 4, holdHeight);

      // Flight time bar (top, inverted)
      if (event.flightTime) {
        const flightHeight = (event.flightTime / maxFlight) * (height / 2 - 10);
        ctx.fillStyle = "hsl(var(--chart-2))";
        ctx.fillRect(x + 2, 0, barWidth - 4, flightHeight);
      }
    });

    // Center line
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [events]);

  useEffect(() => {
    drawRhythm();
  }, [drawRhythm]);

  useEffect(() => {
    if (events.length === 0) return;

    const holdTimes = events.map(e => e.holdTime);
    const flightTimes = events.map(e => e.flightTime).filter((f): f is number => f !== undefined);
    
    const avgHold = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
    const avgFlight = flightTimes.length > 0 
      ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length 
      : 0;

    const totalTime = events.length > 1 
      ? events[events.length - 1].keyUp - events[0].keyDown 
      : 0;
    const wpm = totalTime > 0 ? (events.length / 5) / (totalTime / 60000) : 0;

    setStats({
      avgHoldTime: avgHold,
      avgFlightTime: avgFlight,
      typingSpeed: wpm,
      keyCount: events.length,
    });

    if (onDataCapture) {
      onDataCapture(events);
    }
  }, [events, onDataCapture]);

  const processKeyDown = useCallback((key: string) => {
    if (!isActive) return;
    
    const now = performance.now();
    
    if (!pendingKeysRef.current.has(key)) {
      pendingKeysRef.current.set(key, now);
    }
  }, [isActive]);

  const processKeyUp = useCallback((key: string) => {
    if (!isActive) return;

    const now = performance.now();
    const keyDown = pendingKeysRef.current.get(key);

    if (keyDown) {
      const holdTime = now - keyDown;
      const flightTime = lastKeyUpRef.current > 0 ? keyDown - lastKeyUpRef.current : undefined;
      
      const event: KeystrokeEvent = {
        key,
        keyDown,
        keyUp: now,
        holdTime,
        flightTime,
      };

      setEvents(prev => [...prev, event].slice(-100));

      pendingKeysRef.current.delete(key);
      lastKeyUpRef.current = now;
    }
  }, [isActive, onDataCapture]);

  // Listen to global keystrokes for biometric capture
  useEffect(() => {
    if (!isActive) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      processKeyDown(e.key);
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      processKeyUp(e.key);
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("keyup", handleGlobalKeyUp);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("keyup", handleGlobalKeyUp);
    };
  }, [isActive, processKeyDown, processKeyUp]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    processKeyDown(e.key);
  }, [processKeyDown]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    processKeyUp(e.key);
  }, [processKeyUp]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">Keystroke Dynamics</CardTitle>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Capturing" : "Paused"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          disabled={!isActive}
          className="font-mono"
          data-testid="input-keystroke-tracker"
        />
        
        <div className="relative h-[100px] bg-muted/50 rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            data-testid="canvas-keystroke-rhythm"
          />
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">{stats.keyCount}</p>
            <p className="text-xs text-muted-foreground">Keys</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{stats.avgHoldTime.toFixed(0)}ms</p>
            <p className="text-xs text-muted-foreground">Avg Hold</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{stats.avgFlightTime.toFixed(0)}ms</p>
            <p className="text-xs text-muted-foreground">Avg Flight</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{stats.typingSpeed.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">WPM</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-chart-1" />
            <span className="text-muted-foreground">Hold Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-chart-2" />
            <span className="text-muted-foreground">Flight Time</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
