package de.fhdortmund.growdent.users;

import de.fhdortmund.growdent.events.MiniEvent;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Basic;
import jakarta.persistence.Entity;

@Entity
public class Student extends User{

    private Integer level;
    private String status;
    // Speichert die Liste als echtes Array in PostgreSQL
    @Basic // Zwingt die IDE den ContainerTyp als BasisTyp zu akzeptieren
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<Integer> attendedEvents; // Mit Event-ID
    @Basic
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<Integer> eventsInTree; // Mit Event-ID
    @Basic
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> likedGenres = new ArrayList<>();

    public Student(){}

    public Student(Integer id, String firstName, String lastName, List<String> statistics, String username, String email, String password, Integer level, String status, List<Integer> attendedEvents){
        super(id, firstName, lastName, statistics, email, password, username);
        this.level = level;
        this.status = status;
        this.attendedEvents = (attendedEvents != null) ? attendedEvents : new ArrayList<>();
        this.eventsInTree = new ArrayList<>();
    }

    // Ein Student erstellt immer ein MiniEvent (konkrete Factory Entscheidung).
    // Objekt noch leer (gefüllt wird später im EventService).
    @Override
    public MiniEvent createEvent(){
        return new MiniEvent();
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Integer> getAttendedEvents() {
        return attendedEvents;
    }

    public void setAttendedEvents(List<Integer> attendedEvents) {
        this.attendedEvents = attendedEvents;
    }

    public List<Integer> getEventsInTree() {
        return eventsInTree;
    }

    public void setEventsInTree(List<Integer> eventsInTree) { this.eventsInTree = eventsInTree;  }

    public List<String> getLikedGenres() {
        return likedGenres;
    }

    public void setLikedGenres(List<String> likedGenres) {
        this.likedGenres = likedGenres != null ? likedGenres : new ArrayList<>();
    }

    public void addNewAttendedEvents(Integer eventID) {
        if (eventID != null) {
            attendedEvents.add(eventID);
        } else {
            System.out.println("EventID ist null!");
        }
    }
}
