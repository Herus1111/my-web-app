package de.fhdortmund.growdent.events.invitations;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("growdent/events/invitations")
@CrossOrigin
public class EventInvitationController {
    private final EventInvitationService invitationService;

    public EventInvitationController(EventInvitationService invitationService) {
        this.invitationService = invitationService;
    }

    /*
     POST /growdent/events/invitations/invite?eventId=1&inviterId=1&inviteeId=2
     Student (inviterId) lädt einen Freund (inviteeId) zum Event (eventId) ein.
     */
    @PostMapping("/invite")
    public ResponseEntity<String> invite(@RequestParam Integer eventId,
                                         @RequestParam Integer inviterId,
                                         @RequestParam Integer inviteeId) {
        try {
            invitationService.invite(eventId, inviterId, inviteeId);
            return ResponseEntity.ok("Einladung verschickt");
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Fehler: " + ex.getMessage());
        }
    }

    //Gibt alle Einladungen zurück die ein Student erhalten hat
    @GetMapping("/received/{inviteeId}")
    public List<EventInvitation> getReceivedInvitations(@PathVariable Integer inviteeId) {
        return invitationService.getInvitationsForInvitee(inviteeId);
    }

    //Gibt alle Einladungen zu einem Event zurück (z.B. für den Event Graph)
    @GetMapping("/event/{eventId}")
    public List<EventInvitation> getEventInvitations(@PathVariable Integer eventId) {
        return invitationService.getInvitationsForEvent(eventId);
    }

    /*
     PUT /growdent/events/invitations/accept?invitationId=1
     Einladung annehmen -> Student wird Teilnehmer des Events.
     */
    @PutMapping("/accept")
    public ResponseEntity<String> accept(@RequestParam Integer invitationId) {
        try {
            boolean accepted = invitationService.acceptInvitation(invitationId);
            if (accepted) {
                return ResponseEntity.ok("Einladung angenommen");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Fehler: Event hat keine freien Plätze mehr");
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Fehler: " + ex.getMessage());
        }
    }

    /*
     DELETE /growdent/events/invitations/decline?invitationId=1
     Einladung ablehnen (wird gelöscht).
     */
    @DeleteMapping("/decline")
    public ResponseEntity<String> decline(@RequestParam Integer invitationId) {
        try {
            invitationService.declineInvitation(invitationId);
            return ResponseEntity.ok("Einladung abgelehnt");
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Fehler: " + ex.getMessage());
        }
    }
}
