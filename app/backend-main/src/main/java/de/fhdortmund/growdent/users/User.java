package de.fhdortmund.growdent.users;

import de.fhdortmund.growdent.events.Event;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Objects;

@Table(name = "app_users") // Verhindert den Crash mit dem reservierten SQL-Wort "user"
@Entity
@Inheritance(strategy = InheritanceType.JOINED) // Gemeinsame Eltern-Tabelle app_users + Kindtabellen; erlaubt polymorphe FKs auf User (z.B. ChatMessage.sender)
public abstract class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "global_user_seq") //Sorgt dafür das die ID Global weiter zählt.
    @SequenceGenerator(name = "global_user_seq", sequenceName = "user_global_id_sequence", allocationSize = 1) // Id wird gesetzt und Generator einen hochgezählt.
    private Integer id;

    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String password;

    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> statistics;

    public User() {
    }

    public User(Integer id, String firstName, String lastName, List<String> statistics, String email, String password, String username) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.statistics = statistics;
        this.email = email;
        this.password = password;
    }

    //Factory Method: Jede User Unterklasse muss festlegen, welchen Event-Typ sie erstellt.
    public abstract Event createEvent();

    public Integer getId() {
        return id;
    }

    public String getType() {
        return this.getClass().getSimpleName();
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<String> getStatistics() {
        return statistics;
    }

    public void setStatistics(List<String> statistics) {
        this.statistics = statistics;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(getId(), user.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }
}
