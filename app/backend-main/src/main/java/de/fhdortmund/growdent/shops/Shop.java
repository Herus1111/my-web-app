package de.fhdortmund.growdent.shops;
// Diese Klasse ist eine Datenbankentität

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.util.Objects;

@Entity // Sagt der Datenbank, dass es sich bei dieser Klasse um eine zu speichernde Entität handelt
public class Shop {
    @Id // Definiert Primärschlüssel
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Um den Primärschlüssel automatisch Inkrementieren zu lassen
    private Integer id;
    private Integer sellingItemsCount;
    //private Item[] itemlist; // ! spezielle Annotation für mehrwertige Attribute (Array, List, ...) nötig ((@JdbcTypeCode(SqlTypes.ARRAY) denke ich)

    // Weitere Attribute könnten hier stehen


    public Shop() { // Leerer Konstruktor für Hibernate
    }

    public Shop(Integer id, Integer sellingItemsCount) {
        this.id = id;
        this.sellingItemsCount = sellingItemsCount;
    }

    public Integer getId() { //getter and setter are important for the requests
        return id;
    }

    public Integer getSellingItemsCount() {
        return sellingItemsCount;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setSellingItemsCount(Integer sellingItemsCount) {
        this.sellingItemsCount = sellingItemsCount;
    }

    // Generierungsoptionen: instanceof expression und Use getters when available muss ausgewählt sein ( von gemini empfohlen)
    // ! equals und hashCode nur mit dem Id-Attribut generieren
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Shop shop)) return false;
        return Objects.equals(getId(), shop.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }
}
