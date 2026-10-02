package de.fhdortmund.growdent.eventgraph.internal;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FrontendPackager {
    private TreeTraverser treeTraverser;

    public FrontendPackager(TreeTraverser treeTraverser) {
        this.treeTraverser = treeTraverser;
    }

    public List<NodeDTO> getPackagedTreeForFrontend(Node root) {
        List<Node> traversedTree = new ArrayList<>();
        treeTraverser.traverse(root, traversedTree);

        // in saubere DTOs umwandeln
        return traversedTree.stream()
                .map(node -> new NodeDTO(
                        node.getNodeId(),
                        node.getEventId(),
                        node.getParent() != null ? node.getParent().getNodeId() : null,
                        node.isVisited(),
                        node.getConnectionType(),
                        node.isRoot()
                ))
                .toList();
    }
}
