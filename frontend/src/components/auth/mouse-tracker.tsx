import { useEffect, useRef, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MousePoint {
  x: number;
  y: number;
  timestamp: number;
  speed?: number;
}

interface MouseTrackerProps {
  onDataCapture?: (data: MousePoint[]) => void;
  captureInterval?: number;
  isActive?: boolean;
}

export function MouseTracker({
  onDataCapture,
  captureInterval = 100,
  isActive = true,
}: MouseTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<MousePoint[]>([]);
  const lastPointRef = useRef<MousePoint | null>(null);
  const [stats, setStats] = useState({
    pointCount: 0,
    avgSpeed: 0,
    maxSpeed: 0,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw grid
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x < rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    const points = pointsRef.current;
    if (points.length < 2) return;

    // Draw path with gradient based on speed
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const speed = curr.speed || 0;
      
      // Color based on speed
      const hue = Math.max(0, Math.min(120, 120 - speed * 0.5));
      ctx.strokeStyle = `hsla(${hue}, 80%, 50%, 0.8)`;
      ctx.lineWidth = Math.max(1, Math.min(4, 2 + speed * 0.02));

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    // Draw current position
    if (points.length > 0) {
      const last = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(var(--primary))";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(last.x, last.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(var(--primary-foreground))";
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Track mouse movement globally across the entire document
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Normalize coordinates relative to the canvas for visualization
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const timestamp = Date.now();

      let speed = 0;
      if (lastPointRef.current) {
        // Use actual screen coordinates for accurate speed calculation
        const dx = e.clientX - (lastPointRef.current as any).screenX;
        const dy = e.clientY - (lastPointRef.current as any).screenY;
        const dt = timestamp - lastPointRef.current.timestamp;
        speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt * 100 : 0;
      }

      const point: MousePoint & { screenX: number; screenY: number } = { 
        x, y, timestamp, speed, 
        screenX: e.clientX, screenY: e.clientY 
      };
      pointsRef.current.push(point);
      lastPointRef.current = point;

      // Keep only last 500 points
      if (pointsRef.current.length > 500) {
        pointsRef.current = pointsRef.current.slice(-500);
      }

      // Calculate stats
      const speeds = pointsRef.current.map(p => p.speed || 0).filter(s => s > 0);
      setStats({
        pointCount: pointsRef.current.length,
        avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        maxSpeed: Math.max(...speeds, 0),
      });

      draw();
    };

    // Listen to document-level mouse movements for comprehensive capture
    document.addEventListener("mousemove", handleMouseMove);
    draw();

    // Send data at intervals
    const intervalId = setInterval(() => {
      if (onDataCapture && pointsRef.current.length > 0) {
        onDataCapture([...pointsRef.current]);
      }
    }, captureInterval);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearInterval(intervalId);
    };
  }, [isActive, captureInterval, onDataCapture, draw]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">Mouse Movement Tracking</CardTitle>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Capturing" : "Paused"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="relative w-full h-[200px] bg-muted/50 rounded-md overflow-hidden cursor-crosshair"
          data-testid="mouse-tracker-container"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            data-testid="canvas-mouse-tracker"
          />
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <p className="text-sm text-muted-foreground">Tracking paused</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>Points: {stats.pointCount}</span>
          <span>Avg Speed: {stats.avgSpeed.toFixed(1)}</span>
          <span>Max Speed: {stats.maxSpeed.toFixed(1)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
