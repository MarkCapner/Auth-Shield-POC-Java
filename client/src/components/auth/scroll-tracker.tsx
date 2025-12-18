import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScrollEvent {
  timestamp: number;
  deltaY: number;
  direction: "up" | "down";
  speed: number;
}

interface ScrollTrackerProps {
  onDataCapture?: (data: { 
    events: ScrollEvent[]; 
    avgSpeed: number; 
    frequency: number;
    upRatio: number;
  }) => void;
  isActive?: boolean;
}

export function ScrollTracker({
  onDataCapture,
  isActive = true,
}: ScrollTrackerProps) {
  const [events, setEvents] = useState<ScrollEvent[]>([]);
  const [stats, setStats] = useState({
    avgSpeed: 0,
    maxSpeed: 0,
    frequency: 0,
    upRatio: 0,
    eventCount: 0,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastScrollRef = useRef<number>(0);
  const scrollCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const drawVisualization = useCallback(() => {
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

    const recentEvents = events.slice(-50);
    if (recentEvents.length < 2) {
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "12px 'IBM Plex Sans', system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Scroll anywhere to see your pattern", width / 2, height / 2);
      return;
    }

    const barWidth = (width - 20) / recentEvents.length;
    const maxSpeed = Math.max(...recentEvents.map(e => Math.abs(e.speed)), 100);
    const centerY = height / 2;

    // Draw center line
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    recentEvents.forEach((event, i) => {
      const x = 10 + i * barWidth;
      const barHeight = (Math.abs(event.speed) / maxSpeed) * (height / 2 - 10);
      
      if (event.direction === "down") {
        ctx.fillStyle = "hsl(var(--chart-3))";
        ctx.fillRect(x + 2, centerY, barWidth - 4, barHeight);
      } else {
        ctx.fillStyle = "hsl(var(--chart-4))";
        ctx.fillRect(x + 2, centerY - barHeight, barWidth - 4, barHeight);
      }
    });
  }, [events]);

  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]);

  useEffect(() => {
    if (events.length === 0) return;

    const speeds = events.map(e => e.speed);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);
    
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const frequency = elapsed > 0 ? scrollCountRef.current / elapsed : 0;
    
    const upCount = events.filter(e => e.direction === "up").length;
    const upRatio = events.length > 0 ? upCount / events.length : 0;

    setStats({
      avgSpeed,
      maxSpeed,
      frequency,
      upRatio,
      eventCount: events.length,
    });

    if (onDataCapture) {
      onDataCapture({
        events,
        avgSpeed,
        frequency,
        upRatio,
      });
    }
  }, [events, onDataCapture]);

  useEffect(() => {
    if (!isActive) return;

    startTimeRef.current = Date.now();
    scrollCountRef.current = 0;

    const handleScroll = (e: WheelEvent) => {
      const now = Date.now();
      const deltaY = e.deltaY;
      const direction = deltaY > 0 ? "down" : "up";
      
      // Calculate speed based on delta and time since last scroll
      const timeSinceLast = now - lastScrollRef.current;
      const speed = timeSinceLast > 0 ? Math.abs(deltaY) / Math.max(timeSinceLast, 10) * 100 : 0;
      
      const scrollEvent: ScrollEvent = {
        timestamp: now,
        deltaY,
        direction,
        speed,
      };

      scrollCountRef.current++;
      lastScrollRef.current = now;

      setEvents(prev => [...prev, scrollEvent].slice(-100));
    };

    document.addEventListener("wheel", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("wheel", handleScroll);
    };
  }, [isActive, onDataCapture]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">Scroll Dynamics</CardTitle>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Capturing" : "Paused"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-[100px] bg-muted/50 rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            data-testid="canvas-scroll-tracker"
          />
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold" data-testid="text-scroll-count">{stats.eventCount}</p>
            <p className="text-xs text-muted-foreground">Scrolls</p>
          </div>
          <div>
            <p className="text-lg font-semibold" data-testid="text-scroll-speed">{stats.avgSpeed.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg Speed</p>
          </div>
          <div>
            <p className="text-lg font-semibold" data-testid="text-scroll-freq">{stats.frequency.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Per Sec</p>
          </div>
          <div>
            <p className="text-lg font-semibold" data-testid="text-scroll-ratio">{(stats.upRatio * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Up Ratio</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-chart-4" />
            <span className="text-muted-foreground">Scroll Up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-chart-3" />
            <span className="text-muted-foreground">Scroll Down</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
