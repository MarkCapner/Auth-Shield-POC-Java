package com.authshield.server.controller;

import com.authshield.server.dto.common.IdResponse;
import com.authshield.server.model.TlsFingerprint;
import com.authshield.server.repo.TlsFingerprintRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tls-fingerprints")
public class TlsFingerprintsController {

  private final TlsFingerprintRepository repo;

  public TlsFingerprintsController(TlsFingerprintRepository repo) {
    this.repo = repo;
  }

  @GetMapping
  public List<TlsFingerprint> list() { return repo.findAll(); }

  @PostMapping
  public IdResponse create(@RequestBody TlsFingerprint body) {
    TlsFingerprint saved = repo.save(body);
    return new IdResponse(saved.getId());
  }
}
