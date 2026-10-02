package de.fhdortmund.growdent.eventgraph;

import de.fhdortmund.growdent.eventgraph.internal.*;
import de.fhdortmund.growdent.events.EventService;
import de.fhdortmund.growdent.users.Student;
import de.fhdortmund.growdent.users.User;
import de.fhdortmund.growdent.users.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TreeManagerFacade {
    private final NodeRepository nodeRepository;
    private final TreeTraverser treeTraverser;
    private final Treevalidator treevalidator;
    private final FrontendPackager frontendPackager;
    private final UserService userService;
    private final TreeModifier treeModifier;
    private final TreeBuilder treeBuilder;

    public TreeManagerFacade(NodeRepository nodeRepository, TreeTraverser treeTraverser, Treevalidator treevalidator,
            FrontendPackager frontendPackager, UserService userService, TreeModifier treeModifier,
            TreeBuilder treeBuilder) {
        this.nodeRepository = nodeRepository;
        this.treeTraverser = treeTraverser;
        this.treevalidator = treevalidator;
        this.frontendPackager = frontendPackager;
        this.userService = userService;
        this.treeModifier = treeModifier;
        this.treeBuilder = treeBuilder;
    }

    public Node getRootFromUser(int userId) throws IllegalStateException {
        if (!treevalidator.userIdExists(userId)) {
            return null;
        }
        Optional<Node> rootNodeOptional = nodeRepository.findByUserIdAndIsRootTrue(userId);
        // Wenn noch kein Baum erstellt wurde, root Node erstellen
        if (!rootNodeOptional.isPresent()) {
            return treeBuilder.createInitialTree(userId);
        } else {
            Node root = rootNodeOptional.get();
            updateTree(userId, root);

            if (!treevalidator.validate(root)) {
                // wirft fehler und Springboot mach automatischen Rollback
                throw new IllegalStateException("Baum nach Update inkonsistent! Fehler "
                        + "beim aktuallisieren des Baums. Baumvalidator: Logikfehler");
            }
            return root;
        }
    }

    // Wenn ein Event besucht wurde, müssen Nachfolger ergänzt werden
    public void updateTree(int userId, Node root) {
        Student student = treevalidator.IdBelongsToStudent(userId);

        List<Node> traversalList = new ArrayList<>();
        treeTraverser.traverse(root, traversalList);

        List<Integer> eventsInUserTree = new ArrayList<>();
        List<Integer> visitedEvents = student.getAttendedEvents();

        // es gibt eine Node, die keine children hat aber "wurdeBesucht" auf true hat
        // eventsInUserTree wird in markVisitedNodes erweitert
        List<Node> updatedNodes = treeModifier.markVisitedNodes(traversalList, eventsInUserTree, visitedEvents);

        for (Node element : updatedNodes) {
            // eventsInUserTree wird in expandTree erweitert
            treeBuilder.expandTree(userId, element, eventsInUserTree);
        }
        
        student.setEventsInTree(eventsInUserTree);
    }

    public List<NodeDTO> getPackagedTreeForFrontend(int userId) {
        if (treevalidator.userIdExists(userId)) {
            return frontendPackager.getPackagedTreeForFrontend(getRootFromUser(userId));
        } else {
            throw new IllegalStateException("User with the ID " + userId + " does not exist.");
        }
    }

    // für spätere Änderungen in, wenn Exceptions auftreten. Man könnte, wenn das
    // aktuallisieren schief geht
    // hiermit einfach den alten Baum verpacken und zurück geben
    public List<NodeDTO> getOldPackagedTree(int userId) {
        Optional<Node> root = nodeRepository.findByUserIdAndIsRootTrue(userId);
        if (root.isPresent()) {
            return frontendPackager.getPackagedTreeForFrontend(root.get());
        }
        return new ArrayList<>();
    }

    public void addInvitation(int userId, int eventId) {
        if (!treevalidator.eventIdExists(eventId) || !treevalidator.userIdExists(userId)) {
            throw new IllegalStateException("UserID or EventID does not exist.");
        }
        Node root = getRootFromUser(userId);
        treeModifier.addInvitation(userId, eventId, root);
    }

    public void removeInvitation(int userId, int eventId) {
        if (!treevalidator.eventIdExists(eventId) || !treevalidator.userIdExists(userId)) {
            throw new IllegalStateException("UserID or EventID does not exist.");
        }
        Node root = getRootFromUser(userId);
        if (root != null) {
            treeModifier.removeInvitation(userId, eventId, root);
        }
    }
}
