package com.authshield.server.service;

import com.authshield.server.repo.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

  private final JdbcTemplate jdbc;

  public DashboardService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Map<String,Object> stats() {
    Map<String,Object> out = new HashMap<>();
    out.put("users", jdbc.queryForObject("select count(*) from users", Long.class));
    out.put("devices", jdbc.queryForObject("select count(*) from device_profiles", Long.class));
    out.put("sessions", jdbc.queryForObject("select count(*) from sessions", Long.class));
    out.put("anomalies", jdbc.queryForObject("select count(*) from anomaly_alerts", Long.class));
    out.put("authEvents", jdbc.queryForObject("select count(*) from authentication_events", Long.class));
    return out;
  }

  public List<Map<String,Object>> timeline() {
    // last 50 auth events
    return jdbc.queryForList("""
      select created_at, event_type, user_id, session_id, overall_risk_score, confidence_level, success
      from authentication_events
      order by created_at desc
      limit 50
    """);
  }

  public Map<String,Object> riskFactors() {
    // a very small rollup; UI can render as-is
    Map<String,Object> out = new HashMap<>();
    Double avg = jdbc.queryForObject("select coalesce(avg(overall_score),0) from risk_scores", Double.class);
    out.put("avgOverallScore", avg);
    out.put("highRiskSessions", jdbc.queryForObject("select count(*) from risk_scores where overall_score >= 0.7", Long.class));
    out.put("medRiskSessions", jdbc.queryForObject("select count(*) from risk_scores where overall_score >= 0.4 and overall_score < 0.7", Long.class));
    out.put("lowRiskSessions", jdbc.queryForObject("select count(*) from risk_scores where overall_score < 0.4", Long.class));
    return out;
  }
}
