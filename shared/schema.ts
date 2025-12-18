import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for storing user identities with password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Device profiles - browser fingerprint and OS characteristics
export const deviceProfiles = pgTable("device_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fingerprint: text("fingerprint").notNull(),
  userAgent: text("user_agent").notNull(),
  browser: text("browser"),
  browserVersion: text("browser_version"),
  os: text("os"),
  osVersion: text("os_version"),
  deviceType: text("device_type"),
  screenWidth: integer("screen_width"),
  screenHeight: integer("screen_height"),
  colorDepth: integer("color_depth"),
  timezone: text("timezone"),
  language: text("language"),
  platform: text("platform"),
  hardwareConcurrency: integer("hardware_concurrency"),
  deviceMemory: real("device_memory"),
  touchSupport: boolean("touch_support"),
  webglVendor: text("webgl_vendor"),
  webglRenderer: text("webgl_renderer"),
  canvasFingerprint: text("canvas_fingerprint"),
  audioFingerprint: text("audio_fingerprint"),
  fonts: text("fonts").array(),
  plugins: text("plugins").array(),
  trustScore: real("trust_score").default(0.5),
  seenCount: integer("seen_count").default(1),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

// TLS fingerprints - JA3/JA4 style signatures
export const tlsFingerprints = pgTable("tls_fingerprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  deviceProfileId: varchar("device_profile_id").references(() => deviceProfiles.id),
  ja3Hash: text("ja3_hash"),
  ja3Full: text("ja3_full"),
  ja4Hash: text("ja4_hash"),
  ja4Full: text("ja4_full"),
  tlsVersion: text("tls_version"),
  cipherSuites: text("cipher_suites").array(),
  extensions: text("extensions").array(),
  supportedGroups: text("supported_groups").array(),
  signatureAlgorithms: text("signature_algorithms").array(),
  alpnProtocols: text("alpn_protocols").array(),
  trustScore: real("trust_score").default(0.5),
  seenCount: integer("seen_count").default(1),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

// Behavioral patterns - mouse movements, keystroke dynamics
export const behavioralPatterns = pgTable("behavioral_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  patternType: text("pattern_type").notNull(), // 'mouse' | 'keystroke' | 'scroll' | 'click'
  // Mouse movement metrics
  avgMouseSpeed: real("avg_mouse_speed"),
  mouseSpeedVariance: real("mouse_speed_variance"),
  avgMouseAcceleration: real("avg_mouse_acceleration"),
  straightLineRatio: real("straight_line_ratio"),
  curveComplexity: real("curve_complexity"),
  // Keystroke dynamics
  avgKeyHoldTime: real("avg_key_hold_time"),
  keyHoldVariance: real("key_hold_variance"),
  avgFlightTime: real("avg_flight_time"),
  flightTimeVariance: real("flight_time_variance"),
  typingSpeed: real("typing_speed"),
  errorRate: real("error_rate"),
  // General metrics
  sampleCount: integer("sample_count").default(0),
  rawData: jsonb("raw_data"),
  confidenceScore: real("confidence_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Authentication events - login attempts and their outcomes
export const authenticationEvents = pgTable("authentication_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  deviceProfileId: varchar("device_profile_id").references(() => deviceProfiles.id),
  tlsFingerprintId: varchar("tls_fingerprint_id").references(() => tlsFingerprints.id),
  sessionId: varchar("session_id"),
  eventType: text("event_type").notNull(), // 'silent_auth' | 'step_up' | 'failed' | 'success'
  ipAddress: text("ip_address"),
  // Risk scores at time of event
  deviceScore: real("device_score"),
  tlsScore: real("tls_score"),
  behavioralScore: real("behavioral_score"),
  overallRiskScore: real("overall_risk_score"),
  confidenceLevel: text("confidence_level"), // 'high' | 'medium' | 'low'
  // Decision details
  decisionReason: text("decision_reason"),
  stepUpMethod: text("step_up_method"), // 'otp' | 'biometric' | 'security_question'
  stepUpSuccess: boolean("step_up_success"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Risk scores - historical risk assessments
export const riskScores = pgTable("risk_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  deviceScore: real("device_score").notNull(),
  tlsScore: real("tls_score").notNull(),
  behavioralScore: real("behavioral_score").notNull(),
  overallScore: real("overall_score").notNull(),
  factors: jsonb("factors"), // detailed breakdown of contributing factors
  threshold: real("threshold").default(0.7),
  passed: boolean("passed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions - active user sessions
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  deviceProfileId: varchar("device_profile_id").references(() => deviceProfiles.id),
  token: text("token").notNull().unique(),
  confidenceScore: real("confidence_score").default(0),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  deviceProfiles: many(deviceProfiles),
  tlsFingerprints: many(tlsFingerprints),
  behavioralPatterns: many(behavioralPatterns),
  authenticationEvents: many(authenticationEvents),
  riskScores: many(riskScores),
  sessions: many(sessions),
}));

export const deviceProfilesRelations = relations(deviceProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [deviceProfiles.userId],
    references: [users.id],
  }),
  tlsFingerprints: many(tlsFingerprints),
  authenticationEvents: many(authenticationEvents),
  sessions: many(sessions),
}));

export const tlsFingerprintsRelations = relations(tlsFingerprints, ({ one, many }) => ({
  user: one(users, {
    fields: [tlsFingerprints.userId],
    references: [users.id],
  }),
  deviceProfile: one(deviceProfiles, {
    fields: [tlsFingerprints.deviceProfileId],
    references: [deviceProfiles.id],
  }),
  authenticationEvents: many(authenticationEvents),
}));

export const behavioralPatternsRelations = relations(behavioralPatterns, ({ one }) => ({
  user: one(users, {
    fields: [behavioralPatterns.userId],
    references: [users.id],
  }),
}));

export const authenticationEventsRelations = relations(authenticationEvents, ({ one }) => ({
  user: one(users, {
    fields: [authenticationEvents.userId],
    references: [users.id],
  }),
  deviceProfile: one(deviceProfiles, {
    fields: [authenticationEvents.deviceProfileId],
    references: [deviceProfiles.id],
  }),
  tlsFingerprint: one(tlsFingerprints, {
    fields: [authenticationEvents.tlsFingerprintId],
    references: [tlsFingerprints.id],
  }),
}));

export const riskScoresRelations = relations(riskScores, ({ one }) => ({
  user: one(users, {
    fields: [riskScores.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  deviceProfile: one(deviceProfiles, {
    fields: [sessions.deviceProfileId],
    references: [deviceProfiles.id],
  }),
}));

// Anomaly alerts - for detecting account takeover and impossible travel
export const anomalyAlerts = pgTable("anomaly_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  alertType: text("alert_type").notNull(), // 'impossible_travel' | 'account_takeover' | 'suspicious_device' | 'unusual_behavior'
  severity: text("severity").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'critical'
  description: text("description").notNull(),
  sourceIp: text("source_ip"),
  sourceLocation: jsonb("source_location"), // { country, city, lat, lng }
  previousIp: text("previous_ip"),
  previousLocation: jsonb("previous_location"),
  travelDistanceKm: real("travel_distance_km"),
  timeDeltaMinutes: real("time_delta_minutes"),
  requiredSpeedKmh: real("required_speed_kmh"), // Speed needed to travel between locations
  riskScore: real("risk_score"),
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"), // 'legitimate' | 'blocked' | 'investigated'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Geolocation records - for tracking user locations
export const geolocations = pgTable("geolocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  ipAddress: text("ip_address").notNull(),
  country: text("country"),
  countryCode: text("country_code"),
  region: text("region"),
  city: text("city"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  timezone: text("timezone"),
  isp: text("isp"),
  asn: text("asn"),
  isProxy: boolean("is_proxy").default(false),
  isVpn: boolean("is_vpn").default(false),
  isTor: boolean("is_tor").default(false),
  isDatacenter: boolean("is_datacenter").default(false),
  riskScore: real("risk_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// IP reputation - for tracking known bad IPs
export const ipReputations = pgTable("ip_reputations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address").notNull().unique(),
  reputationScore: real("reputation_score").default(0.5), // 0 = bad, 1 = good
  totalAttempts: integer("total_attempts").default(0),
  successfulAttempts: integer("successful_attempts").default(0),
  failedAttempts: integer("failed_attempts").default(0),
  blockedAttempts: integer("blocked_attempts").default(0),
  lastSeen: timestamp("last_seen").defaultNow(),
  isBlacklisted: boolean("is_blacklisted").default(false),
  blacklistReason: text("blacklist_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin settings - for configuring risk thresholds
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  description: text("description"),
  category: text("category").default("general"), // 'thresholds' | 'weights' | 'alerts' | 'general'
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// A/B test experiments - for testing risk scoring algorithms
export const abExperiments = pgTable("ab_experiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("draft"), // 'draft' | 'running' | 'paused' | 'completed'
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  controlConfig: jsonb("control_config").notNull(), // Control group settings
  variantConfig: jsonb("variant_config").notNull(), // Variant group settings
  trafficSplit: real("traffic_split").default(0.5), // % of traffic to variant
  primaryMetric: text("primary_metric").default("silent_auth_rate"),
  totalSamples: integer("total_samples").default(0),
  controlSamples: integer("control_samples").default(0),
  variantSamples: integer("variant_samples").default(0),
  controlSuccesses: integer("control_successes").default(0),
  variantSuccesses: integer("variant_successes").default(0),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit logs - for compliance and tracking all authentication decisions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // 'auth_attempt' | 'threshold_change' | 'user_blocked' | 'alert_resolved' | 'session_revoked'
  actorId: varchar("actor_id"), // User or admin who performed action
  actorType: text("actor_type").default("user"), // 'user' | 'admin' | 'system'
  targetId: varchar("target_id"), // Entity being acted upon
  targetType: text("target_type"), // 'user' | 'session' | 'device' | 'setting'
  action: text("action").notNull(), // 'create' | 'update' | 'delete' | 'authenticate' | 'block'
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  riskScore: real("risk_score"),
  decision: text("decision"), // 'approved' | 'denied' | 'step_up'
  decisionReason: text("decision_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Flagged sessions - sessions requiring admin review
export const flaggedSessions = pgTable("flagged_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id),
  userId: varchar("user_id").references(() => users.id),
  reason: text("reason").notNull(),
  severity: text("severity").default("medium"), // 'low' | 'medium' | 'high' | 'critical'
  riskScore: real("risk_score"),
  anomalyAlertId: varchar("anomaly_alert_id").references(() => anomalyAlerts.id),
  status: text("status").default("pending"), // 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  resolution: text("resolution"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDeviceProfileSchema = createInsertSchema(deviceProfiles).omit({ id: true, firstSeen: true, lastSeen: true });
export const insertTlsFingerprintSchema = createInsertSchema(tlsFingerprints).omit({ id: true, firstSeen: true, lastSeen: true });
export const insertBehavioralPatternSchema = createInsertSchema(behavioralPatterns).omit({ id: true, createdAt: true });
export const insertAuthenticationEventSchema = createInsertSchema(authenticationEvents).omit({ id: true, createdAt: true });
export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertAnomalyAlertSchema = createInsertSchema(anomalyAlerts).omit({ id: true, createdAt: true });
export const insertGeolocationSchema = createInsertSchema(geolocations).omit({ id: true, createdAt: true });
export const insertIpReputationSchema = createInsertSchema(ipReputations).omit({ id: true, createdAt: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAbExperimentSchema = createInsertSchema(abExperiments).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertFlaggedSessionSchema = createInsertSchema(flaggedSessions).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DeviceProfile = typeof deviceProfiles.$inferSelect;
export type InsertDeviceProfile = z.infer<typeof insertDeviceProfileSchema>;
export type TlsFingerprint = typeof tlsFingerprints.$inferSelect;
export type InsertTlsFingerprint = z.infer<typeof insertTlsFingerprintSchema>;
export type BehavioralPattern = typeof behavioralPatterns.$inferSelect;
export type InsertBehavioralPattern = z.infer<typeof insertBehavioralPatternSchema>;
export type AuthenticationEvent = typeof authenticationEvents.$inferSelect;
export type InsertAuthenticationEvent = z.infer<typeof insertAuthenticationEventSchema>;
export type RiskScore = typeof riskScores.$inferSelect;
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type AnomalyAlert = typeof anomalyAlerts.$inferSelect;
export type InsertAnomalyAlert = z.infer<typeof insertAnomalyAlertSchema>;
export type Geolocation = typeof geolocations.$inferSelect;
export type InsertGeolocation = z.infer<typeof insertGeolocationSchema>;
export type IpReputation = typeof ipReputations.$inferSelect;
export type InsertIpReputation = z.infer<typeof insertIpReputationSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AbExperiment = typeof abExperiments.$inferSelect;
export type InsertAbExperiment = z.infer<typeof insertAbExperimentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type FlaggedSession = typeof flaggedSessions.$inferSelect;
export type InsertFlaggedSession = z.infer<typeof insertFlaggedSessionSchema>;

// Frontend-specific types for real-time data
export type LiveActivityItem = {
  id: string;
  type: 'auth_attempt' | 'device_seen' | 'behavior_captured' | 'risk_calculated';
  userId?: string;
  username?: string;
  deviceFingerprint?: string;
  riskScore?: number;
  confidenceLevel?: 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
};

export type DashboardStats = {
  totalAuthentications: number;
  successRate: number;
  averageConfidence: number;
  activeDevices: number;
  silentAuthRate: number;
  stepUpRate: number;
};

export type RiskFactorBreakdown = {
  deviceFamiliarity: number;
  tlsConsistency: number;
  behavioralMatch: number;
  locationRisk: number;
  timeOfDayRisk: number;
};
