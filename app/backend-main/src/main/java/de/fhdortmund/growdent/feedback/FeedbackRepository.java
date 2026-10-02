package de.fhdortmund.growdent.feedback;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    //Prüft ob ein Nutzer dieses Event schon bewertet hat (gegen mehrfaches Feedback)
    boolean existsByEventIdAndUsername(Integer eventId, String username);
}
