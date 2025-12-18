import { storage } from "./storage";
import type { BehavioralPattern } from "@shared/schema";

interface BaselineProfile {
  avgMouseSpeed: { mean: number; stdDev: number };
  avgMouseAcceleration: { mean: number; stdDev: number };
  avgKeyHoldTime: { mean: number; stdDev: number };
  avgFlightTime: { mean: number; stdDev: number };
  typingSpeed: { mean: number; stdDev: number };
  straightLineRatio: { mean: number; stdDev: number };
  curveComplexity: { mean: number; stdDev: number };
}

interface AnomalyResult {
  overallScore: number;
  anomalyFactors: {
    factor: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
    isAnomaly: boolean;
  }[];
  isAnomaly: boolean;
  confidenceLevel: "high" | "medium" | "low";
  recommendation: "allow" | "step_up" | "block";
}

interface CurrentBehaviorInput {
  mouseVelocity?: number | null;
  mouseAcceleration?: number | null;
  clickInterval?: number | null;
  dwellTime?: number | null;
  flightTime?: number | null;
  typingSpeed?: number | null;
  scrollSpeed?: number | null;
  scrollFrequency?: number | null;
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return Math.abs(value - mean) / stdDev;
}

function zScoreToAnomalyProbability(zScore: number): number {
  if (zScore <= 1) return 0;
  if (zScore <= 2) return (zScore - 1) * 0.3;
  if (zScore <= 3) return 0.3 + (zScore - 2) * 0.4;
  return Math.min(1, 0.7 + (zScore - 3) * 0.15);
}

export class MLScoringEngine {
  async getUserBaseline(userId: string): Promise<BaselineProfile | null> {
    const patterns = await storage.getBehavioralPatternsByUser(userId);
    
    if (patterns.length < 3) {
      return null;
    }

    const avgMouseSpeeds = patterns.map(p => p.avgMouseSpeed).filter(v => v != null) as number[];
    const avgMouseAccelerations = patterns.map(p => p.avgMouseAcceleration).filter(v => v != null) as number[];
    const avgKeyHoldTimes = patterns.map(p => p.avgKeyHoldTime).filter(v => v != null) as number[];
    const avgFlightTimes = patterns.map(p => p.avgFlightTime).filter(v => v != null) as number[];
    const typingSpeeds = patterns.map(p => p.typingSpeed).filter(v => v != null) as number[];
    const straightLineRatios = patterns.map(p => p.straightLineRatio).filter(v => v != null) as number[];
    const curveComplexities = patterns.map(p => p.curveComplexity).filter(v => v != null) as number[];

    return {
      avgMouseSpeed: {
        mean: calculateMean(avgMouseSpeeds),
        stdDev: calculateStdDev(avgMouseSpeeds, calculateMean(avgMouseSpeeds))
      },
      avgMouseAcceleration: {
        mean: calculateMean(avgMouseAccelerations),
        stdDev: calculateStdDev(avgMouseAccelerations, calculateMean(avgMouseAccelerations))
      },
      avgKeyHoldTime: {
        mean: calculateMean(avgKeyHoldTimes),
        stdDev: calculateStdDev(avgKeyHoldTimes, calculateMean(avgKeyHoldTimes))
      },
      avgFlightTime: {
        mean: calculateMean(avgFlightTimes),
        stdDev: calculateStdDev(avgFlightTimes, calculateMean(avgFlightTimes))
      },
      typingSpeed: {
        mean: calculateMean(typingSpeeds),
        stdDev: calculateStdDev(typingSpeeds, calculateMean(typingSpeeds))
      },
      straightLineRatio: {
        mean: calculateMean(straightLineRatios),
        stdDev: calculateStdDev(straightLineRatios, calculateMean(straightLineRatios))
      },
      curveComplexity: {
        mean: calculateMean(curveComplexities),
        stdDev: calculateStdDev(curveComplexities, calculateMean(curveComplexities))
      }
    };
  }

