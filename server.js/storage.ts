import {
  type User,
  type InsertUser,
  type DeviceProfile,
  type InsertDeviceProfile,
  type TlsFingerprint,
  type InsertTlsFingerprint,
  type BehavioralPattern,
  type InsertBehavioralPattern,
  type AuthenticationEvent,
  type InsertAuthenticationEvent,
  type RiskScore,
  type InsertRiskScore,
  type Session,
  type InsertSession,
  type AnomalyAlert,
  type InsertAnomalyAlert,
  type Geolocation,
  type InsertGeolocation,
  type IpReputation,
  type InsertIpReputation,
  type AdminSetting,
  type InsertAdminSetting,
  type AbExperiment,
  type InsertAbExperiment,
  type AuditLog,
  type InsertAuditLog,
  type FlaggedSession,
  type InsertFlaggedSession,
  users,
  deviceProfiles,
  tlsFingerprints,
  behavioralPatterns,
  authenticationEvents,
  riskScores,
  sessions,
  anomalyAlerts,
  geolocations,
  ipReputations,
  adminSettings,
  abExperiments,
  auditLogs,
  flaggedSessions,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import expressSession from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Device Profiles
  getDeviceProfile(id: string): Promise<DeviceProfile | undefined>;
  getDeviceProfileByFingerprint(fingerprint: string): Promise<DeviceProfile | undefined>;
  getDeviceProfilesByUser(userId: string): Promise<DeviceProfile[]>;
  getAllDeviceProfiles(): Promise<DeviceProfile[]>;
  createDeviceProfile(profile: InsertDeviceProfile): Promise<DeviceProfile>;
  updateDeviceProfile(id: string, updates: Partial<DeviceProfile>): Promise<DeviceProfile | undefined>;

  // TLS Fingerprints
  getTlsFingerprint(id: string): Promise<TlsFingerprint | undefined>;
  getTlsFingerprintByJa3(ja3Hash: string): Promise<TlsFingerprint | undefined>;
  getAllTlsFingerprints(): Promise<TlsFingerprint[]>;
  createTlsFingerprint(fingerprint: InsertTlsFingerprint): Promise<TlsFingerprint>;
  updateTlsFingerprint(id: string, updates: Partial<TlsFingerprint>): Promise<TlsFingerprint | undefined>;

  // Behavioral Patterns
  getBehavioralPattern(id: string): Promise<BehavioralPattern | undefined>;
  getBehavioralPatternsByUser(userId: string): Promise<BehavioralPattern[]>;
  getBehavioralPatternsBySession(sessionId: string): Promise<BehavioralPattern[]>;
  createBehavioralPattern(pattern: InsertBehavioralPattern): Promise<BehavioralPattern>;

  // Authentication Events
  getAuthenticationEvent(id: string): Promise<AuthenticationEvent | undefined>;
  getAuthenticationEventsByUser(userId: string): Promise<AuthenticationEvent[]>;
  getRecentAuthenticationEvents(limit?: number): Promise<AuthenticationEvent[]>;
  createAuthenticationEvent(event: InsertAuthenticationEvent): Promise<AuthenticationEvent>;

  // Risk Scores
  getRiskScore(id: string): Promise<RiskScore | undefined>;
  getRiskScoresByUser(userId: string): Promise<RiskScore[]>;
  getRecentRiskScores(limit?: number): Promise<RiskScore[]>;
  createRiskScore(score: InsertRiskScore): Promise<RiskScore>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  getActiveSessionsByUser(userId: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  invalidateSession(id: string): Promise<void>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalAuthentications: number;
    successRate: number;
    averageConfidence: number;
    activeDevices: number;
    silentAuthRate: number;
    stepUpRate: number;
  }>;

  // Anomaly Alerts
  getAnomalyAlerts(limit?: number): Promise<AnomalyAlert[]>;
  getUnresolvedAnomalyAlerts(): Promise<AnomalyAlert[]>;
  createAnomalyAlert(alert: InsertAnomalyAlert): Promise<AnomalyAlert>;
  resolveAnomalyAlert(id: string, resolution: string, resolvedBy: string): Promise<AnomalyAlert | undefined>;

  // Geolocations
  getRecentGeolocations(userId: string, limit?: number): Promise<Geolocation[]>;
  createGeolocation(geo: InsertGeolocation): Promise<Geolocation>;
  getLastGeolocation(userId: string): Promise<Geolocation | undefined>;

  // IP Reputation
  getIpReputation(ipAddress: string): Promise<IpReputation | undefined>;
  createOrUpdateIpReputation(ipAddress: string, updates: Partial<InsertIpReputation>): Promise<IpReputation>;
  getBlacklistedIps(): Promise<IpReputation[]>;

  // Admin Settings
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  getAllAdminSettings(): Promise<AdminSetting[]>;
  upsertAdminSetting(key: string, value: any, description?: string, category?: string): Promise<AdminSetting>;

  // A/B Experiments
  getAbExperiment(id: string): Promise<AbExperiment | undefined>;
  getActiveAbExperiments(): Promise<AbExperiment[]>;
  getAllAbExperiments(): Promise<AbExperiment[]>;
  createAbExperiment(experiment: InsertAbExperiment): Promise<AbExperiment>;
  updateAbExperiment(id: string, updates: Partial<AbExperiment>): Promise<AbExperiment | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { actorId?: string; targetId?: string; eventType?: string }, limit?: number): Promise<AuditLog[]>;

  // Flagged Sessions
  getFlaggedSessions(status?: string): Promise<FlaggedSession[]>;
  createFlaggedSession(session: InsertFlaggedSession): Promise<FlaggedSession>;
  updateFlaggedSession(id: string, updates: Partial<FlaggedSession>): Promise<FlaggedSession | undefined>;

  // Session Store for authentication
  sessionStore: expressSession.Store;
}

