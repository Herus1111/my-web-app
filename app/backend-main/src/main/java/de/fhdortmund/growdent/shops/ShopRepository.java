package de.fhdortmund.growdent.shops;
// Das Interface wird benutzt um auf die Datenbank zuzugreifen

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopRepository extends JpaRepository<Shop, Integer> {
    // Hier muss fürs Erste nichts implementiert werden. Alles kommt mit dem "extends JpaRepository"
}
