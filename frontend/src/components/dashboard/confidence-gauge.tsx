import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfidenceGaugeProps {
  score: number;
  threshold?: number;
  size?: number;
  label?: string;
}

export function ConfidenceGauge({
  score,
  threshold = 0.7,
  size = 200,
  label = "Confidence Score",
}: ConfidenceGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - 40) / 2;
    const lineWidth = 16;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const totalAngle = endAngle - startAngle;

    ctx.clearRect(0, 0, size, size);

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted")
      .trim()
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--muted").trim()})`
      : "#e5e7eb";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Threshold marker
    const thresholdAngle = startAngle + totalAngle * threshold;
    const thresholdX = centerX + (radius + 12) * Math.cos(thresholdAngle);
    const thresholdY = centerY + (radius + 12) * Math.sin(thresholdAngle);
    ctx.beginPath();
    ctx.arc(thresholdX, thresholdY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim()
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()})`
      : "#374151";
    ctx.fill();

    // Score arc with gradient
    const scoreAngle = startAngle + totalAngle * Math.min(score, 1);
    const gradient = ctx.createLinearGradient(0, size, size, 0);
    
    if (score >= threshold) {
      gradient.addColorStop(0, "#22c55e");
      gradient.addColorStop(1, "#16a34a");
    } else if (score >= threshold * 0.7) {
      gradient.addColorStop(0, "#f59e0b");
      gradient.addColorStop(1, "#d97706");
    } else {
      gradient.addColorStop(0, "#ef4444");
      gradient.addColorStop(1, "#dc2626");
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, scoreAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score text
    ctx.font = "600 32px 'IBM Plex Sans', system-ui, sans-serif";
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim()
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()})`
      : "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(score * 100)}%`, centerX, centerY - 8);

    // Label
    ctx.font = "400 12px 'IBM Plex Sans', system-ui, sans-serif";
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted-foreground")
      .trim()
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground").trim()})`
      : "#6b7280";
    ctx.fillText("confidence", centerX, centerY + 16);

  }, [score, threshold, size]);

  const getConfidenceLevel = () => {
    if (score >= threshold) return { text: "High", color: "text-status-online" };
    if (score >= threshold * 0.7) return { text: "Medium", color: "text-status-away" };
    return { text: "Low", color: "text-destructive" };
  };

  const level = getConfidenceLevel();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          data-testid="canvas-confidence-gauge"
          className="mb-2"
        />
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${level.color}`}>
            {level.text} Confidence
          </span>
          <span className="text-xs text-muted-foreground">
            (Threshold: {Math.round(threshold * 100)}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
