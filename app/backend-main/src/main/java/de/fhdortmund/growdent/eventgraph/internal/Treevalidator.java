package de.fhdortmund.growdent.eventgraph.internal;

import de.fhdortmund.growdent.events.Event;
import de.fhdortmund.growdent.events.EventService;
import de.fhdortmund.growdent.users.Student;
import de.fhdortmund.growdent.users.User;
import de.fhdortmund.growdent.users.UserService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

//Diese Klasse soll für das Prüfen von benutzen Attributen in Eventgraph zuständig werden
@Service
public class Treevalidator {
    private final UserService userService;
    private final TreeTraverser treeTraverser;
    private final EventService eventService;

    public Treevalidator(UserService userService, TreeTraverser treeTraverser, EventService eventService) {
        this.userService = userService;
        this.treeTraverser = treeTraverser;
        this.eventService = eventService;
    }

    public boolean userIdExists(int userId) {
        try {
            userService.getUserById(userId); //wenn es keinen Fehler wirft gibt es den User
            return true;
        } catch (IllegalStateException e) {
            return false;
        }
    }

    public boolean eventIdExists(int eventId) {
        try {
            eventService.getEventById(eventId);
            return true; //wenn es keinen Fehler wirft gibt es das Event
        } catch (IllegalStateException e) {
            return false;
        }
    }


    //Gibt Student wieder, wenn Id zu einem Studenten gehört
    public Student IdBelongsToStudent(int studentId) {

        User user = userService.getUserById(studentId);

        if (!(user instanceof Student)) {
            throw new IllegalStateException("The specified ID does not belong to any student.");
        }
        return (Student) user;
    }

    //gibt false zurück, wenn zyklenfrei
    private boolean checkForCycles(Node root) {
        if (root == null || root.getNodeId() == null) {
            return false;
        }
        Queue<Node> queue = new LinkedList<>();
        List<Integer> visitedNodes = new ArrayList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            Node current = queue.poll(); //entfernt erstes element und gibt es zurück
            Integer currentId = current.getNodeId();
            if (visitedNodes.contains(currentId)) {
                return true; // Zyklus gefunden!
            }
            visitedNodes.add(currentId);
            if (current.getChildren() != null) {
                for (Node child : current.getChildren()) {
                    if (child != null && child.getNodeId() != null) {
                        queue.add(child);
                    }
                }
            }
        }

        // Wenn die Warteschlange leer ist und nichts doppelt vorkam, ist der Graph zyklusfrei
        return false;
    }

    private boolean checkAscendingDates(Node root) {
        List<Node> allNodes = new ArrayList<>();
        treeTraverser.traverse(root, allNodes);

        for (Node parentNode : allNodes) {
            // Die Root-Node (-1) hat kein echtes Event
            if (parentNode.getEventId() == -1) {
                continue;
            }
            List<Node> children = parentNode.getChildren();
            if (children == null || children.isEmpty()) {
                continue;
            }
            Event parentEvent = eventService.getEventById(parentNode.getEventId());
            // Wann ParentEvent kein Datum hat -> überspringen
            if (parentEvent == null || parentEvent.getEventdate() == null) {
                continue;
            }

            for (Node childNode : children) {
                // Einladungen dürfen außerhalb der Reihenfolge sein
                if (ConnectionType.INVITED.equals(childNode.getConnectionType())) {
                    continue;
                }
                Event childEvent = eventService.getEventById(childNode.getEventId());
                if (childEvent != null && childEvent.getEventdate() != null) {
                    // Wenn es KEINE Einladung ist, MUSS das Datum nach dem Parent-Datum liegen
                    if (childEvent.getEventdate().isBefore(parentEvent.getEventdate())) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    //Gibt false zurück, wenn die Anzahl der Verbindungen ungültig sind
    private boolean checkChildCount(Node root) {
        //Jeweils die Child Nodes speichern ihre Verbindung
        List<Node> allNodes = new ArrayList<>();
        treeTraverser.traverse(root, allNodes);

        for (Node node : allNodes) {
            List<Node> children = node.getChildren();
            // Keine Kinder -> Kein Fehler
            if (children == null || children.isEmpty()) {
                continue;
            }
            // Nur "Default" Zählen
            long defaultChildrenCount = children.stream()
                    .filter(child -> ConnectionType.DEFAULT.equals(child.getConnectionType()))
                    .count();

            //Wenn es Kinder gibt gibt es maximal 2 oder 0 mit der Verbindung "STANDART"
            if (defaultChildrenCount == 1 || defaultChildrenCount > 2) {
                return false;
            }
        }

        return true;
    }

    public boolean validate(Node root) {
        if (checkForCycles(root)) {
            throw new IllegalStateException("Cycle found");
        }

        if (!checkAscendingDates(root)) {
            throw new IllegalStateException("There is a child event with a date preceding that of the parent");
        }

        if (!checkChildCount(root)) {
            throw new IllegalStateException("Number of children in a node is invalid.");
        }
        //weitere checks
        return true;
    }
}
