package de.fhdortmund.growdent.events.invitations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventInvitationRepository extends JpaRepository<EventInvitation, Integer> {
    //Alle Einladungen die ein Student erhalten hat (z.B. um sie ihm anzuzeigen)
    List<EventInvitation> findByInviteeId(Integer inviteeId);

    //Alle Einladungen zu einem bestimmten Event (z.B. für den Event Graph)
    List<EventInvitation> findByEventId(Integer eventId);

    //Prüft ob zu einem Event bereits eine Einladung für diesen Freund existiert (gegen Doppel-Einladungen)
    Optional<EventInvitation> findByEventIdAndInviteeId(Integer eventId, Integer inviteeId);
}
