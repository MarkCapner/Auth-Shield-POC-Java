package com.authshield.server.dto.ml;

public class AnomalyFactor {
  public String factor;
  public double currentValue;
  public double expectedValue;
  public double deviation;
  public boolean isAnomaly;

  public AnomalyFactor() {}
  public AnomalyFactor(String factor, double currentValue, double expectedValue, double deviation, boolean isAnomaly) {
    this.factor = factor;
    this.currentValue = currentValue;
    this.expectedValue = expectedValue;
    this.deviation = deviation;
    this.isAnomaly = isAnomaly;
  }
}
