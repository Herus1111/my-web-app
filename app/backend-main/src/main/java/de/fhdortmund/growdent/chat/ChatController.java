package de.fhdortmund.growdent.chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate; // zum suchen

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    // Wenn der Client an /app/chat.send sendet, landet die Nachricht hier
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request) {

        // Nachricht in der Datenbank speichern
        ChatMessage savedMessage = chatService.saveMessage(
                request.getSenderId(),
                request.getRoomId(),    
                request.getContent()
        );

        // richtigen Raum definieren
        String destination = "/topic/room/" + request.getRoomId();

        // Die fertige mit id und timestamp in den raum senden
        messagingTemplate.convertAndSend(destination, ChatApiController.MessageResponse.from(savedMessage));
    }
}
