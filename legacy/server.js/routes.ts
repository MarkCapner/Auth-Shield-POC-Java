import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { mlScoringEngine } from "./ml-scoring";
import {
  insertUserSchema,
  insertDeviceProfileSchema,
  insertTlsFingerprintSchema,
  insertBehavioralPatternSchema,
  insertAuthenticationEventSchema,
  insertRiskScoreSchema,
  insertAnomalyAlertSchema,
  insertGeolocationSchema,
  insertAdminSettingSchema,
  insertAbExperimentSchema,
  insertAuditLogSchema,
  insertFlaggedSessionSchema,
  type LiveActivityItem,
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

// Track connected WebSocket clients
const wsClients = new Set<WebSocket>();

// Broadcast to all connected clients
function broadcast(data: any) {
  const message = JSON.stringify(data);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Broadcast activity to dashboard
function broadcastActivity(activity: LiveActivityItem) {
  broadcast({ type: "activity", activity });
}

// Calculate risk score from multiple signals
function calculateRiskScore(
  deviceScore: number,
  tlsScore: number,
  behavioralScore: number,
  weights = { device: 0.4, tls: 0.3, behavioral: 0.3 }
): {
  overallScore: number;
  confidenceLevel: "high" | "medium" | "low";
} {
  const overallScore =
    deviceScore * weights.device +
    tlsScore * weights.tls +
    behavioralScore * weights.behavioral;

  let confidenceLevel: "high" | "medium" | "low";
  if (overallScore >= 0.7) {
    confidenceLevel = "high";
  } else if (overallScore >= 0.4) {
    confidenceLevel = "medium";
  } else {
    confidenceLevel = "low";
  }

  return { overallScore, confidenceLevel };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication (login/register/logout/user endpoints)
  setupAuth(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    wsClients.add(ws);
    console.log("WebSocket client connected");

    ws.on("close", () => {
      wsClients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      wsClients.delete(ws);
    });
  });

  // ============ Dashboard Routes ============

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/risk-factors", async (req, res) => {
    // Return mock risk factors for demo
    res.json({
      deviceFamiliarity: 0.85 + Math.random() * 0.1,
      tlsConsistency: 0.9 + Math.random() * 0.08,
      behavioralMatch: 0.7 + Math.random() * 0.2,
      locationRisk: 0.8 + Math.random() * 0.15,
      timeOfDayRisk: 0.85 + Math.random() * 0.1,
    });
  });

  app.get("/api/dashboard/timeline", async (req, res) => {
    try {
      const scores = await storage.getRecentRiskScores(24);
      const timeline = scores.map((score) => ({
        timestamp: score.createdAt,
        deviceScore: score.deviceScore,
        tlsScore: score.tlsScore,
        behavioralScore: score.behavioralScore,
        overallScore: score.overallScore,
      }));
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ error: "Failed to fetch timeline" });
    }
  });

  // ============ User Routes ============

  app.post("/api/users", async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(validated.username);
      if (existing) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(validated);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // ============ Device Profile Routes ============

  app.get("/api/devices", async (req, res) => {
    try {
      const devices = await storage.getAllDeviceProfiles();
      res.json(devices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  });

  app.get("/api/devices/:id", async (req, res) => {
    try {
      const device = await storage.getDeviceProfile(req.params.id);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      console.error("Error fetching device:", error);
      res.status(500).json({ error: "Failed to fetch device" });
    }
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const validated = insertDeviceProfileSchema.parse(req.body);
      
      // Link to logged-in user if authenticated
      const userId = req.isAuthenticated?.() ? (req.user as any)?.id : null;
      const deviceData = { ...validated, userId: userId || validated.userId };

      // Check if fingerprint already exists
      const existing = await storage.getDeviceProfileByFingerprint(deviceData.fingerprint);
      if (existing) {
        // Update existing profile, and link to user if newly authenticated
        const updates: any = {
          seenCount: (existing.seenCount || 0) + 1,
          trustScore: Math.min(1, (existing.trustScore || 0.5) + 0.02),
        };
        
        // Link device to user if user is authenticated and device wasn't linked before
        if (userId && !existing.userId) {
          updates.userId = userId;
        }
        
        const updated = await storage.updateDeviceProfile(existing.id, updates);

        broadcastActivity({
          id: randomUUID(),
          type: "device_seen",
          deviceFingerprint: deviceData.fingerprint,
          riskScore: updated?.trustScore ?? 0.5,
          confidenceLevel: updated?.trustScore && updated.trustScore >= 0.7 ? "high" : "medium",
          message: `Known device detected: ${deviceData.browser} on ${deviceData.os}`,
          timestamp: new Date(),
        });

        return res.json(updated);
      }

      // Create new profile
      const device = await storage.createDeviceProfile(deviceData);

      broadcastActivity({
        id: randomUUID(),
        type: "device_seen",
        deviceFingerprint: deviceData.fingerprint,
        riskScore: 0.5,
        confidenceLevel: "medium",
        message: `New device fingerprint detected: ${deviceData.browser} on ${deviceData.os}`,
        timestamp: new Date(),
      });

      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating device:", error);
      res.status(500).json({ error: "Failed to create device" });
    }
  });

  // ============ TLS Fingerprint Routes ============

  app.get("/api/tls-fingerprints", async (req, res) => {
    try {
      const fingerprints = await storage.getAllTlsFingerprints();
      res.json(fingerprints);
    } catch (error) {
      console.error("Error fetching TLS fingerprints:", error);
      res.status(500).json({ error: "Failed to fetch TLS fingerprints" });
    }
  });

  app.post("/api/tls-fingerprints", async (req, res) => {
    try {
      const validated = insertTlsFingerprintSchema.parse(req.body);

      // Check if JA3 hash already exists
      if (validated.ja3Hash) {
        const existing = await storage.getTlsFingerprintByJa3(validated.ja3Hash);
        if (existing) {
          const updated = await storage.updateTlsFingerprint(existing.id, {
            seenCount: (existing.seenCount || 0) + 1,
            trustScore: Math.min(1, (existing.trustScore || 0.5) + 0.03),
          });
          return res.json(updated);
        }
      }

      const fingerprint = await storage.createTlsFingerprint(validated);
      res.status(201).json(fingerprint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating TLS fingerprint:", error);
      res.status(500).json({ error: "Failed to create TLS fingerprint" });
    }
  });

  // ============ Behavioral Pattern Routes ============

  app.get("/api/behavioral-patterns", async (req, res) => {
    try {
      const { userId, sessionId } = req.query;
      let patterns: any[] = [];

      if (userId && typeof userId === "string") {
        patterns = await storage.getBehavioralPatternsByUser(userId);
      } else if (sessionId && typeof sessionId === "string") {
        patterns = await storage.getBehavioralPatternsBySession(sessionId);
      }

      res.json(patterns);
    } catch (error) {
      console.error("Error fetching behavioral patterns:", error);
      res.status(500).json({ error: "Failed to fetch behavioral patterns" });
    }
  });

  app.post("/api/behavioral-patterns", async (req, res) => {
    try {
      const validated = insertBehavioralPatternSchema.parse(req.body);
      
      // Link to logged-in user if authenticated
      const userId = req.isAuthenticated?.() ? (req.user as any)?.id : null;
      const patternData = { ...validated, userId: userId || validated.userId };
      
      const pattern = await storage.createBehavioralPattern(patternData);

      broadcastActivity({
        id: randomUUID(),
        type: "behavior_captured",
        userId: userId || undefined,
        riskScore: pattern.confidenceScore || 0.5,
        confidenceLevel: pattern.confidenceScore && pattern.confidenceScore >= 0.7 ? "high" : "medium",
        message: `Behavioral pattern captured: ${pattern.sampleCount || 0} ${pattern.patternType} events`,
        timestamp: new Date(),
      });

      res.status(201).json(pattern);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating behavioral pattern:", error);
      res.status(500).json({ error: "Failed to create behavioral pattern" });
    }
  });

  // ============ ML Scoring Routes ============

  app.post("/api/ml/score", async (req, res) => {
    try {
      const { userId, deviceId, tlsFingerprint, currentBehavior } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const result = await mlScoringEngine.computeOverallRiskScore(
        userId,
        deviceId || null,
        tlsFingerprint || null,
        currentBehavior || {}
      );

      res.json(result);
    } catch (error) {
      console.error("Error computing ML score:", error);
      res.status(500).json({ error: "Failed to compute ML score" });
    }
  });

  app.get("/api/ml/baseline/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const baseline = await mlScoringEngine.getUserBaseline(userId);
      
      if (!baseline) {
        return res.json({ 
          hasBaseline: false, 
          message: "Insufficient data for baseline (need at least 3 behavioral patterns)" 
        });
      }

      res.json({ hasBaseline: true, baseline });
    } catch (error) {
      console.error("Error fetching user baseline:", error);
      res.status(500).json({ error: "Failed to fetch user baseline" });
    }
  });

  app.post("/api/ml/anomaly-check", async (req, res) => {
    try {
      const { userId, currentBehavior } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const result = await mlScoringEngine.scoreCurrentBehavior(userId, currentBehavior || {});
      
      // Create anomaly alert if significant deviation detected
      if (result.isAnomaly) {
        await storage.createAnomalyAlert({
          userId,
          alertType: "behavioral",
          severity: result.overallScore < 0.3 ? "critical" : "high",
          description: `Behavioral anomaly detected: ${result.anomalyFactors.filter(f => f.isAnomaly).map(f => f.factor).join(", ")}`,
          riskScore: 1 - result.overallScore,
        });

        broadcastActivity({
          id: randomUUID(),
          type: "risk_calculated",
          userId,
          riskScore: 1 - result.overallScore,
          confidenceLevel: result.confidenceLevel,
          message: `Behavioral anomaly detected for user ${userId}`,
          timestamp: new Date(),
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error checking anomaly:", error);
      res.status(500).json({ error: "Failed to check anomaly" });
    }
  });

  // ============ Authentication Event Routes ============

  app.get("/api/auth-events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getRecentAuthenticationEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching auth events:", error);
      res.status(500).json({ error: "Failed to fetch auth events" });
    }
  });

  app.post("/api/auth-events", async (req, res) => {
    try {
      const validated = insertAuthenticationEventSchema.parse(req.body);
      const event = await storage.createAuthenticationEvent(validated);

      const confidenceLevel =
        event.overallRiskScore && event.overallRiskScore >= 0.7
          ? "high"
          : event.overallRiskScore && event.overallRiskScore >= 0.4
          ? "medium"
          : "low";

      broadcastActivity({
        id: randomUUID(),
        type: "auth_attempt",
        userId: event.userId || undefined,
        riskScore: event.overallRiskScore || undefined,
        confidenceLevel,
        message: `Authentication ${event.eventType}: ${event.decisionReason || "Risk assessment completed"}`,
        timestamp: new Date(),
      });

      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating auth event:", error);
      res.status(500).json({ error: "Failed to create auth event" });
    }
  });

  // ============ Risk Score Routes ============

  app.get("/api/risk-scores", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const scores = await storage.getRecentRiskScores(limit);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching risk scores:", error);
      res.status(500).json({ error: "Failed to fetch risk scores" });
    }
  });

  app.post("/api/risk-scores", async (req, res) => {
    try {
      const validated = insertRiskScoreSchema.parse(req.body);
      const score = await storage.createRiskScore(validated);

      const { confidenceLevel } = calculateRiskScore(
        score.deviceScore,
        score.tlsScore,
        score.behavioralScore
      );

      broadcastActivity({
        id: randomUUID(),
        type: "risk_calculated",
        userId: score.userId || undefined,
        riskScore: score.overallScore,
        confidenceLevel,
        message: `Risk score calculated: ${Math.round(score.overallScore * 100)}% confidence`,
        timestamp: new Date(),
      });

      // Broadcast confidence update for dashboard gauge
      broadcast({
        type: "confidence_update",
        score: score.overallScore,
        userId: score.userId,
      });

      res.status(201).json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating risk score:", error);
      res.status(500).json({ error: "Failed to create risk score" });
    }
  });

  // ============ Calculate Risk Endpoint ============

  app.post("/api/calculate-risk", async (req, res) => {
    try {
      const { deviceFingerprint, deviceScore, tlsScore, behavioralScore, userId, sessionId } = req.body;

      const weights = { device: 0.4, tls: 0.3, behavioral: 0.3 };
      const { overallScore, confidenceLevel } = calculateRiskScore(
        deviceScore || 0.5,
        tlsScore || 0.5,
        behavioralScore || 0.5,
        weights
      );

      const threshold = 0.7;
      const passed = overallScore >= threshold;

      // Store the risk score
      const score = await storage.createRiskScore({
        userId,
        sessionId,
        deviceScore: deviceScore || 0.5,
        tlsScore: tlsScore || 0.5,
        behavioralScore: behavioralScore || 0.5,
        overallScore,
        factors: {
          deviceFamiliarity: deviceScore || 0.5,
          tlsConsistency: tlsScore || 0.5,
          behavioralMatch: behavioralScore || 0.5,
          locationRisk: 0.8 + Math.random() * 0.15,
          timeOfDayRisk: 0.85 + Math.random() * 0.1,
        },
        threshold,
        passed,
      });

      // Broadcast to dashboard
      broadcast({
        type: "confidence_update",
        score: overallScore,
        userId,
      });

      broadcastActivity({
        id: randomUUID(),
        type: "risk_calculated",
        userId,
        deviceFingerprint,
        riskScore: overallScore,
        confidenceLevel,
        message: passed
          ? `Silent authentication approved (${Math.round(overallScore * 100)}% confidence)`
          : `Step-up required (${Math.round(overallScore * 100)}% confidence)`,
        timestamp: new Date(),
      });

      res.json({
        overallScore,
        confidenceLevel,
        passed,
        threshold,
        recommendation: passed ? "silent_auth" : "step_up",
        factors: score.factors,
      });
    } catch (error) {
      console.error("Error calculating risk:", error);
      res.status(500).json({ error: "Failed to calculate risk" });
    }
  });

  // ============ Session Routes ============

  app.post("/api/sessions", async (req, res) => {
    try {
      const { userId, deviceProfileId, confidenceScore } = req.body;
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const session = await storage.createSession({
        userId,
        deviceProfileId,
        token,
        confidenceScore: confidenceScore || 0,
        expiresAt,
        isActive: true,
      });

      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/validate", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ valid: false, error: "No token provided" });
      }

      const session = await storage.getSessionByToken(token);
      if (!session || !session.isActive || new Date(session.expiresAt) < new Date()) {
        return res.status(401).json({ valid: false, error: "Invalid or expired session" });
      }

      // Update last activity
      await storage.updateSession(session.id, { lastActivity: new Date() });

      res.json({
        valid: true,
        session: {
          id: session.id,
          userId: session.userId,
          confidenceScore: session.confidenceScore,
        },
      });
    } catch (error) {
      console.error("Error validating session:", error);
      res.status(500).json({ valid: false, error: "Failed to validate session" });
    }
  });

  // ============ Anomaly Detection Routes ============

  app.get("/api/anomaly-alerts", async (req, res) => {
    try {
      const { unresolved } = req.query;
      const alerts = unresolved === "true"
        ? await storage.getUnresolvedAnomalyAlerts()
        : await storage.getAnomalyAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching anomaly alerts:", error);
      res.status(500).json({ error: "Failed to fetch anomaly alerts" });
    }
  });

  app.post("/api/anomaly-alerts", async (req, res) => {
    try {
      const parsed = insertAnomalyAlertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const alert = await storage.createAnomalyAlert(parsed.data);
      
      broadcastActivity({
        id: randomUUID(),
        type: "risk_calculated",
        userId: alert.userId || undefined,
        riskScore: alert.riskScore || 0,
        confidenceLevel: alert.severity === "critical" ? "low" : alert.severity === "high" ? "low" : "medium",
        message: `Anomaly detected: ${alert.alertType} - ${alert.description}`,
        timestamp: new Date(),
      });

      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating anomaly alert:", error);
      res.status(500).json({ error: "Failed to create anomaly alert" });
    }
  });

  const resolveAlertSchema = z.object({
    resolution: z.string().min(1),
    resolvedBy: z.string().min(1),
  });

  app.patch("/api/anomaly-alerts/:id/resolve", async (req, res) => {
    try {
      const parsed = resolveAlertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const { resolution, resolvedBy } = parsed.data;
      const alert = await storage.resolveAnomalyAlert(req.params.id, resolution, resolvedBy);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error resolving anomaly alert:", error);
      res.status(500).json({ error: "Failed to resolve anomaly alert" });
    }
  });

  const impossibleTravelSchema = z.object({
    userId: z.string().min(1),
    ipAddress: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  });

  // Impossible travel detection endpoint
  app.post("/api/detect-impossible-travel", async (req, res) => {
    try {
      const parsed = impossibleTravelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const { userId, ipAddress, latitude, longitude, city, country } = parsed.data;
      
      // Get last known location for user
      const lastGeo = await storage.getLastGeolocation(userId);
      
      let impossibleTravel = false;
      let alert = null;
      
      if (lastGeo && lastGeo.latitude && lastGeo.longitude && latitude && longitude) {
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (latitude - lastGeo.latitude) * Math.PI / 180;
        const dLon = (longitude - lastGeo.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lastGeo.latitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Calculate time delta in hours
        const timeDelta = (Date.now() - new Date(lastGeo.createdAt).getTime()) / (1000 * 60 * 60);
        const requiredSpeed = distance / timeDelta;
        
        // If required speed > 1000 km/h, it's impossible travel
        if (requiredSpeed > 1000) {
          impossibleTravel = true;
          
          alert = await storage.createAnomalyAlert({
            userId,
            alertType: "impossible_travel",
            severity: requiredSpeed > 5000 ? "critical" : "high",
            description: `User appeared in ${city}, ${country} from ${lastGeo.city}, ${lastGeo.country} requiring ${Math.round(requiredSpeed)} km/h travel speed`,
            sourceIp: ipAddress,
            sourceLocation: { city, country, lat: latitude, lng: longitude },
            previousIp: lastGeo.ipAddress,
            previousLocation: { city: lastGeo.city, country: lastGeo.country, lat: lastGeo.latitude, lng: lastGeo.longitude },
            travelDistanceKm: distance,
            timeDeltaMinutes: timeDelta * 60,
            requiredSpeedKmh: requiredSpeed,
            riskScore: Math.min(1, requiredSpeed / 10000),
          });
          
          broadcastActivity({
            id: randomUUID(),
            type: "risk_calculated",
            userId,
            riskScore: alert.riskScore || 0.9,
            confidenceLevel: "low",
            message: `Impossible travel detected: ${Math.round(distance)}km in ${Math.round(timeDelta * 60)} minutes`,
            timestamp: new Date(),
          });
        }
      }
      
      // Record new geolocation
      const geo = await storage.createGeolocation({
        userId,
        ipAddress: ipAddress || "",
        latitude,
        longitude,
        city,
        country,
      });
      
      res.json({
        impossibleTravel,
        alert,
        geolocation: geo,
      });
    } catch (error) {
      console.error("Error detecting impossible travel:", error);
      res.status(500).json({ error: "Failed to detect impossible travel" });
    }
  });

  // ============ IP Reputation Routes ============

  app.get("/api/ip-reputation/:ip", async (req, res) => {
    try {
      const reputation = await storage.getIpReputation(req.params.ip);
      if (!reputation) {
        return res.json({ ipAddress: req.params.ip, reputationScore: 0.5, isNew: true });
      }
      res.json(reputation);
    } catch (error) {
      console.error("Error fetching IP reputation:", error);
      res.status(500).json({ error: "Failed to fetch IP reputation" });
    }
  });

  const ipReputationUpdateSchema = z.object({
    ipAddress: z.string().min(1),
    success: z.boolean().optional(),
    blocked: z.boolean().optional(),
  });

  app.post("/api/ip-reputation", async (req, res) => {
    try {
      const parsed = ipReputationUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const { ipAddress, success, blocked } = parsed.data;
      const existing = await storage.getIpReputation(ipAddress);
      
      const updates: any = {
        totalAttempts: (existing?.totalAttempts || 0) + 1,
      };
      
      if (success) updates.successfulAttempts = (existing?.successfulAttempts || 0) + 1;
      else updates.failedAttempts = (existing?.failedAttempts || 0) + 1;
      if (blocked) updates.blockedAttempts = (existing?.blockedAttempts || 0) + 1;
      
      // Calculate reputation score
      const total = updates.totalAttempts;
      const successful = updates.successfulAttempts || existing?.successfulAttempts || 0;
      updates.reputationScore = total > 0 ? successful / total : 0.5;
      
      const reputation = await storage.createOrUpdateIpReputation(ipAddress, updates);
      res.json(reputation);
    } catch (error) {
      console.error("Error updating IP reputation:", error);
      res.status(500).json({ error: "Failed to update IP reputation" });
    }
  });

  app.get("/api/ip-reputation/blacklist", async (req, res) => {
    try {
      const blacklisted = await storage.getBlacklistedIps();
      res.json(blacklisted);
    } catch (error) {
      console.error("Error fetching blacklisted IPs:", error);
      res.status(500).json({ error: "Failed to fetch blacklisted IPs" });
    }
  });

  // ============ Admin Settings Routes ============

  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ error: "Failed to fetch admin settings" });
    }
  });

  app.get("/api/admin/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getAdminSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching admin setting:", error);
      res.status(500).json({ error: "Failed to fetch admin setting" });
    }
  });

  const adminSettingUpdateSchema = z.object({
    value: z.any(),
    description: z.string().optional(),
    category: z.string().optional(),
  });

  app.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const parsed = adminSettingUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const { value, description, category } = parsed.data;
      const setting = await storage.upsertAdminSetting(req.params.key, value, description, category);
      
      // Create audit log
      await storage.createAuditLog({
        eventType: "threshold_change",
        actorType: "admin",
        targetId: setting.id,
        targetType: "setting",
        action: "update",
        newValue: { key: req.params.key, value },
      });
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating admin setting:", error);
      res.status(500).json({ error: "Failed to update admin setting" });
    }
  });

  // ============ A/B Experiment Routes ============

  app.get("/api/experiments", async (req, res) => {
    try {
      const { active } = req.query;
      const experiments = active === "true"
        ? await storage.getActiveAbExperiments()
        : await storage.getAllAbExperiments();
      res.json(experiments);
    } catch (error) {
      console.error("Error fetching experiments:", error);
      res.status(500).json({ error: "Failed to fetch experiments" });
    }
  });

  app.get("/api/experiments/:id", async (req, res) => {
    try {
      const experiment = await storage.getAbExperiment(req.params.id);
      if (!experiment) {
        return res.status(404).json({ error: "Experiment not found" });
      }
      res.json(experiment);
    } catch (error) {
      console.error("Error fetching experiment:", error);
      res.status(500).json({ error: "Failed to fetch experiment" });
    }
  });

  app.post("/api/experiments", async (req, res) => {
    try {
      const parsed = insertAbExperimentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const experiment = await storage.createAbExperiment(parsed.data);
      
      await storage.createAuditLog({
        eventType: "experiment_created",
        actorType: "admin",
        targetId: experiment.id,
        targetType: "experiment",
        action: "create",
        newValue: { name: experiment.name },
      });
      
      res.status(201).json(experiment);
    } catch (error) {
      console.error("Error creating experiment:", error);
      res.status(500).json({ error: "Failed to create experiment" });
    }
  });

  app.patch("/api/experiments/:id", async (req, res) => {
    try {
      const experiment = await storage.updateAbExperiment(req.params.id, req.body);
      if (!experiment) {
        return res.status(404).json({ error: "Experiment not found" });
      }
      res.json(experiment);
    } catch (error) {
      console.error("Error updating experiment:", error);
      res.status(500).json({ error: "Failed to update experiment" });
    }
  });

  // ============ Audit Log Routes ============

  app.get("/api/audit-logs", async (req, res) => {
    try {
      const { actorId, targetId, eventType, limit } = req.query;
      const logs = await storage.getAuditLogs(
        { actorId: actorId as string, targetId: targetId as string, eventType: eventType as string },
        limit ? parseInt(limit as string) : 100
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.post("/api/audit-logs", async (req, res) => {
    try {
      const parsed = insertAuditLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const log = await storage.createAuditLog(parsed.data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating audit log:", error);
      res.status(500).json({ error: "Failed to create audit log" });
    }
  });

  // ============ Flagged Sessions Routes ============

  app.get("/api/flagged-sessions", async (req, res) => {
    try {
      const { status } = req.query;
      const sessions = await storage.getFlaggedSessions(status as string);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching flagged sessions:", error);
      res.status(500).json({ error: "Failed to fetch flagged sessions" });
    }
  });

  app.post("/api/flagged-sessions", async (req, res) => {
    try {
      const parsed = insertFlaggedSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const session = await storage.createFlaggedSession(parsed.data);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating flagged session:", error);
      res.status(500).json({ error: "Failed to create flagged session" });
    }
  });

  const flaggedSessionUpdateSchema = z.object({
    status: z.enum(["pending", "resolved", "dismissed"]).optional(),
    resolution: z.string().optional(),
    reviewedBy: z.string().optional(),
    reviewedAt: z.coerce.date().optional(),
  });

  app.patch("/api/flagged-sessions/:id", async (req, res) => {
    try {
      const parsed = flaggedSessionUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const session = await storage.updateFlaggedSession(req.params.id, parsed.data);
      if (!session) {
        return res.status(404).json({ error: "Flagged session not found" });
      }
      
      if (parsed.data.status === "resolved" || parsed.data.status === "dismissed") {
        await storage.createAuditLog({
          eventType: "session_reviewed",
          actorId: parsed.data.reviewedBy,
          actorType: "admin",
          targetId: session.id,
          targetType: "session",
          action: parsed.data.status,
          newValue: { resolution: parsed.data.resolution },
        });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error updating flagged session:", error);
      res.status(500).json({ error: "Failed to update flagged session" });
    }
  });

  return httpServer;
}
