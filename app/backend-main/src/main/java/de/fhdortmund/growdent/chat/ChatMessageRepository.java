package de.fhdortmund.growdent.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    // listet alle Nachrichten auf anhand an ihrer RaumID, sortiert nach Datum
    @Query("select message from ChatMessage message where message.chatRoom.chat_roomid = :roomId order by message.timestamp asc")
    List<ChatMessage> findByChatRoomIdOrderByTimestampAsc(@Param("roomId") Integer roomId);
}
