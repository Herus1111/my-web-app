package de.fhdortmund.growdent.chat;

import de.fhdortmund.growdent.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/growdent/chats")
@CrossOrigin
public class ChatApiController {
    private final ChatService chatService;
    private final SimpMessagingTemplate broker;

    public ChatApiController(ChatService chatService, SimpMessagingTemplate broker) {
        this.chatService = chatService;
        this.broker = broker;
    }

    @PostMapping("/groups") @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse group(@RequestBody GroupRequest request) {
        return RoomResponse.from(chatService.createGroup(request.name(), request.creatorId(), request.memberIds()));
    }

    @PostMapping("/private") @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse privateChat(@RequestBody PrivateRequest request) {
        return RoomResponse.from(chatService.createPrivate(request.firstUserId(), request.secondUserId()));
    }

    @GetMapping
    public List<RoomResponse> rooms(@RequestParam Integer userId) {
        return chatService.roomsFor(userId).stream().map(RoomResponse::from).toList();
    }

    @GetMapping("/{roomId}/messages")
    public List<MessageResponse> history(@PathVariable Integer roomId) {
        return chatService.history(roomId).stream().map(MessageResponse::from).toList();
    }

    @PostMapping("/{roomId}/messages") @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse message(@PathVariable Integer roomId, @RequestBody MessageRequest request) {
        MessageResponse response = MessageResponse.from(chatService.saveMessage(request.senderId(), roomId, request.content()));
        broker.convertAndSend("/topic/room/" + roomId, response);
        return response;
    }

    // Upload an image file and create a message containing the public URL to the image.
    @PostMapping("/{roomId}/messages/upload") @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse upload(@PathVariable Integer roomId,
                                  @RequestParam Integer senderId,
                                  @RequestParam MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("file is required");

        String uploadDir = "uploads"; // relative to application working dir
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }

        String filename = UUID.randomUUID().toString() + ext;
        Path target = Path.of(dir.getAbsolutePath(), filename);
        try (var in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        String publicUrl = "/uploads/" + filename;

        MessageResponse response = MessageResponse.from(chatService.saveMessage(senderId, roomId, publicUrl));
        broker.convertAndSend("/topic/room/" + roomId, response);
        return response;
    }

    @ExceptionHandler(IllegalArgumentException.class) @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> invalid(IllegalArgumentException exception) { return Map.of("error", exception.getMessage()); }

    public record GroupRequest(String name, Integer creatorId, List<Integer> memberIds) { }
    public record PrivateRequest(Integer firstUserId, Integer secondUserId) { }
    public record MessageRequest(Integer senderId, String content) { }
    public record MemberResponse(Integer id, String firstName, String lastName) {
        static MemberResponse from(User user) { return new MemberResponse(user.getId(), user.getFirstName(), user.getLastName()); }
    }
    public record RoomResponse(Integer id, String name, ChatRoomType type, List<MemberResponse> members) {
        static RoomResponse from(ChatRoom room) {
            return new RoomResponse(room.getChat_roomid(), room.getName(), room.getType(),
                    room.getMembers().stream().map(MemberResponse::from).toList());
        }
    }
    public record MessageResponse(Integer id, String content, Integer senderId, String senderName, LocalDateTime timestamp) {
        static MessageResponse from(ChatMessage message) {
            User sender = message.getSender();
            return new MessageResponse(message.getId(), message.getContent(), sender.getId(),
                    (sender.getFirstName() + " " + sender.getLastName()).trim(), message.getTimestamp());
        }
    }
}
