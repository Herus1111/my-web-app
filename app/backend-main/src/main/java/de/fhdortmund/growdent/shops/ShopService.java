package de.fhdortmund.growdent.shops;

// Handhabt die Shoplogik

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShopService {
    private ShopRepository shopRepository;

    public ShopService(ShopRepository shopRepository) {
        this.shopRepository = shopRepository;
    }

    public List<Shop> getAllShops() {
        return shopRepository.findAll();
    }

    public void insertShop(Shop shop) {
        shopRepository.save(shop);
    }

    public Shop getShopByID(int id) {
        return shopRepository.findById(id).orElseThrow(() -> new IllegalStateException(id + "not found")); // Vermutlich noch nicht die richtige Exceptionklasse
    }
}
