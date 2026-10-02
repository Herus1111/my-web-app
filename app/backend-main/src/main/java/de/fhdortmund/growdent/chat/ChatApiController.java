package de.fhdortmund.growdent.chat;

import de.fhdortmund.growdent.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

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
