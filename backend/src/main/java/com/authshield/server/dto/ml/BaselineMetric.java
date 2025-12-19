package com.authshield.server.dto.ml;

public class BaselineMetric {
  public double mean;
  public double stdDev;

  public BaselineMetric() {}
  public BaselineMetric(double mean, double stdDev) {
    this.mean = mean;
    this.stdDev = stdDev;
  }
}
