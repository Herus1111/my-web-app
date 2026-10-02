package de.fhdortmund.growdent.users;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void insertUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalStateException("Email bereits vergeben");
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalStateException("Benutzername bereits vergeben");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
    }

    public void deleteUserById(int id) {
        userRepository.deleteById(id);
    }

    public User getUserById(int id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalStateException(id + " not found")); // Vermutlich noch nicht die richtige Exceptionklasse
    }

    public void addAttendedEvent(int studentId, Integer eventID) {
        User user = getUserById(studentId);
        if (!(user instanceof Student student)) {
            return;
        }
        student.addNewAttendedEvents(eventID);
        userRepository.save(student);
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalStateException("Email oder Passwort falsch"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalStateException("Email oder Passwort falsch");
        }
        return user;
    }
}