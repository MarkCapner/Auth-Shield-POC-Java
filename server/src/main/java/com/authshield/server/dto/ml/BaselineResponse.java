package com.authshield.server.dto.ml;

public class BaselineResponse {
  public boolean hasBaseline;
  public String message;
  public BaselineProfile baseline;

  public BaselineResponse() {}

  public static BaselineResponse insufficient() {
    BaselineResponse r = new BaselineResponse();
    r.hasBaseline = false;
    r.message = "Insufficient data for baseline (need at least 3 behavioral patterns)";
    return r;
  }

  public static BaselineResponse ok(BaselineProfile profile) {
    BaselineResponse r = new BaselineResponse();
    r.hasBaseline = true;
    r.baseline = profile;
    return r;
  }
}
