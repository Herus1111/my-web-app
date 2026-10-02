package de.fhdortmund.growdent.events;

import de.fhdortmund.growdent.users.User;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.integration.support.MessageBuilder;
import org.springframework.messaging.MessageChannel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service // Sagt Spring Boot: Hier liegt die Geschäftslogik (Die Küche)
public class EventService {
    private EventRepository eventRepository;
    private MessageChannel mqttChannel;

    public EventService(EventRepository eventRepository, @Qualifier("mqttOutputChannel") MessageChannel mqttChannel) {
        this.eventRepository = eventRepository;
        this.mqttChannel = mqttChannel;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    //Gibt jetzt das Event zurück, damit wir dieses mit der hinzugefügten ID zurück schicken, weil wir die ID für das hochladen vom Bild brauchen
    public Event createEvent(User creator, EventRequest req) {
        Event event = creator.createEvent(); //Factory wählt Mini/Veranstalter
        event.applyRequest(req);

        Event newEvent = eventRepository.save(event);

        //MQTT Nachricht an den Simulanten-Backend schicken
        String payload = String.format(
                "{\"eventId\": \"%d\", \"date\": \"%s\"}",
                newEvent.getId(),
                newEvent.getEventdate().toLocalDate()
        );
        mqttChannel.send(MessageBuilder.withPayload(payload).build());

        return newEvent;
    }

    public Event getEventById(int id){
        return eventRepository.findById(id).orElseThrow(() -> new IllegalStateException(id + "not found"));
    }

    /**

     Diese Annotation schaltet das Dirty Checking ein!
     Hibernate soll damit einen Schnappschuss vom Objekt vor dem Methodenaufruf machen.
     Wenn die Methode zudene ist, wird mit der alten Version verglichen und wenn was anders ist, wird der
     Update-Befehl für die Datenbank automatisch ausgeführt. Sonst müssten wir noch eventRepository.save()
     aufrufen.
     Außerdem ist es wie das Transaktionskonzept in Datenbanken. @Transactional garantiert, dass entweder
     alles oder gar nichts in der Datenbank gespeichert wird, falls ein Fehler in der Methode auftritt.
     */@Transactional
    public boolean addUser(int userId,int eventID){
        Event e = getEventById(eventID);
        int maxSlots = e.getMaxSlots();
        List<Integer> participantIDs = e.getParticipantIDs();
        if(participantIDs.size()<maxSlots && !participantIDs.contains(userId)){
            participantIDs.add(userId);
            return true;
        }else{
            return false;
        }
        //kein eventRepository.save(event) notwendig wegen @Transactional
     }

    /*
    Entfernt einen Teilnehmer wieder aus einem Event (Student verlässt das Event vorzeitig).
    Gibt true zurück, wenn der User Teilnehmer war und entfernt wurde, sonst false.
    Wichtig: Integer.valueOf(userId), damit remove() nach dem Wert und nicht nach dem Index entfernt.
     */
    @Transactional
    public boolean removeUser(int userId, int eventID){
        Event e = getEventById(eventID);
        List<Integer> participantIDs = e.getParticipantIDs();
        return participantIDs.remove(Integer.valueOf(userId));
        //kein eventRepository.save(event) notwendig wegen @Transactional
    }

    // readOnly = true ist ein kleiner Performance-Boost für reine Lese-Abfragen
    @Transactional(readOnly = true)
    public byte[] getEventPicture(int eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found!"));

        // Hier gehst du davon aus, dass dein Byte-Array in der Entity z.B. "eventPicture" heißt
        if (event.getPictureData() == null) {
            throw new RuntimeException("No picture available for this event!");
        }

        return event.getPictureData();
    }

    @Transactional
    public void uploadPicture(Integer eventId, MultipartFile data) {
        // 1. Event aus der DB holen
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found!"));

        try {
            // 2. Das Bild in ein Byte-Array umwandeln und ins Event stecken
            event.setPictureData(data.getBytes());

            // Fertig! Dank @Transactional speichert Hibernate das automatisch.
        } catch (IOException e) {
            // Falls beim Lesen der Datei etwas schiefgeht
            throw new RuntimeException("Error while processing picture", e);
        }
    }

    @Transactional
    public void updateWeather(int eventId, Double celsius, Double precipitation, int weatherCode) {
        Event event = getEventById(eventId);
        event.setWeather(new EventWeather(celsius, precipitation, weatherCode));
    }

}