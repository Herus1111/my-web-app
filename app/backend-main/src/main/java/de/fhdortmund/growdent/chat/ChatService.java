package de.fhdortmund.growdent.chat;

import de.fhdortmund.growdent.users.User;
import de.fhdortmund.growdent.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class ChatService {
    private final ChatMessageRepository messageRepository;
    private final ChatRoomRepository roomRepository;
    private final UserRepository userRepository;

    public ChatService(ChatMessageRepository messageRepository, ChatRoomRepository roomRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatRoom createGroup(String name, Integer creatorId, List<Integer> memberIds) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Ein Gruppenname ist erforderlich");
        Set<Integer> ids = new LinkedHashSet<>();
        ids.add(required(creatorId, "creatorId"));
        if (memberIds != null) memberIds.forEach(id -> ids.add(required(id, "memberId")));
        if (ids.size() < 2) throw new IllegalArgumentException("Eine Gruppe braucht mindestens zwei Teilnehmer");
        return roomRepository.save(new ChatRoom(name.trim(), ChatRoomType.GROUP, loadUsers(ids)));
    }

    @Transactional
    public ChatRoom createPrivate(Integer firstId, Integer secondId) {
        firstId = required(firstId, "firstUserId");
        secondId = required(secondId, "secondUserId");
        if (firstId.equals(secondId)) throw new IllegalArgumentException("Ein Privatchat benötigt zwei unterschiedliche Nutzer");
        Integer otherId = secondId;
        Integer userId = firstId;
        return roomRepository.findDistinctByTypeAndMembersId(ChatRoomType.PRIVATE, firstId).stream()
                .filter(room -> room.getMembers().size() == 2)
                .filter(room -> room.getMembers().stream().anyMatch(user -> otherId.equals(user.getId())))
                .findFirst()
                .orElseGet(() -> roomRepository.save(new ChatRoom("Privatchat", ChatRoomType.PRIVATE,
                        loadUsers(List.of(userId, otherId)))));
    }

    @Transactional
    public ChatMessage saveMessage(Integer senderId, Integer roomId, String content) {
        if (content == null || content.isBlank()) throw new IllegalArgumentException("Eine Nachricht darf nicht leer sein");
        if (content.length() > 2000) throw new IllegalArgumentException("Eine Nachricht darf höchstens 2000 Zeichen enthalten");
        User sender = userRepository.findById(required(senderId, "senderId"))
                .orElseThrow(() -> new IllegalArgumentException("Sender nicht gefunden"));
        ChatRoom room = getRoom(roomId);
        if (room.getMembers().stream().noneMatch(member -> sender.getId().equals(member.getId()))) {
            throw new IllegalArgumentException("Der Sender ist kein Mitglied dieses Chats");
        }
        return messageRepository.save(new ChatMessage(content.trim(), sender, room));
    }

    @Transactional(readOnly = true)
    public List<ChatRoom> roomsFor(Integer userId) { return roomRepository.findDistinctByMembersId(required(userId, "userId")); }

    @Transactional(readOnly = true)
    public List<ChatMessage> history(Integer roomId) {
        getRoom(roomId);
        return messageRepository.findByChatRoomIdOrderByTimestampAsc(roomId);
    }

    @Transactional(readOnly = true)
    public ChatRoom getRoom(Integer roomId) {
        return roomRepository.findById(required(roomId, "roomId"))
                .orElseThrow(() -> new IllegalArgumentException("Chat nicht gefunden"));
    }

    private List<User> loadUsers(Iterable<Integer> ids) {
        List<User> users = new ArrayList<>();
        for (Integer id : ids) users.add(userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nutzer mit ID " + id + " nicht gefunden")));
        return users;
    }

    private Integer required(Integer value, String field) {
        if (value == null) throw new IllegalArgumentException(field + " ist erforderlich");
        return value;
    }
}
