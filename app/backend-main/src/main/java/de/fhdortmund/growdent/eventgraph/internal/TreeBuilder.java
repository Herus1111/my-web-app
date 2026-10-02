package de.fhdortmund.growdent.eventgraph.internal;

import de.fhdortmund.growdent.events.Event;
import de.fhdortmund.growdent.users.Student;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


//Diese Klasse ist dazu da, an den Baum neue Knoten anzuhängen

@Service
public class TreeBuilder {
    private final RecommendationService recommendationService;
    private final NodeRepository nodeRepository;
    private final Treevalidator treevalidator;

    public TreeBuilder(RecommendationService recommendationService, NodeRepository nodeRepository, Treevalidator treevalidator) {
        this.recommendationService = recommendationService;
        this.nodeRepository = nodeRepository;
        this.treevalidator = treevalidator;
    }

    public Node createInitialTree(int userId) {
        List<Event> startEvents = recommendationService.getStartSuggestions(userId, 2);
        if (startEvents == null || startEvents.size() < 2) {
            throw new IllegalStateException("Error in recommendationService. Not enough events found.");
        }
        Node newUserRootNode = new Node(-1, null, false, ConnectionType.ROOT, userId, true);

        Node option1 = new Node(startEvents.getFirst().getId(), newUserRootNode, false, ConnectionType.DEFAULT, userId, false);
        Node option2 = new Node(startEvents.getLast().getId(), newUserRootNode, false, ConnectionType.DEFAULT, userId, false);
        newUserRootNode.getChildren().add(option1);
        newUserRootNode.getChildren().add(option2);
        nodeRepository.save(option1);
        nodeRepository.save(option2);
        nodeRepository.save(newUserRootNode);

        if (!treevalidator.validate(newUserRootNode)) {
            // wirft fehler und Springboot mach automatischen Rollback
            throw new IllegalStateException("Tree inconsistent after update! Error creating the tree. Tree validator: Logic error.");
        }
        List<Integer> eventsInUserTree = new ArrayList<>();
        eventsInUserTree.add(option1.getEventId());
        eventsInUserTree.add(option2.getEventId());
        Student s = treevalidator.IdBelongsToStudent(userId);
        s.setEventsInTree(eventsInUserTree);

        return newUserRootNode;
    }

    public void expandTree(int userId, Node element, List<Integer> eventsInUserTree) {
        List<Event> successors = recommendationService.getSuccessors(userId, element.getEventId()); //sollte nur zwei Elemente haben
        if (successors == null || successors.size() < 2) {
            throw new IllegalStateException("Error in recommendationService. Not enough events found.");
        }
        Node option1 = new Node(successors.getFirst().getId(), element, false, ConnectionType.DEFAULT, userId, false);
        Node option2 = new Node(successors.getLast().getId(), element, false, ConnectionType.DEFAULT, userId, false);
        nodeRepository.save(option1); // Diese beiden saves sind wegen dem @Transactional nicht zwingend nötig sie verhindern aber,
        nodeRepository.save(option2); // dass im Output von getPackagedTreeForFrontend bei den neuen Node IDs Null angezeigt wird
        List<Node> children = element.getChildren();
        children.add(option1);
        children.add(option2);
        eventsInUserTree.add(option1.getEventId());
        eventsInUserTree.add(option2.getEventId());
    }
}
