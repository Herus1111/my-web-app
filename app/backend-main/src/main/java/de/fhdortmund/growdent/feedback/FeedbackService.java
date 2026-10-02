package de.fhdortmund.growdent.feedback;

import de.fhdortmund.growdent.events.Event;
import de.fhdortmund.growdent.events.EventRepository;
import de.fhdortmund.growdent.users.Student;
import de.fhdortmund.growdent.users.User;
import de.fhdortmund.growdent.users.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public FeedbackService(FeedbackRepository feedbackRepository, EventRepository eventRepository, UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public void insertFeedback(Feedback feedback) {
        if (hasAlreadyGivenFeedback(feedback)) {
            throw new IllegalStateException("Du hast dieses Event bereits bewertet");
        }
        feedbackRepository.save(feedback);
        persistLikedGenreIfPositive(feedback);
    }

    private boolean hasAlreadyGivenFeedback(Feedback feedback) {
        if (feedback == null || feedback.getEventId() == null || feedback.getUsername() == null) {
            return false;
        }
        return feedbackRepository.existsByEventIdAndUsername(feedback.getEventId(), feedback.getUsername());
    }

    public Feedback getFeedbackById(int id) {
        return feedbackRepository.findById(id).orElseThrow(() -> new IllegalStateException((id + "not found"))); // Vermutlich noch nicht die richtige Exceptionklasse
    }

    private void persistLikedGenreIfPositive(Feedback feedback) {
        if (feedback == null || feedback.getEventId() == null || feedback.getUsername() == null || feedback.getRecommendation() == null || feedback.getRecommendation() <= 6) {
            return;
        }

        Event event = eventRepository.findById(feedback.getEventId()).orElse(null);
        if (event == null || event.getGenre() == null) {
            return;
        }

        User user = userRepository.findAll().stream()
                .filter(u -> Objects.equals(u.getUsername(), feedback.getUsername()))
                .findFirst()
                .orElse(null);

        if (!(user instanceof Student student)) {
            return;
        }

        List<Integer> attendedEvents = student.getAttendedEvents();
        List<Integer> participantIds = event.getParticipantIDs();
        boolean attended = attendedEvents != null && attendedEvents.contains(feedback.getEventId());
        boolean joined = participantIds != null && participantIds.contains(student.getId());
        if (!attended && !joined) {
            return;
        }

        List<String> likedGenres = student.getLikedGenres() == null ? new ArrayList<>() : new ArrayList<>(student.getLikedGenres());
        if (!likedGenres.contains(event.getGenre())) {
            likedGenres.add(event.getGenre());
            student.setLikedGenres(likedGenres);
            userRepository.save(student);
        }
    }
}