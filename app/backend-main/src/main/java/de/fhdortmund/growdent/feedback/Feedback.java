package de.fhdortmund.growdent.feedback;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.util.Objects;

@Entity
public class Feedback {
    @Id // definiert Primärschlüssel
    @GeneratedValue(strategy = GenerationType.IDENTITY) // inkrementiert Primärschlüssel
    private Integer id;
    private String userLiked;
    private String userDisliked;
    private Integer eventId; // id of the event this feedback refers to
    private String username; // name of the user who left the feedback
    private Integer recommendation; //Nummer 1-10
    private Integer socializingRating; //1-5 Sterne
    private Integer eventrating; //1-5 Sterne

    public Feedback() {
    }

    public Feedback(Integer id, String userLiked, String userDisliked, Integer eventId, Integer recommendation, Integer socializingRating, Integer eventrating) {
        this.id = id;
        this.userLiked = userLiked;
        this.userDisliked = userDisliked;
        this.eventId = eventId;
        this.recommendation = recommendation;
        this.socializingRating = socializingRating;
        this.eventrating = eventrating;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setUserLiked(String userLiked) {
        this.userLiked = userLiked;
    }

    public void setUserDisliked(String userDisliked) {
        this.userDisliked = userDisliked;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setRecommendation(Integer recommendation) {
        this.recommendation = recommendation;
    }

    public void setSocializingRating(Integer socializingRating) {
        this.socializingRating = socializingRating;
    }

    public void setEventrating(Integer eventrating) {
        this.eventrating = eventrating;
    }

    public Integer getId() {
        return id;
    }

    public String getUserLiked() {
        return userLiked;
    }

    public String getUserDisliked() {
        return userDisliked;
    }

    public Integer getRecommendation() {
        return recommendation;
    }

    public String getUsername() {
        return username;
    }

    public Integer getSocializingRating() {
        return socializingRating;
    }

    public Integer getEventrating() {
        return eventrating;
    }

    public Integer getEventId() {
        return eventId;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Feedback that = (Feedback) o;
        return Objects.equals(getId(), that.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }
}
