import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TouchEvent {
  type: "start" | "move" | "end";
  timestamp: number;
  touches: number;
  x: number;
  y: number;
  pressure?: number;
  radiusX?: number;
  radiusY?: number;
}

interface TouchGesture {
  type: "tap" | "swipe" | "pinch" | "long_press" | "drag";
  startTime: number;
  endTime: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distance: number;
  velocity: number;
  direction?: "up" | "down" | "left" | "right";
}

interface TouchTrackerProps {
  onDataCapture?: (data: { events: TouchEvent[]; gestures: TouchGesture[] }) => void;
  isActive?: boolean;
}

export function TouchTracker({
  onDataCapture,
  isActive = true,
}: TouchTrackerProps) {
  const [events, setEvents] = useState<TouchEvent[]>([]);
  const [gestures, setGestures] = useState<TouchGesture[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [stats, setStats] = useState({
    totalTouches: 0,
    avgPressure: 0,
    avgDuration: 0,
    gestureCount: 0,
    swipeCount: 0,
    tapCount: 0,
  });

  const touchAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const drawTouchPattern = useCallback(() => {
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

    const recentEvents = events.slice(-100);
    if (recentEvents.length < 2) {
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "12px 'IBM Plex Sans', system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        isTouchDevice ? "Touch this area to capture patterns" : "Touch not available on this device",
        width / 2,
        height / 2
      );
      return;
    }

    ctx.strokeStyle = "hsl(var(--chart-3))";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let isDrawing = false;
    recentEvents.forEach((event, i) => {
      const x = (event.x / 100) * width;
      const y = (event.y / 100) * height;

      if (event.type === "start") {
        ctx.beginPath();
        ctx.moveTo(x, y);
        isDrawing = true;

        ctx.fillStyle = "hsl(var(--chart-1))";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (event.type === "move" && isDrawing) {
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = "hsl(var(--chart-2) / 0.3)";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (event.type === "end") {
        if (isDrawing) {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        isDrawing = false;

        ctx.fillStyle = "hsl(var(--chart-4))";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [events, isTouchDevice]);

  useEffect(() => {
    drawTouchPattern();
  }, [drawTouchPattern]);

  useEffect(() => {
    if (events.length === 0 && gestures.length === 0) return;

    const pressures = events.filter(e => e.pressure !== undefined).map(e => e.pressure!);
    const avgPressure = pressures.length > 0
      ? pressures.reduce((a, b) => a + b, 0) / pressures.length
      : 0;

    const durations = gestures.map(g => g.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const swipes = gestures.filter(g => g.type === "swipe").length;
    const taps = gestures.filter(g => g.type === "tap").length;

    setStats({
      totalTouches: events.filter(e => e.type === "start").length,
      avgPressure,
      avgDuration,
      gestureCount: gestures.length,
      swipeCount: swipes,
      tapCount: taps,
    });

    if (onDataCapture) {
      onDataCapture({ events, gestures });
    }
  }, [events, gestures, onDataCapture]);

  const getRelativePosition = useCallback((touch: React.Touch, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      x: ((touch.clientX - rect.left) / rect.width) * 100,
      y: ((touch.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const classifyGesture = useCallback((
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): TouchGesture => {
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const velocity = distance / duration;

    const now = performance.now();
    const startTime = now - duration;

    let type: TouchGesture["type"] = "tap";
    let direction: TouchGesture["direction"] | undefined;

    if (duration > 500 && distance < 10) {
      type = "long_press";
    } else if (distance > 20) {
      if (velocity > 0.3) {
        type = "swipe";
      } else {
        type = "drag";
      }

      const dx = endX - startX;
      const dy = endY - startY;

      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? "right" : "left";
      } else {
        direction = dy > 0 ? "down" : "up";
      }
    }

    return {
      type,
      startTime,
      endTime: now,
      duration,
      startX,
      startY,
      endX,
      endY,
      distance,
      velocity,
      direction,
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = touchAreaRef.current;
    if (!element) return;

    const pos = getRelativePosition(touch, element);
    const now = performance.now();

    touchStartRef.current = { x: pos.x, y: pos.y, time: now };
    lastTouchRef.current = { x: pos.x, y: pos.y, time: now };

    const event: TouchEvent = {
      type: "start",
      timestamp: now,
      touches: e.touches.length,
      x: pos.x,
      y: pos.y,
      pressure: (touch as any).force || undefined,
      radiusX: (touch as any).radiusX || undefined,
      radiusY: (touch as any).radiusY || undefined,
    };

    setEvents(prev => [...prev.slice(-200), event]);
  }, [isActive, getRelativePosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isActive || !touchStartRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = touchAreaRef.current;
    if (!element) return;

    const pos = getRelativePosition(touch, element);
    const now = performance.now();

    lastTouchRef.current = { x: pos.x, y: pos.y, time: now };

    const event: TouchEvent = {
      type: "move",
      timestamp: now,
      touches: e.touches.length,
      x: pos.x,
      y: pos.y,
      pressure: (touch as any).force || undefined,
      radiusX: (touch as any).radiusX || undefined,
      radiusY: (touch as any).radiusY || undefined,
    };

    setEvents(prev => [...prev.slice(-200), event]);
  }, [isActive, getRelativePosition]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isActive || !touchStartRef.current) return;
    e.preventDefault();

    const start = touchStartRef.current;
    const last = lastTouchRef.current || start;
    const now = performance.now();
    const duration = now - start.time;

    const event: TouchEvent = {
      type: "end",
      timestamp: now,
      touches: 0,
      x: last.x,
      y: last.y,
    };

    setEvents(prev => [...prev.slice(-200), event]);

    const gesture = classifyGesture(start.x, start.y, last.x, last.y, duration);
    setGestures(prev => [...prev.slice(-50), gesture]);

    touchStartRef.current = null;
    lastTouchRef.current = null;
  }, [isActive, classifyGesture]);

  const clearData = useCallback(() => {
    setEvents([]);
    setGestures([]);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Touch Pattern Analysis</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {isTouchDevice ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20" data-testid="badge-touch-available">
              Touch Available
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20" data-testid="badge-touch-unavailable">
              No Touch
            </Badge>
          )}
          {isActive && (
            <Badge variant="secondary" data-testid="badge-touch-tracking">Tracking</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={touchAreaRef}
          className="relative h-48 border rounded-md bg-muted/30 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-testid="touch-capture-area"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold font-mono" data-testid="text-touch-count">
              {stats.totalTouches}
            </div>
            <div className="text-xs text-muted-foreground">Touches</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" data-testid="text-gesture-count">
              {stats.gestureCount}
            </div>
            <div className="text-xs text-muted-foreground">Gestures</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" data-testid="text-avg-duration">
              {stats.avgDuration.toFixed(0)}ms
            </div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" data-testid="badge-tap-count">
            Taps: {stats.tapCount}
          </Badge>
          <Badge variant="outline" data-testid="badge-swipe-count">
            Swipes: {stats.swipeCount}
          </Badge>
          {stats.avgPressure > 0 && (
            <Badge variant="outline" data-testid="badge-pressure">
              Pressure: {stats.avgPressure.toFixed(2)}
            </Badge>
          )}
        </div>

        {gestures.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Recent Gestures</div>
            <div className="flex flex-wrap gap-1">
              {gestures.slice(-8).map((gesture, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs capitalize"
                  data-testid={`badge-gesture-${i}`}
                >
                  {gesture.type}
                  {gesture.direction && ` ${gesture.direction}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
