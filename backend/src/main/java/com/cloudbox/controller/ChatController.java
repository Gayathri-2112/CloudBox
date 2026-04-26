package com.cloudbox.controller;

import com.cloudbox.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // Landing page — no auth required
    @PostMapping("/landing")
    public ResponseEntity<Map<String, String>> landingChat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("reply", "Please enter a message."));
        String reply = chatService.chatLanding(message);
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    // Dashboard — requires auth, uses real user data
    @PostMapping("/dashboard")
    public ResponseEntity<Map<String, String>> dashboardChat(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("reply", "Please enter a message."));
        String reply = chatService.chatDashboard(message, auth.getName());
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    // Admin dashboard — requires ADMIN role, uses platform-wide stats
    @PostMapping("/admin")
    public ResponseEntity<Map<String, String>> adminChat(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("reply", "Please enter a message."));
        String reply = chatService.chatAdmin(message);
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