const PostgresSessionStore = connectPg(expressSession);

export class DatabaseStorage implements IStorage {
  sessionStore: expressSession.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Device Profiles
  async getDeviceProfile(id: string): Promise<DeviceProfile | undefined> {
    const [profile] = await db.select().from(deviceProfiles).where(eq(deviceProfiles.id, id));
    return profile || undefined;
  }

  async getDeviceProfileByFingerprint(fingerprint: string): Promise<DeviceProfile | undefined> {
    const [profile] = await db.select().from(deviceProfiles).where(eq(deviceProfiles.fingerprint, fingerprint));
    return profile || undefined;
  }

  async getDeviceProfilesByUser(userId: string): Promise<DeviceProfile[]> {
    return db.select().from(deviceProfiles).where(eq(deviceProfiles.userId, userId));
  }

  async getAllDeviceProfiles(): Promise<DeviceProfile[]> {
    return db.select().from(deviceProfiles).orderBy(desc(deviceProfiles.lastSeen));
  }

  async createDeviceProfile(profile: InsertDeviceProfile): Promise<DeviceProfile> {
    const [created] = await db.insert(deviceProfiles).values(profile).returning();
    return created;
  }

  async updateDeviceProfile(id: string, updates: Partial<DeviceProfile>): Promise<DeviceProfile | undefined> {
    const [updated] = await db
      .update(deviceProfiles)
      .set({ ...updates, lastSeen: new Date() })
      .where(eq(deviceProfiles.id, id))
      .returning();
    return updated || undefined;
  }

  // TLS Fingerprints
  async getTlsFingerprint(id: string): Promise<TlsFingerprint | undefined> {
    const [fp] = await db.select().from(tlsFingerprints).where(eq(tlsFingerprints.id, id));
    return fp || undefined;
  }

  async getTlsFingerprintByJa3(ja3Hash: string): Promise<TlsFingerprint | undefined> {
    const [fp] = await db.select().from(tlsFingerprints).where(eq(tlsFingerprints.ja3Hash, ja3Hash));
    return fp || undefined;
  }

