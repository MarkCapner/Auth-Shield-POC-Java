package com.authshield.server.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.TextMessage;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketHub {
  private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

  public void add(WebSocketSession s) { sessions.add(s); }

  public void remove(WebSocketSession s) { sessions.remove(s); }

  public void broadcastJson(String json) {
    for (WebSocketSession s : sessions) {
      if (!s.isOpen()) continue;
      try {
        s.sendMessage(new TextMessage(json));
      } catch (IOException ignored) {
      }
    }
  }
}
