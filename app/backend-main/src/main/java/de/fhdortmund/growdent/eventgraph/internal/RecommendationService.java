package de.fhdortmund.growdent.eventgraph.internal;

import de.fhdortmund.growdent.events.Event;
import de.fhdortmund.growdent.events.EventRepository;
import de.fhdortmund.growdent.events.EventService;
import de.fhdortmund.growdent.users.Student;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Wir bauen unser Grundkonzept auf, das heißt erstmal werden Events vorgeschlagen.
 * Falls dann ein Event besucht wurde, kommen 2 Nachfolger. Einer davon ist zufällig und der andere ist einfach eine Genre was der User schonmal gut fand. Falls er noch nix gut fand einfach random
 * Sehr einfach gehalten erstmal
 * <p>
 * Zukünftig:
 * Invites durch Freunde erlauben und die Events die von Veranstaltern promoted wurden
 */
@Service
public class RecommendationService {

    private final EventRepository eventRepository;
    private final Treevalidator treevalidator;
    private final EventService eventService;

    public RecommendationService(EventRepository eventRepository, Treevalidator treevalidator, EventService eventService) {
        this.eventRepository = eventRepository;
        this.treevalidator = treevalidator;
        this.eventService = eventService;
    }

    // am anfang werden ein paar Events angegeben random
    public List<Event> getStartSuggestions(int userId, int count) {
        List<Event> candidates = eventsNotJoinedBy(userId);
        // Einfaches Sortieren nach Datum (früheste zuerst)
        candidates.sort((event1, event2) -> {
            // Wenn ein Event kein Datum hat steht es ganz hinten
            if (event1.getEventdate() == null) return 1;
            if (event2.getEventdate() == null) return -1;
            // Vergleicht die beiden Daten
            return event1.getEventdate().compareTo(event2.getEventdate());
        });

        // Wir nehmen nur die allerersten Events
        List<Event> earlyPool = new ArrayList<>();
        int poolSize = 6;
        for (int i = 0; i < candidates.size() && i < poolSize; i++) {
            earlyPool.add(candidates.get(i));
        }
        // Damit nicht jeder die gleichen Start-Events hat
        Collections.shuffle(earlyPool);
        List<Event> result = new ArrayList<>();
        for (int i = 0; i < earlyPool.size() && i < count; i++) {
            result.add(earlyPool.get(i));
        }
        return result;
    }

    public List<Event> getSuccessors(int userId, int parentEventId) {

        List<Event> candidates = eventsNotJoinedBy(userId);
        //candidaten mit Datum vor dem parentEventId rausfiltern
        Event parentEvent = eventService.getEventById(parentEventId);
        LocalDateTime parentEventDate = parentEvent.getEventdate();
        if(parentEventDate != null){
            List<Event> candidatestmp = new ArrayList<>();
            for (int i = 0; i < candidates.size(); i++) {
                Event candidate = candidates.get(i);
                if (candidate.getEventdate() != null && candidate.getEventdate().isAfter(parentEventDate)) {
                    candidatestmp.add(candidate);
                } else if (candidates.get(i).getEventdate() == null) {
                    candidatestmp.add(candidate);
                }
            }
            candidates = candidatestmp;
        }

        if (candidates.size() < 2) { //für zwei Nachfolger müssen mindestens zwei Kandidaten existieren
            throw new IllegalStateException("Error in recommendationService in getSuccessors(). Not enough events found.");
        }

        candidates.sort((e1, e2) -> {
            if (e1.getEventdate() == null) return 1;
            if (e2.getEventdate() == null) return -1;
            return e1.getEventdate().compareTo(e2.getEventdate());
        });

        //Einen Pool aus den ersten (frühesten) paar Events bilden
        List<Event> earlyPool = new ArrayList<>();
        int poolSize = 6; // Wir betrachten nur die nächsten 6 Events
        for (int i = 0; i < candidates.size() && i < poolSize; i++) {
            earlyPool.add(candidates.get(i));
        }

        List<Event> successors = new ArrayList<>();

        // erster nachfolger zufällig
        Event randomEvent = pickRandom(earlyPool);
        if (randomEvent != null) {
            successors.add(randomEvent);
            earlyPool.remove(randomEvent); // damit das 2. event nicht das gleiche wird
        }

        // zweiter nachfolger anhand der interessen
        Set<String> likedGenres = getLikedGenres(userId);
        List<Event> genreCandidates = earlyPool.stream()
                .filter(e -> e.getGenre() != null && likedGenres.contains(e.getGenre()))
                .collect(Collectors.toList());

        // falls kein passendes Event, random event
        Event secondEvent = genreCandidates.isEmpty() ? (earlyPool.isEmpty() ? null : pickRandom(earlyPool)) : pickRandom(genreCandidates);
        if (secondEvent != null) {
            successors.add(secondEvent);
        }

        return successors;
    }

    // die genres die der user schonmal gut fand
    /*
     * TODO: Wenn die Option zum Abgeben des Feedbacks implementiert ist soll die Funktion so erweitert werden, dass
     * nicht mehr die Genres von besuchten Events direkt als "LikedGenres" zählen, sondern nur dann, wenn das Feedback dazu
     * zum Beispiel mehr als 3 Sterne hat.
     */
    public Set<String> getLikedGenres(int userId) {
        Student student = treevalidator.IdBelongsToStudent(userId);
        if (student == null || student.getLikedGenres() == null) {
            return new HashSet<>();
        }
        return new HashSet<>(student.getLikedGenres());
    }

    private List<Event> eventsNotJoinedBy(int userId) {
        // Kandidaten = alle Events die noch nicht im EventTree dieses Users sind
        // Alle Events die ein User besucht hat sind in dieser Menge enthalten
        Student s = treevalidator.IdBelongsToStudent(userId);
        List<Integer> eventsInUserTree = s.getEventsInTree();

        return eventRepository.findAll().stream()
                .filter(e -> !eventsInUserTree.contains(e.getId()))
                .collect(Collectors.toList());
    }

    private Event pickRandom(List<Event> events) {
        if (events.isEmpty()) {
            return null;
        }
        int index = (int) (Math.random() * events.size());
        return events.get(index);
    }
}
