package de.fhdortmund.growdent.events;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
//legt wert in event_type spalte fest
@DiscriminatorValue("MINI")
public class MiniEvent extends Event {
    private String treffpunktHinweis;
    private String mitbringliste;

    @Override
    public void applyRequest(EventRequest req){
        super.applyRequest(req);
        treffpunktHinweis = req.treffpunktHinweis();
        mitbringliste = req.mitbringliste();
    }

    public String getTreffpunktHinweis() {
        return treffpunktHinweis;
    }

    public String getMitbringliste() {
        return mitbringliste;
    }

    public void setTreffpunktHinweis(String treffpunktHinweis) {
        this.treffpunktHinweis = treffpunktHinweis;
    }

    public void setMitbringliste(String mitbringliste) {
        this.mitbringliste = mitbringliste;
    }
}
