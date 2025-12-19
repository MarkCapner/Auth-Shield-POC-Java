package com.authshield.server.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class WsHandler extends TextWebSocketHandler {

  private final WebSocketHub hub;

  public WsHandler(WebSocketHub hub) {
    this.hub = hub;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    hub.add(session);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    hub.remove(session);
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) {
    // Client does not need to send messages for this PoC, but we accept pings.
  }
}
