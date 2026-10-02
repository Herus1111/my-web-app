package de.fhdortmund.growdent.chat;

import de.fhdortmund.growdent.users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String content;

    // viele nachrichten gehören zu einem user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    // viele nachrichten in einem chatroom
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_roomid", nullable = false)
    private ChatRoom chatRoom;

    private LocalDateTime timestamp;

    public ChatMessage(){}

    public ChatMessage(String content, User sender, ChatRoom chatRoom) {
        this.content = content;
        this.sender = sender;
        this.chatRoom = chatRoom;
        this.timestamp = LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public ChatRoom getChatRoom() {
        return chatRoom;
    }

    public void setChatRoom(ChatRoom chatRoom) {
        this.chatRoom = chatRoom;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
