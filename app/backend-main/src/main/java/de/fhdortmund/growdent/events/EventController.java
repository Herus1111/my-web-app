package de.fhdortmund.growdent.events;

import de.fhdortmund.growdent.users.User;
import de.fhdortmund.growdent.users.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/growdent/events")
@CrossOrigin
public class EventController {
    private final EventService eventService;
    private final UserService userService;

    public EventController(EventService eventService, UserService userService) {
        this.eventService = eventService;
        this.userService = userService;
    }

    @GetMapping
    public List<Event> getEvents() {
        return eventService.getAllEvents();
    }

    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Integer id) {
        return eventService.getEventById(id);
    }

    //Schickt das gespeicherte Event als JSON an React zurück, weil wir die Id brauchen um das Bild separat hochgeladen wird
    @PostMapping("/user/{creatorId}")
    public ResponseEntity<Event> addNewEvent(@PathVariable Integer creatorId, @RequestBody EventRequest req) {
        User creator = userService.getUserById(creatorId);
        Event saved = eventService.createEvent(creator, req);
        return ResponseEntity.ok(saved);
    }

    // Wichtig: @RequestParam("eventPicture") muss exakt so heißen wie das objekt welches im Frontend im zweiten Reqeust verschickt wird
    // ResponseEntity gibt dem Frontend gleich einen Statuscode ob alles geklappt hat
    @PostMapping("/{id}/picture")
    public ResponseEntity<String> uploadPicture(@PathVariable("id") int eventId,
                                                @RequestParam("eventPicture") MultipartFile data) {

        // Controller reicht die Arbeit an den Service weiter
        eventService.uploadPicture(eventId, data);

        return ResponseEntity.ok("Bild saved successfully!");
    }

    @GetMapping("/{id}/bild")
    public ResponseEntity<byte[]> downloadPicture(@PathVariable("id") int eventId) {

        byte[] bild = eventService.getEventPicture(eventId);

        return ResponseEntity.ok()
                // WICHTIG: Das sagt dem Browser "Hey, zeige das als Bild an!"
                .contentType(MediaType.IMAGE_JPEG)
                .body(bild);
    }

    @PostMapping("/{eventID}/addUser/{userID}")
    public ResponseEntity<String> addUser(@PathVariable("eventID") int eventId, @PathVariable("userID") int userID) {
        try { //prüfen ob ein Event existiert
            eventService.getEventById(eventId); // wirft einen Fehler in EventService, wenn es nicht gefunden wird
        } catch (IllegalStateException ex) {
            // Schickt einen 404 (Not Found) Status an das Frontend
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Fehler: Es existiert kein Event mit der ID " + eventId);
        }
        
        User u;

        try {
            u = userService.getUserById(userID);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Fehler: Es existiert kein User mit der ID " + userID);
        }

        boolean userAdded = eventService.addUser(userID, eventId);
        if (userAdded) {
            if (u.getType().equals("Student")) {
                userService.addAttendedEvent(userID, eventId);
            }
            return ResponseEntity.ok("User added succesfully");
        }else{
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Fehler: Event hat keine freien Plätze mehr oder UserID befindet sich schon in der Liste");
        }
    }

    @DeleteMapping("/{eventID}/removeUser/{userID}")
    public ResponseEntity<String> removeUser(@PathVariable("eventID") int eventId, @PathVariable("userID") int userID) {
        try { //prüfen ob ein Event existiert
            eventService.getEventById(eventId); //wirft einen Fehler in EventService, wenn es nicht gefunden wird
        } catch (IllegalStateException ex) {
            // Schickt einen 404 (Not Found) Status an das Frontend
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Fehler: Es existiert kein Event mit der ID " + eventId);
        }

        try {
            userService.getUserById(userID);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Fehler: Es existiert kein User mit der ID " + userID);
        }

        boolean userRemoved = eventService.removeUser(userID, eventId);
        if (userRemoved) {
            return ResponseEntity.ok("User removed succesfully");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Fehler: UserID befindet sich nicht in der Teilnehmerliste des Events");
        }
    }

    @GetMapping("/{eventID}/participantIds")
    public List<Integer> getParticipantIDs(@PathVariable("eventID") Integer eventID) {
        return eventService.getEventById(eventID).getParticipantIDs();
    }
}