  async scoreCurrentBehavior(
    userId: string, 
    currentPattern: CurrentBehaviorInput
  ): Promise<AnomalyResult> {
    const baseline = await this.getUserBaseline(userId);
    
    if (!baseline) {
      return {
        overallScore: 0.85,
        anomalyFactors: [],
        isAnomaly: false,
        confidenceLevel: "low",
        recommendation: "step_up"
      };
    }

    const anomalyFactors: AnomalyResult["anomalyFactors"] = [];
    const weights = {
      avgMouseSpeed: 0.20,
      avgMouseAcceleration: 0.15,
      avgKeyHoldTime: 0.20,
      avgFlightTime: 0.15,
      typingSpeed: 0.20,
      straightLineRatio: 0.05,
      curveComplexity: 0.05
    };

    const checkFactor = (
      name: string,
      value: number | null | undefined,
      stats: { mean: number; stdDev: number },
      weight: number
    ) => {
      if (value == null || stats.mean === 0) return 0;
      
      const zScore = calculateZScore(value, stats.mean, stats.stdDev);
      const anomalyProb = zScoreToAnomalyProbability(zScore);
      
      anomalyFactors.push({
        factor: name,
        currentValue: value,
        expectedValue: stats.mean,
        deviation: zScore,
        isAnomaly: zScore > 2
      });

      return anomalyProb * weight;
    };

    let totalAnomalyScore = 0;
    let totalWeight = 0;

    if (currentPattern.mouseVelocity != null) {
      totalAnomalyScore += checkFactor("avgMouseSpeed", currentPattern.mouseVelocity, baseline.avgMouseSpeed, weights.avgMouseSpeed);
      totalWeight += weights.avgMouseSpeed;
    }
    if (currentPattern.mouseAcceleration != null) {
      totalAnomalyScore += checkFactor("avgMouseAcceleration", currentPattern.mouseAcceleration, baseline.avgMouseAcceleration, weights.avgMouseAcceleration);
      totalWeight += weights.avgMouseAcceleration;
    }
    if (currentPattern.dwellTime != null) {
      totalAnomalyScore += checkFactor("avgKeyHoldTime", currentPattern.dwellTime, baseline.avgKeyHoldTime, weights.avgKeyHoldTime);
      totalWeight += weights.avgKeyHoldTime;
    }
    if (currentPattern.flightTime != null) {
      totalAnomalyScore += checkFactor("avgFlightTime", currentPattern.flightTime, baseline.avgFlightTime, weights.avgFlightTime);
      totalWeight += weights.avgFlightTime;
    }
    if (currentPattern.typingSpeed != null) {
      totalAnomalyScore += checkFactor("typingSpeed", currentPattern.typingSpeed, baseline.typingSpeed, weights.typingSpeed);
      totalWeight += weights.typingSpeed;
    }

    const normalizedAnomalyScore = totalWeight > 0 ? totalAnomalyScore / totalWeight : 0;
    const trustScore = 1 - normalizedAnomalyScore;
    
    const anomalyCount = anomalyFactors.filter(f => f.isAnomaly).length;
    const isAnomaly = normalizedAnomalyScore > 0.5 || anomalyCount >= 3;

    let confidenceLevel: "high" | "medium" | "low";
    if (anomalyFactors.length >= 6) {
      confidenceLevel = "high";
    } else if (anomalyFactors.length >= 3) {
      confidenceLevel = "medium";
    } else {
      confidenceLevel = "low";
    }

    let recommendation: "allow" | "step_up" | "block";
    if (trustScore >= 0.8) {
      recommendation = "allow";
    } else if (trustScore >= 0.5) {
      recommendation = "step_up";
    } else {
      recommendation = "block";
    }

    return {
      overallScore: trustScore,
      anomalyFactors,
      isAnomaly,
      confidenceLevel,
      recommendation
    };
  }

  async computeDeviceRisk(userId: string, currentDeviceId: string): Promise<number> {
    const userDevices = await storage.getDeviceProfilesByUser(userId);
    const currentDevice = userDevices.find(d => d.id === currentDeviceId);
    
    if (!currentDevice) {
      return 0.3;
    }

    const seenCount = currentDevice.seenCount || 1;
    
    let familiarityScore = Math.min(1, seenCount / 10);
    
    const trustScore = currentDevice.trustScore || 0.5;
    
    const combinedScore = familiarityScore * 0.6 + trustScore * 0.4;
    
    return Math.min(1, Math.max(0, combinedScore));
  }

  async computeTLSRisk(currentFingerprint: string): Promise<number> {
    const fingerprints = await storage.getAllTlsFingerprints();
    const match = fingerprints.find(f => f.ja3Hash === currentFingerprint || f.ja4Hash === currentFingerprint);
    
    if (!match) {
      return 0.5;
    }

    const trustScore = match.trustScore || 0.5;
    return trustScore;
  }

  async computeOverallRiskScore(
    userId: string,
    deviceId: string | null,
    tlsFingerprint: string | null,
    currentBehavior: Partial<BehavioralPattern>
  ): Promise<{
    overallScore: number;
    deviceScore: number;
    tlsScore: number;
    behavioralScore: number;
    anomalyResult: AnomalyResult;
    recommendation: "allow" | "step_up" | "block";
  }> {
    const [behaviorResult, deviceScore, tlsScore] = await Promise.all([
      this.scoreCurrentBehavior(userId, currentBehavior),
      deviceId ? this.computeDeviceRisk(userId, deviceId) : Promise.resolve(0.5),
      tlsFingerprint ? this.computeTLSRisk(tlsFingerprint) : Promise.resolve(0.7)
    ]);

    const weights = { device: 0.35, tls: 0.25, behavioral: 0.40 };
    
    const overallScore = 
      deviceScore * weights.device +
      tlsScore * weights.tls +
      behaviorResult.overallScore * weights.behavioral;

    let recommendation: "allow" | "step_up" | "block";
    if (overallScore >= 0.75) {
      recommendation = "allow";
    } else if (overallScore >= 0.45) {
      recommendation = "step_up";
    } else {
      recommendation = "block";
    }

    return {
      overallScore,
      deviceScore,
      tlsScore,
      behavioralScore: behaviorResult.overallScore,
      anomalyResult: behaviorResult,
      recommendation
    };
  }
}

export const mlScoringEngine = new MLScoringEngine();
