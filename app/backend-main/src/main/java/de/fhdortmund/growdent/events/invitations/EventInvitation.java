package de.fhdortmund.growdent.events.invitations;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

//Einladung eines Freundes zu einem Event als eigenes Entity, analog zur Friendship.
//Dadurch können wir Einladungen mit Status ("PENDING", "ACCEPTED", "DECLINED") verwalten.
@Entity
public class EventInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; //Eigene id als primary key, analog zur Friendship

    private Integer eventId;   //zu welchem Event eingeladen wird
    private Integer inviterId; //Student der einlädt
    private Integer inviteeId; //Freund der eingeladen wird
    private String status;     //Status wie "PENDING", "ACCEPTED", "DECLINED"

    public EventInvitation() {}

    public EventInvitation(Integer eventId, Integer inviterId, Integer inviteeId, String status) {
        this.eventId = eventId;
        this.inviterId = inviterId;
        this.inviteeId = inviteeId;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public Integer getEventId() {
        return eventId;
    }

    public Integer getInviterId() {
        return inviterId;
    }

    public Integer getInviteeId() {
        return inviteeId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
