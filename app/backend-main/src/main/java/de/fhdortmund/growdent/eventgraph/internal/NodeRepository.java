package de.fhdortmund.growdent.eventgraph.internal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NodeRepository extends JpaRepository<Node, Integer> {
    // Sucht die Node, wo userId übereinstimmt UND isRoot true ist
    Optional<Node> findByUserIdAndIsRootTrue(int userId);
}
