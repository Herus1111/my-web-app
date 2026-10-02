package de.fhdortmund.growdent.users.friendship;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class FriendshipService {
    private final FriendshipRepository friendshipRepository;

    public FriendshipService(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    public void sendRequest(Integer studentId, Integer friendId){
        if (findFriendship(studentId, friendId).isPresent()) {
            throw new IllegalStateException("Freundschafts(anfrage) existiert bereits");
        }
        friendshipRepository.save(new Friendship(studentId, friendId, "PENDING"));
        /*Wenn Student 1 mit Student 2 befreundet ist muss 2 auch mit 1 befreundet sein.
        Das doppelt zu speichern ist viel aufwand vorallem wenn man die Einträge dann ändern will.
        Es wird also nur einfach gespeichert dafür sind die Abfragen etwas komplizierter, da die id
        entweder in der StudentID oder in FriendID gefunden werden kann. Das muss man beachten.
        */
    }

    //Setzt den Status der Friendship auf Accepted wenn diese existiert
    public void acceptRequest(Integer studentId, Integer friendId) {
        Friendship friendship = findFriendship(studentId, friendId)
                .orElseThrow(() -> new IllegalStateException("Freundschaft nicht gefunden"));
        friendship.setStatus("ACCEPTED");
        friendshipRepository.save(friendship);
    }

    //Gibt alle Freundschaften eines studenten zurück egal ob er die Anfrage geschickt oder erhalten hat
    public List<Friendship> getFriendships(Integer studentId) {
        return friendshipRepository.findByStudentIdOrFriendId(studentId, studentId);
    }

    //Freundschaft ablehen: testen ob PENDING -> dann löschen
    public void declineFriendship(Integer studentId, Integer friendId) {
        Friendship friendship = findFriendship(studentId, friendId)
                .orElseThrow(() -> new IllegalStateException("Freundschaft nicht gefunden"));

        if (!friendship.getStatus().equals("PENDING")) {
            throw new IllegalStateException("Nur ausstehende Anfragen können abgelehnt werden");
        }

        friendshipRepository.deleteById(friendship.getId());
    }

    //Löscht eine Freundschaft
    public void deleteFriendship(Integer studentId, Integer friendId) {
        Friendship friendship = findFriendship(studentId, friendId)
                .orElseThrow(() -> new IllegalStateException("Freundschaft nicht gefunden"));
        friendshipRepository.deleteById(friendship.getId());
    }

    /*
    Hilfsmethode um eine eine Friendship zwischen zwei Studenten zu kriegen ohne beide Richtungen zu überprüfen
    Prüft beide Richtungen der IDs bei Freundschaft und gibt die zurück die existiert, wenn sie exisitert.
     */
    private Optional<Friendship> findFriendship(Integer studentId, Integer friendId) {
        Optional<Friendship> friendship = friendshipRepository.findByStudentIdAndFriendId(studentId, friendId);
        if (friendship.isPresent()) return friendship;
        return friendshipRepository.findByStudentIdAndFriendId(friendId, studentId);
    }

    /*
    Prüft ob zwei Studenten tatsächlich befreundet sind (Status ACCEPTED).
    Wird z.B. beim Einladen zu Events gebraucht, da man nur Freunde einladen darf.
     */
    public boolean areFriends(Integer studentId, Integer friendId) {
        return findFriendship(studentId, friendId)
                .filter(friendship -> "ACCEPTED".equals(friendship.getStatus()))
                .isPresent();
    }

    /*
    Gibt die FriendshipID von zwei Studeneten zurück
     */
    public Integer getFriendshipId(Integer studentId, Integer friendId) {
        return findFriendship(studentId, friendId)
                .orElseThrow(() -> new IllegalStateException("Freundschaft nicht gefunden")).getId();
    }
}