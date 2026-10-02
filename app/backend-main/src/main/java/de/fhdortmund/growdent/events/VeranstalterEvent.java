package de.fhdortmund.growdent.events;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
//legt wert in event_type spalte fest
@DiscriminatorValue("VERANSTALTER")
public class VeranstalterEvent extends Event{
    private Double ticketPreis;
    private Integer mindestalter;
    private String ticketLink;

    @Override
    public void applyRequest(EventRequest req){
        super.applyRequest(req);
        this.ticketPreis = req.ticketPreis();
        this.mindestalter = req.mindestalter();
        this.ticketLink = req.ticketLink();
    }

    public Double getTicketPreis() {
        return ticketPreis;
    }

    public Integer getMindestalter() {
        return mindestalter;
    }

    public String getTicketLink() {
        return ticketLink;
    }

    public void setTicketPreis(Double ticketPreis) {
        this.ticketPreis = ticketPreis;
    }

    public void setMindestalter(Integer mindestalter) {
        this.mindestalter = mindestalter;
    }

    public void setTicketLink(String ticketLink) {
        this.ticketLink = ticketLink;
    }
}
