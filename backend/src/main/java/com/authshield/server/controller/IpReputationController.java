package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.IpReputation;
import com.authshield.server.repo.IpReputationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ip-reputation")
public class IpReputationController {
  private final IpReputationRepository repo;
  public IpReputationController(IpReputationRepository repo) { this.repo = repo; }

  @GetMapping("/{ip}")
  public IpReputation get(@PathVariable String ip) {
    return repo.findByIpAddress(ip).orElseGet(() -> {
      IpReputation r = new IpReputation();
      r.setIpAddress(ip);
      return repo.save(r);
    });
  }

  @PostMapping
  public IdResponse upsert(@RequestBody IpReputation body) {
    IpReputation existing = repo.findByIpAddress(body.getIpAddress()).orElse(null);
    if (existing != null) {
      existing.setReputationScore(body.getReputationScore());
      existing.setBlacklisted(body.getBlacklisted());
      existing.setReason(body.getReason());
      body = repo.save(existing);
    } else {
      body = repo.save(body);
    }
    return new IdResponse(body.getId());
  }

  @GetMapping("/blacklist")
  public List<IpReputation> blacklist() {
    return repo.findByBlacklistedTrueOrderByLastUpdatedDesc();
  }
}
