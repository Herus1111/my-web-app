package de.fhdortmund.growdent.eventgraph;

import de.fhdortmund.growdent.eventgraph.internal.NodeDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.ConcurrentHashMap;

import java.util.List;

@RestController // Damit die folgende Klasse http-requests verarbeiten kann
@RequestMapping("/growdent/EventGraph") // Spezifiziert die URL für shop-requests
@CrossOrigin
public class TreeManagerController {
    private final TreeManagerFacade treeManagerFacade;

    // Pro userId ein eigenes Lock-Objekt, damit parallele Requests fuer denselben
    // User (z.B. initiales Laden + Polling) sich nicht gegenseitig beim Erstellen
    // der Root-Node ueberholen und Duplikate anlegen. Andere User blockieren sich
    // dabei nicht gegenseitig.
    private final ConcurrentHashMap<Integer, Object> userLocks = new ConcurrentHashMap<>();

    public TreeManagerController(TreeManagerFacade treeManagerFacade) {
        this.treeManagerFacade = treeManagerFacade;
    }

    private Object lockFor(Integer userId) {
        return userLocks.computeIfAbsent(userId, k -> new Object());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getPackagedTreeForFrontend(@PathVariable Integer userId) {
        synchronized (lockFor(userId)) {
            try {
                List<NodeDTO> tree = treeManagerFacade.getPackagedTreeForFrontend(userId);
                return ResponseEntity.ok(tree);
            } catch (IllegalStateException e) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("The tree could not be updated: " + e.getMessage());
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Error loading the tree: " + e.getMessage());
            }
        }
    }

    @PostMapping("/inviteUser/{userId}/toEvent/{eventId}")
    public ResponseEntity<?> addInvitation(@PathVariable Integer userId, @PathVariable Integer eventId) {
        synchronized (lockFor(userId)) {
            try {
                treeManagerFacade.addInvitation(userId, eventId);
                return ResponseEntity.ok("Invitation completed without errors");
            } catch (IllegalStateException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(e.getMessage());
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Error processing the invitation: " + e.getMessage());
            }
        }
    }
}
