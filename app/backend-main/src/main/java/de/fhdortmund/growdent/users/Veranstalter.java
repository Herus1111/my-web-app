package de.fhdortmund.growdent.users;

import de.fhdortmund.growdent.events.VeranstalterEvent;
import jakarta.persistence.*;

import java.util.List;

@Entity
public class Veranstalter extends User {

    private Integer budget;
    private Boolean verifiziert;

    public Veranstalter(){}

    public Veranstalter(Integer id, String firstName, String lastName, List<String> statistics, String email, String password, String username) {
        super(id, firstName, lastName, statistics, email, password, username);
    }

    // Ein Veranstalter erstellt immer ein VeranstalterEvent (konkrete Factory Entscheidung).
    // Objekt noch leer (gefüllt wird später im EventService).
    @Override
    public VeranstalterEvent createEvent(){
        return new VeranstalterEvent();
    }

    public Integer getBudget() {
        return budget;
    }

    public Boolean getVerifiziert() {
        return verifiziert;
    }

    public void setBudget(Integer budget) {
        this.budget = budget;
    }

    public void setVerifiziert(Boolean verifiziert) {
        this.verifiziert = verifiziert;
    }
}