  async getAllTlsFingerprints(): Promise<TlsFingerprint[]> {
    return db.select().from(tlsFingerprints).orderBy(desc(tlsFingerprints.lastSeen));
  }

  async createTlsFingerprint(fingerprint: InsertTlsFingerprint): Promise<TlsFingerprint> {
    const [created] = await db.insert(tlsFingerprints).values(fingerprint).returning();
    return created;
  }

  async updateTlsFingerprint(id: string, updates: Partial<TlsFingerprint>): Promise<TlsFingerprint | undefined> {
    const [updated] = await db
      .update(tlsFingerprints)
      .set({ ...updates, lastSeen: new Date() })
      .where(eq(tlsFingerprints.id, id))
      .returning();
    return updated || undefined;
  }

  // Behavioral Patterns
  async getBehavioralPattern(id: string): Promise<BehavioralPattern | undefined> {
    const [pattern] = await db.select().from(behavioralPatterns).where(eq(behavioralPatterns.id, id));
    return pattern || undefined;
  }

  async getBehavioralPatternsByUser(userId: string): Promise<BehavioralPattern[]> {
    return db
      .select()
      .from(behavioralPatterns)
      .where(eq(behavioralPatterns.userId, userId))
      .orderBy(desc(behavioralPatterns.createdAt));
  }

  async getBehavioralPatternsBySession(sessionId: string): Promise<BehavioralPattern[]> {
    return db
      .select()
      .from(behavioralPatterns)
      .where(eq(behavioralPatterns.sessionId, sessionId))
      .orderBy(desc(behavioralPatterns.createdAt));
  }

  async createBehavioralPattern(pattern: InsertBehavioralPattern): Promise<BehavioralPattern> {
    const [created] = await db.insert(behavioralPatterns).values(pattern).returning();
    return created;
  }

  // Authentication Events
  async getAuthenticationEvent(id: string): Promise<AuthenticationEvent | undefined> {
    const [event] = await db.select().from(authenticationEvents).where(eq(authenticationEvents.id, id));
    return event || undefined;
  }

  async getAuthenticationEventsByUser(userId: string): Promise<AuthenticationEvent[]> {
    return db
      .select()
      .from(authenticationEvents)
      .where(eq(authenticationEvents.userId, userId))
      .orderBy(desc(authenticationEvents.createdAt));
  }

  async getRecentAuthenticationEvents(limit = 50): Promise<AuthenticationEvent[]> {
    return db
      .select()
      .from(authenticationEvents)
      .orderBy(desc(authenticationEvents.createdAt))
      .limit(limit);
  }

  async createAuthenticationEvent(event: InsertAuthenticationEvent): Promise<AuthenticationEvent> {
    const [created] = await db.insert(authenticationEvents).values(event).returning();
    return created;
  }

  // Risk Scores
  async getRiskScore(id: string): Promise<RiskScore | undefined> {
    const [score] = await db.select().from(riskScores).where(eq(riskScores.id, id));
    return score || undefined;
  }

  async getRiskScoresByUser(userId: string): Promise<RiskScore[]> {
    return db
      .select()
      .from(riskScores)
      .where(eq(riskScores.userId, userId))
      .orderBy(desc(riskScores.createdAt));
  }

  async getRecentRiskScores(limit = 100): Promise<RiskScore[]> {
    return db
      .select()
      .from(riskScores)
      .orderBy(desc(riskScores.createdAt))
      .limit(limit);
  }

  async createRiskScore(score: InsertRiskScore): Promise<RiskScore> {
    const [created] = await db.insert(riskScores).values(score).returning();
    return created;
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session || undefined;
  }

