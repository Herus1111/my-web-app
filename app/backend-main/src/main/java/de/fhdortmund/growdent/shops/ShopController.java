package de.fhdortmund.growdent.shops;
// Diese Klasse handhabt die Http-Requests (get,post,delete)
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Um Zugriff von außerhalb der Spring-Boot Anwendung zu ermöglichen. Andernfalls würden http-requests vom
 * React Frontend verweigert werden. Wenn wir weiter in dem Projekt sind wird es sicherere Möglichkeiten geben
 * den Zugriff nach außen zu erlauben. Mit @CrossOrigin erlauben wir jedem erstmal Zugriff
 */
@RestController // Damit die folgende Klasse http-requests verarbeiten kann
@RequestMapping("/growdent/shops") // Spezifiziert die URL für shop-requests
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    // Ein Request auf "/growdent/shops" liefert alle Shops der Datenbank
    @GetMapping
    public List<Shop> getShops() {
        return shopService.getAllShops();
    }

    // Eine Anfrage auf "/growdent/shops/1" liefert den Shop mit der gegeben Id (Primärschlüssel)
    @GetMapping("/{id}")
    public Shop getShopById(@PathVariable Integer id) {
        return shopService.getShopByID(id);
    }

    @PostMapping
    public void addNewShop(@RequestBody Shop shop) { //@RequestBody um ein Objekt aus dem Http-Body zu erstellen
        shopService.insertShop(shop);
    }
}
