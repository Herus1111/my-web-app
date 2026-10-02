package de.fhdortmund.growdent.chat;

import de.fhdortmund.growdent.users.User;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer chat_roomid;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomType type;

    @ManyToMany
    @JoinTable(name = "chat_room_members",
            joinColumns = @JoinColumn(name = "chat_room_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private List<User> members = new ArrayList<>();

    public ChatRoom() { }

    public ChatRoom(String name, ChatRoomType type, List<User> members) {
        this.name = name;
        this.type = type;
        this.members = new ArrayList<>(members);
    }

    public Integer getChat_roomid() { return chat_roomid; }
    public String getName() { return name; }
    public ChatRoomType getType() { return type; }
    public List<User> getMembers() { return members; }
}
