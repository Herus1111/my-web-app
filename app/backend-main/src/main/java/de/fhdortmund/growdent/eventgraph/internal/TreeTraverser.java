package de.fhdortmund.growdent.eventgraph.internal;

import de.fhdortmund.growdent.events.EventService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TreeTraverser {
    private final EventService eventService;

    public TreeTraverser(EventService eventService) {
        this.eventService = eventService;
    }

    public List<Node> traverse(Node current, List<Node> list) {
        if (current != null) {
            list.add(current);
            if (current.getChildren() != null) {
                for (Node child : current.getChildren()) {
                    traverse(child, list);
                }
            }
        }
        return list;
    }

    public List<Integer> getEventsInTree(Node root) {
        List<Node> eventNodes = new ArrayList<>();
        List<Integer> events = new ArrayList<>();

        traverse(root, eventNodes);
        for (Node n : eventNodes) {
            events.add(n.getEventId());
        }
        return events;
    }

    public Node getNodeByEventID(Node root, int eventId) {
        if (root.getEventId() == eventId) {
            return root;
        }
        // Suche in allen Kindern der aktuellen Node rekursiv weiter
        for (Node child : root.getChildren()) {
            Node found = getNodeByEventID(child, eventId);
            // Wenn in diesem Zweig etwas gefunden wurde, gib es sofort zurück
            if (found != null) {
                return found;
            }
        }
        // Wenn in diesem ganzen Zweig nichts gefunden wurde, gib null zurück
        return null;
    }
}
