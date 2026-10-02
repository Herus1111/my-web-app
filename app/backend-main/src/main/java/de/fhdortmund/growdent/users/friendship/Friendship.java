package de.fhdortmund.growdent.users.friendship;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

//Freundschaft als eigenes Entity für bessere Übersicht und um Freundschaftsanfragen mit Status wie
// "ausstehend", "angenommen" oder "abgelehnt" zu ermöglichen
@Entity
public class Friendship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; //Eigene id als primary key da zusammengesetzte primary keys noch ne klasse benötigen und das find ich unnötig

    private Integer studentId;
    private Integer friendId;
    private String status; //Status wie zB "ausstehend, angenommen, abgelehnt"

    public Friendship() {}

    public Friendship(Integer studentId, Integer friendId, String status) {
        this.studentId = studentId;
        this.friendId = friendId;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public Integer getFriendId() {
        return friendId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
