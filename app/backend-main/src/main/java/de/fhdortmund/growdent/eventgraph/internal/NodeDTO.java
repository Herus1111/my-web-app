package de.fhdortmund.growdent.eventgraph.internal;

//Um Nodes für das Frontend zu "verpacken" und als Data Transfer Object an das Frontend zu verschicken
public record NodeDTO(
        Integer nodeId,
        Integer eventId,
        Integer parentId, // Nur die Id nicht das Objekt
        boolean visited,
        ConnectionType connectionType,
        boolean isRoot
) {
}