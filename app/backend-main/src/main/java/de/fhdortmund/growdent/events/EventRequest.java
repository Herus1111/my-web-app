package de.fhdortmund.growdent.events;

import java.time.LocalDateTime;

//record ist einfach ne einfache Art um ne Klasse zu erstellen die nur Werte hält. Sie ist unveränderbar und
//getter werden quasi automatisch erstellt. Man schreibt aber zB. nicht getName() sondern einfach name()
public record EventRequest(
        String name,
        String venue,
        LocalDateTime eventdate,
        String organizer,
        Integer maxSlots,
        String genre,
        //nur für VeranstalterEvent relevant:
        Double ticketPreis,
        Integer mindestalter,
        String ticketLink,
        //nur für MiniEvent relevant:
        String treffpunktHinweis,
        String mitbringliste
) {}
