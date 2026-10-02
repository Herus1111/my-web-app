package de.fhdortmund.growdent.events.invitations;

import de.fhdortmund.growdent.eventgraph.TreeManagerFacade;
import de.fhdortmund.growdent.events.Event;
import de.fhdortmund.growdent.events.EventService;
import de.fhdortmund.growdent.events.MiniEvent;
import de.fhdortmund.growdent.users.User;
import de.fhdortmund.growdent.users.UserService;
import de.fhdortmund.growdent.users.friendship.FriendshipService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventInvitationService {
    private final EventInvitationRepository invitationRepository;
    private final EventService eventService;
    private final UserService userService;
    private final FriendshipService friendshipService;
    private final TreeManagerFacade treeManagerFacade;

    public EventInvitationService(EventInvitationRepository invitationRepository,
                                  EventService eventService,
                                  UserService userService,
                                  FriendshipService friendshipService,
                                  TreeManagerFacade treeManagerFacade) {
        this.invitationRepository = invitationRepository;
        this.eventService = eventService;
        this.userService = userService;
        this.friendshipService = friendshipService;
        this.treeManagerFacade = treeManagerFacade;
    }

    /*
    Lädt einen Freund zu einem Event ein. Prüft dabei alle Vorbedingungen:
    - Event und beide Studenten existieren
    - man lädt nicht sich selbst ein
    - die beiden sind tatsächlich befreundet (nur Freunde dürfen eingeladen werden)
    - der Freund nimmt nicht bereits teil
    - es existiert noch keine Einladung zu diesem Event für diesen Freund
    - bei einem Mini-Event ist der Freund nicht selbst der Veranstalter
     */
    public EventInvitation invite(Integer eventId, Integer inviterId, Integer inviteeId) {
        if (inviterId.equals(inviteeId)) {
            throw new IllegalStateException("Man kann sich nicht selbst einladen");
        }

        Event event = eventService.getEventById(eventId); //wirft IllegalStateException wenn nicht vorhanden
        userService.getUserById(inviterId);
        User invitee = userService.getUserById(inviteeId);

        if (!friendshipService.areFriends(inviterId, inviteeId)) {
            throw new IllegalStateException("Es können nur Freunde zu Events eingeladen werden");
        }

        if (event instanceof MiniEvent && isOrganizerOf(event, invitee)) {
            throw new IllegalStateException("Der Veranstalter des Mini-Events kann nicht eingeladen werden");
        }

        if (event.getParticipantIDs().contains(inviteeId)) {
            throw new IllegalStateException("Der eingeladene Student nimmt bereits an diesem Event teil");
        }

        if (invitationRepository.findByEventIdAndInviteeId(eventId, inviteeId).isPresent()) {
            throw new IllegalStateException("Für diesen Freund existiert bereits eine Einladung zu diesem Event");
        }

        EventInvitation saved = invitationRepository.save(new EventInvitation(eventId, inviterId, inviteeId, "PENDING"));

        //Event soll auch im Baum des Eingeladenen auftauchen
        try {
            treeManagerFacade.addInvitation(inviteeId, eventId);
        } catch (Exception ignored) { //Einladung steht trotzdem, auch wenn der Baum nicht will
        }

        return saved;
    }

    //Alle Einladungen die ein Student erhalten hat
    public List<EventInvitation> getInvitationsForInvitee(Integer inviteeId) {
        return invitationRepository.findByInviteeId(inviteeId);
    }

    //Alle Einladungen zu einem Event (z.B. damit das Event im Event Graph auftaucht)
    public List<EventInvitation> getInvitationsForEvent(Integer eventId) {
        return invitationRepository.findByEventId(eventId);
    }

    /*
    Einladung annehmen: Status auf ACCEPTED setzen und den Studenten als Teilnehmer zum Event hinzufügen.
    Gibt false zurück, wenn das Event z.B. keine freien Plätze mehr hat.
     */
    public boolean acceptInvitation(Integer invitationId) {
        EventInvitation invitation = getInvitationById(invitationId);
        boolean added = eventService.addUser(invitation.getInviteeId(), invitation.getEventId());
        if (added) {
            invitation.setStatus("ACCEPTED");
            invitationRepository.save(invitation);
        }
        return added;
    }

    //Einladung ablehnen: wird gelöscht, damit später ggf. erneut eingeladen werden kann
    public void declineInvitation(Integer invitationId) {
        EventInvitation invitation = getInvitationById(invitationId);
        try {
            treeManagerFacade.removeInvitation(invitation.getInviteeId(), invitation.getEventId()); //Node muss auch weg
        } catch (Exception ignored) {
        }
        invitationRepository.deleteById(invitation.getId());
    }

    //Im organizer steht der Anzeigename des Erstellers, nicht seine id
    private boolean isOrganizerOf(Event event, User user) {
        return event.getOrganizer() != null && event.getOrganizer().equals(displayName(user));
    }

    private String displayName(User user) {
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        return user.getFirstName();
    }

    private EventInvitation getInvitationById(Integer invitationId) {
        return invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalStateException("Einladung nicht gefunden"));
    }
}
