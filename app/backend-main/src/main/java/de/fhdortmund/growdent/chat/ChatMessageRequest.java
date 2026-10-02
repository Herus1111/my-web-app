package de.fhdortmund.growdent.chat;

// soll die Json daten abfangen und umwandeln
public class ChatMessageRequest {
    private Integer senderId;
    private Integer roomId;
    private String content;

    public ChatMessageRequest() {}

    public Integer getSenderId() { return senderId; }
    public void setSenderId(Integer senderId) {
        this.senderId = senderId;
    }

    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public String getContent() { return content; }
    public void setContent(String content) {
        this.content = content;
    }
}