  async getActiveSessionsByUser(userId: string): Promise<Session[]> {
    return db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.isActive, true)));
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(sessions).values(session).returning();
    return created;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const [updated] = await db
      .update(sessions)
      .set({ ...updates, lastActivity: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return updated || undefined;
  }

  async invalidateSession(id: string): Promise<void> {
    await db.update(sessions).set({ isActive: false }).where(eq(sessions.id, id));
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalAuthentications: number;
    successRate: number;
    averageConfidence: number;
    activeDevices: number;
    silentAuthRate: number;
    stepUpRate: number;
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get auth events from last 24 hours
    const recentEvents = await db
      .select()
      .from(authenticationEvents)
      .where(gte(authenticationEvents.createdAt, last24Hours));

    const totalAuthentications = recentEvents.length;
    const successfulAuths = recentEvents.filter(
      (e) => e.eventType === "silent_auth" || e.eventType === "success"
    ).length;
    const silentAuths = recentEvents.filter((e) => e.eventType === "silent_auth").length;
    const stepUpAuths = recentEvents.filter((e) => e.eventType === "step_up").length;

    const successRate = totalAuthentications > 0 ? successfulAuths / totalAuthentications : 0;
    const silentAuthRate = totalAuthentications > 0 ? silentAuths / totalAuthentications : 0;
    const stepUpRate = totalAuthentications > 0 ? stepUpAuths / totalAuthentications : 0;

    // Calculate average confidence from risk scores
    const recentScores = await db
      .select()
      .from(riskScores)
      .where(gte(riskScores.createdAt, last24Hours));
    const avgConfidence =
      recentScores.length > 0
        ? recentScores.reduce((sum, s) => sum + s.overallScore, 0) / recentScores.length
        : 0.75;

    // Get active device count
    const activeDevicesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(deviceProfiles)
      .where(gte(deviceProfiles.lastSeen, last24Hours));
    const activeDevices = Number(activeDevicesResult[0]?.count || 0);

    return {
      totalAuthentications,
      successRate,
      averageConfidence: avgConfidence,
      activeDevices,
      silentAuthRate,
      stepUpRate,
    };
  }
  // ============ Anomaly Alerts ============
  async getAnomalyAlerts(limit = 50): Promise<AnomalyAlert[]> {
    return db.select().from(anomalyAlerts).orderBy(desc(anomalyAlerts.createdAt)).limit(limit);
  }

  async getUnresolvedAnomalyAlerts(): Promise<AnomalyAlert[]> {
    return db.select().from(anomalyAlerts).where(eq(anomalyAlerts.resolved, false)).orderBy(desc(anomalyAlerts.createdAt));
  }

  async createAnomalyAlert(alert: InsertAnomalyAlert): Promise<AnomalyAlert> {
    const [created] = await db.insert(anomalyAlerts).values(alert).returning();
    return created;
  }

  async resolveAnomalyAlert(id: string, resolution: string, resolvedBy: string): Promise<AnomalyAlert | undefined> {
    const [updated] = await db.update(anomalyAlerts)
      .set({ resolved: true, resolution, resolvedBy, resolvedAt: new Date() })
      .where(eq(anomalyAlerts.id, id))
      .returning();
    return updated || undefined;
  }

  // ============ Geolocations ============
  async getRecentGeolocations(userId: string, limit = 10): Promise<Geolocation[]> {
    return db.select().from(geolocations)
      .where(eq(geolocations.userId, userId))
      .orderBy(desc(geolocations.createdAt))
      .limit(limit);
  }

  async createGeolocation(geo: InsertGeolocation): Promise<Geolocation> {
    const [created] = await db.insert(geolocations).values(geo).returning();
    return created;
  }

  async getLastGeolocation(userId: string): Promise<Geolocation | undefined> {
    const [last] = await db.select().from(geolocations)
      .where(eq(geolocations.userId, userId))
      .orderBy(desc(geolocations.createdAt))
      .limit(1);
    return last || undefined;
  }

  // ============ IP Reputation ============
  async getIpReputation(ipAddress: string): Promise<IpReputation | undefined> {
    const [rep] = await db.select().from(ipReputations).where(eq(ipReputations.ipAddress, ipAddress));
    return rep || undefined;
  }

  async createOrUpdateIpReputation(ipAddress: string, updates: Partial<InsertIpReputation>): Promise<IpReputation> {
    const existing = await this.getIpReputation(ipAddress);
    if (existing) {
      const [updated] = await db.update(ipReputations)
        .set({ ...updates, lastSeen: new Date() })
        .where(eq(ipReputations.ipAddress, ipAddress))
        .returning();
      return updated;
    }
    const [created] = await db.insert(ipReputations)
      .values({ ipAddress, ...updates })
      .returning();
    return created;
  }

  async getBlacklistedIps(): Promise<IpReputation[]> {
    return db.select().from(ipReputations).where(eq(ipReputations.isBlacklisted, true));
  }

  // ============ Admin Settings ============
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, key));
    return setting || undefined;
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return db.select().from(adminSettings).orderBy(adminSettings.category, adminSettings.settingKey);
  }

  async upsertAdminSetting(key: string, value: any, description?: string, category?: string): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(key);
    if (existing) {
      const [updated] = await db.update(adminSettings)
        .set({ settingValue: value, updatedAt: new Date(), ...(description && { description }), ...(category && { category }) })
        .where(eq(adminSettings.settingKey, key))
        .returning();
      return updated;
    }
    const [created] = await db.insert(adminSettings)
      .values({ settingKey: key, settingValue: value, description, category })
      .returning();
    return created;
  }

  // ============ A/B Experiments ============
  async getAbExperiment(id: string): Promise<AbExperiment | undefined> {
    const [exp] = await db.select().from(abExperiments).where(eq(abExperiments.id, id));
    return exp || undefined;
  }

  async getActiveAbExperiments(): Promise<AbExperiment[]> {
    return db.select().from(abExperiments).where(eq(abExperiments.status, "running"));
  }

  async getAllAbExperiments(): Promise<AbExperiment[]> {
    return db.select().from(abExperiments).orderBy(desc(abExperiments.createdAt));
  }

  async createAbExperiment(experiment: InsertAbExperiment): Promise<AbExperiment> {
    const [created] = await db.insert(abExperiments).values(experiment).returning();
    return created;
  }

  async updateAbExperiment(id: string, updates: Partial<AbExperiment>): Promise<AbExperiment | undefined> {
    const [updated] = await db.update(abExperiments)
      .set(updates)
      .where(eq(abExperiments.id, id))
      .returning();
    return updated || undefined;
  }

  // ============ Audit Logs ============
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(filters?: { actorId?: string; targetId?: string; eventType?: string }, limit = 100): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    if (filters?.actorId) {
      query = query.where(eq(auditLogs.actorId, filters.actorId)) as typeof query;
    }
    if (filters?.targetId) {
      query = query.where(eq(auditLogs.targetId, filters.targetId)) as typeof query;
    }
    if (filters?.eventType) {
      query = query.where(eq(auditLogs.eventType, filters.eventType)) as typeof query;
    }
    
    return query.orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  // ============ Flagged Sessions ============
  async getFlaggedSessions(status?: string): Promise<FlaggedSession[]> {
    if (status) {
      return db.select().from(flaggedSessions)
        .where(eq(flaggedSessions.status, status))
        .orderBy(desc(flaggedSessions.createdAt));
    }
    return db.select().from(flaggedSessions).orderBy(desc(flaggedSessions.createdAt));
  }

  async createFlaggedSession(session: InsertFlaggedSession): Promise<FlaggedSession> {
    const [created] = await db.insert(flaggedSessions).values(session).returning();
    return created;
  }

  async updateFlaggedSession(id: string, updates: Partial<FlaggedSession>): Promise<FlaggedSession | undefined> {
    const [updated] = await db.update(flaggedSessions)
      .set(updates)
      .where(eq(flaggedSessions.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
