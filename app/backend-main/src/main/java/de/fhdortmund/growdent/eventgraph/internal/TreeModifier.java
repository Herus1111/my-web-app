package de.fhdortmund.growdent.eventgraph.internal;

import de.fhdortmund.growdent.events.Event;
import de.fhdortmund.growdent.events.EventService;
import de.fhdortmund.growdent.users.Student;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

//Diese Klasse hat die Aufabe den bestehenden Baum (ohne Standard-Wachstum) zu verändern
//Damit hat er bislang nur die aufgabe sich um die Einladungen zu kümmern und für das Standartwachstum sollen die Nodes markiert werden, die besucht wurden
@Service
public class TreeModifier {
    private final EventService eventService;
    private final NodeRepository nodeRepository;
    private final TreeTraverser treeTraverser;


    private final Treevalidator treevalidator;

    public TreeModifier(EventService eventService, NodeRepository nodeRepository, TreeTraverser treeTraverser, Treevalidator treevalidator) {
        this.eventService = eventService;
        this.nodeRepository = nodeRepository;
        this.treeTraverser = treeTraverser;
        this.treevalidator = treevalidator;
    }

    //gibt die Nodes zurück, die aktuallisiert werden bzw. jetzt besucht = true haben aber noch keine Childs
    public List<Node> markVisitedNodes(List<Node> traversalList, List<Integer> eventsInUserTree, List<Integer> besuchteEventIds) {
        List<Node> updatedNodes = new ArrayList<>();

        for (Node element : traversalList) {
            eventsInUserTree.add(element.getEventId());

            if (besuchteEventIds.contains(element.getEventId()) && !element.isVisited()) {
                element.setVisited(true); // fürs Frontend als besucht markiert

                // nur wenn es KEINE Einladung ist, holen wir neue Nachfolger
                if (!ConnectionType.INVITED.equals(element.getConnectionType())) {
                    updatedNodes.add(element);
                }
            }
        }
        return updatedNodes;
    }

    public void addInvitation(int userId, int eventId, Node root) {

        Student student = null;

        student = treevalidator.IdBelongsToStudent(userId); //kann Exception werfen (Wird im Controller abgefangen)

        List<Integer> eventsInUserTree = student.getEventsInTree();
        if (eventsInUserTree.contains(eventId)) {
            return; //Wenn Id schon existiert, erstellt die Einladung keine neue Node im Baum sondern ändert die Verbindungsart
        }

        Event invitedEvent = eventService.getEventById(eventId);
        //Blätter holen
        List<Node> leaves = new ArrayList<>();
        treeTraverser.traverse(root, leaves);

        //blätter sind Nodes ohne Childs und keine eingeladenen Events
        leaves.removeIf(n -> !n.getChildren().isEmpty() || n.getConnectionType().equals(ConnectionType.INVITED));

        //Wenn es ein Event mit gleichem Genre gibt UND Datum ist danach, dann da. Sonst zufällig
        Node parent = null;
        for (Node node : leaves) {
            Event nodeEvent = eventService.getEventById(node.getEventId());
            if (invitedEvent.getGenre().equals(nodeEvent.getGenre())) {
                parent = node;
                break;
            }
        }
        Random random = new Random();

        if (parent == null) {
            parent = leaves.get(random.nextInt(leaves.size()));
        }

        Node newNode = new Node(eventId, parent, false, ConnectionType.INVITED, userId, false);

        parent.getChildren().add(newNode);
        nodeRepository.save(newNode);
        eventsInUserTree.add(eventId);
        student.setEventsInTree(eventsInUserTree);
    }
    public void removeInvitation(int userId, int eventId, Node root) {
        List<Node> allNodes = new ArrayList<>();
        treeTraverser.traverse(root, allNodes);

        Node target = null;
        for (Node node : allNodes) {
            if (!node.isRoot()
                    && ConnectionType.INVITED.equals(node.getConnectionType())
                    && node.getEventId() != null
                    && node.getEventId() == eventId
                    && node.getChildren().isEmpty()) {
                target = node;
                break;
            }
        }

        if (target == null) {
            return;
        }

        // Knoten aus der Liste der Kinder des Elternknotens entfernen
        Node parent = target.getParent();
        if (parent != null) {
            parent.getChildren().remove(target);
        }

        nodeRepository.delete(target);

        // Event-ID aus der Liste des Studenten entfernen
        Student student = treevalidator.IdBelongsToStudent(userId);
        List<Integer> eventsInUserTree = student.getEventsInTree();
        if (eventsInUserTree != null) {
            eventsInUserTree.remove(Integer.valueOf(eventId));
            student.setEventsInTree(eventsInUserTree);
        }
    }
}
