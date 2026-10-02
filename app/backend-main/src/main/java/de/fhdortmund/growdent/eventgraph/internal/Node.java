package de.fhdortmund.growdent.eventgraph.internal;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
public class Node {
    @Id // Definiert Primärschlüssel
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Um den Primärschlüssel automatisch Inkrementieren zu lassen
    private Integer nodeId;

    private Integer eventId;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Node parent;

    // Kaskadierung aktivieren: Wenn ein Vater gespeichert wird, werden neue Kinder automatisch mitgespeichert!
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Node> children;

    private boolean visited;

    private ConnectionType connectionType;

    private int userId;

    private boolean isRoot;

    public Node() {
    }

    public Node(Integer eventId, Node parent, boolean visited, ConnectionType connectionType, int userId, boolean isRoot) {

        this.eventId = eventId;
        this.parent = parent;
        this.children = new ArrayList<>();
        this.visited = visited;
        this.connectionType = connectionType;
        this.userId = userId;
        this.isRoot = isRoot;
    }

    @Override
    public String toString() {
        return "Node{" +
                "nodeId=" + nodeId +
                ", eventId=" + eventId +
                ", wurdeBesucht=" + visited +
                ", verbindungsart=" + connectionType +
                ", userId=" + userId +
                ", isRoot=" + isRoot +
                '}';
    }

    public boolean isRoot() {
        return isRoot;
    }

    public void setRoot(boolean root) {
        isRoot = root;
    }

    public Integer getNodeId() {
        return nodeId;
    }

    public Integer getEventId() {
        return eventId;
    }

    public Node getParent() {
        return parent;
    }

    public List<Node> getChildren() {
        return children;
    }

    public boolean isVisited() {
        return visited;
    }

    public ConnectionType getConnectionType() {
        return connectionType;
    }

    public int getUserId() {
        return userId;
    }

    public void setNodeId(Integer nodeId) {
        this.nodeId = nodeId;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public void setParent(Node parent) {
        this.parent = parent;
    }

    public void setChildren(List<Node> children) {
        this.children = children;
    }

    public void setVisited(boolean wurdeBesucht) {
        this.visited = wurdeBesucht;
    }

    public void setConnectionType(ConnectionType connectionType) {
        this.connectionType = connectionType;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Node node)) return false;
        return Objects.equals(getNodeId(), node.getNodeId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getNodeId());
    }
}
