package de.fhdortmund.growdent.events;

// Diese Klasse ist eine Datenbankentität

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
//VeranstalterEvent und MiniEvent teilen sich eine Tabelle (event)
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
//Spalte die den eventtyp speichert (automatisch)
@DiscriminatorColumn(name = "event_type", discriminatorType = DiscriminatorType.STRING)
public abstract class Event{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private String venue;
    private LocalDateTime eventdate;
    private String organizer; //wenn veranstalter als Entität in der Datenbank gespeichert sind nur noch deren Primärschlüssel speichern
    private Integer maxSlots;
    private String genre;

    @Embedded
    private EventWeather weather;

    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<Integer> participantIDs = new ArrayList<>();

    //@Lob steht für Large Object
    @Lob
    private byte[] pictureData;


    public Event(){}

    public Event(Integer id, String name, String venue, LocalDateTime eventdate, String organizer, Integer maxSlots) {
        this.id = id;
        this.name = name;
        this.venue = venue;
        this.eventdate = eventdate;
        this.organizer = organizer;
        this.maxSlots = maxSlots;
        this.participantIDs = new ArrayList<>();
    }

    public void applyRequest(EventRequest req){
        setName(req.name());
        setVenue(req.venue());
        setEventdate(req.eventdate());
        setOrganizer(req.organizer());
        setMaxSlots(req.maxSlots());
        setGenre(req.genre());
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getVenue() {
        return venue;
    }

    public LocalDateTime getEventdate() {
        return eventdate;
    }

    public String getOrganizer() {
        return organizer;
    }

    public Integer getMaxSlots() {
        return maxSlots;
    }

    public String getGenre() {
        return genre;
    }

    public String getType() {
        return this.getClass().getSimpleName();
    }

    public List<Integer> getParticipantIDs() {
        return participantIDs;
    }

    public byte[] getPictureData() {
        return pictureData;
    }

    public void setPictureData(byte[] pictureData) {
        this.pictureData = pictureData;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public void setEventdate(LocalDateTime eventdate) {
        this.eventdate = eventdate;
    }

    public void setOrganizer(String organizer) {
        this.organizer = organizer;
    }

    public void setMaxSlots(Integer maxSlots) {
        this.maxSlots = maxSlots;
    }

    public void setParticipantIDs(List<Integer> participantIDs) {
        this.participantIDs = participantIDs;
    }

    public EventWeather getWeather() {
        return weather;
    }

    public void setWeather(EventWeather weather) {
        this.weather = weather;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Event event)) return false;
        return Objects.equals(getId(), event.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }
}