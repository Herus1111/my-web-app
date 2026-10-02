package de.fhdortmund.growdent.users.friendship;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Integer> {
    /*
    Gibt alle Freundschaften zurück in der der Student beteildigt ist. Da nur ein Eintrag pro
    Freundschaft gespeichert wird kann die ID entweder in StudentID oder friendID gefunden werden.
    Beispiel: findByStudentIdOrFriendId(2, 2) findet sowohl (student=2, friend=5)
     als auch (student=3, friend=2)
     */
    List<Friendship> findByStudentIdOrFriendId(Integer studentId, Integer friendId);
    /*
    prüft ob überhaupt ne Freundschaft existiert. Mit optional wird Nullpointer umgangen.
    Beim abfragen später muss man dann beide Richtungen überprüfen. also (studentID, friendID)
    und (friendId, studentId), da beides sein kann, weil wir nur einen Eintrag speichern.
     */
    Optional<Friendship> findByStudentIdAndFriendId(Integer studentId, Integer friendId);
}
