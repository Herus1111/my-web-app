package de.fhdortmund.growdent.chat;

import org.springframework.data.jpa.repository.JpaRepository;
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Integer> {
    java.util.List<ChatRoom> findDistinctByMembersId(Integer userId);
    java.util.List<ChatRoom> findDistinctByTypeAndMembersId(ChatRoomType type, Integer userId);
}