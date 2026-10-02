package de.fhdortmund.growdent.users.friendship;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("growdent/friendships")
@CrossOrigin
public class FriendshipController {
    private final FriendshipService friendshipService;

    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    //gibt alle Freundschaften von Student mit angegebner ID zurück
    @GetMapping("/{studentId}")
    public List<Friendship> getFriendships(@PathVariable Integer studentId){
        return friendshipService.getFriendships(studentId);
    }

    /*
     POST /growdent/friendships/request?studentId=1&friendId=2
     Schickt eine Freundschaftsanfrage von Student 1 an Student 2.
     */
    @PostMapping("/request")
    public void sendRequest(@RequestParam Integer studentId, @RequestParam Integer friendId){
        friendshipService.sendRequest(studentId, friendId);
    }

    /*
     PUT /growdent/friendships/accept?studentId=1&friendId=2
     Akzeptiert die Freundschaftsanfrage zwischen Student 1 und Student 2.
     PUT weil wir einen bestehenden Eintrag ändern (Status → ACCEPTED)
     */
    @PutMapping("/accept")
    public void acceptRequest(@RequestParam Integer studentId, @RequestParam Integer friendId){
       friendshipService.acceptRequest(studentId, friendId);
    }

    /*
     POST /growdent/friendships/decline?studentId=1&friendId=2
     Lehnt eine Freundschaftsanfrage ab (Intern das gleiche wie delete)
     */
    @PostMapping("/decline")
    public void declineRequest(@RequestParam Integer studentId, @RequestParam Integer friendId) {
        friendshipService.declineFriendship(studentId, friendId);
    }

    /*
     DELETE /growdent/friendships/delete?studentId=1&friendId=2
     Löscht die Freundschaft zwischen Student 1 und Student 2.
     */
    @DeleteMapping("/delete")
    public void deleteFriendship(@RequestParam Integer studentId, @RequestParam Integer friendId) {
        friendshipService.deleteFriendship(studentId, friendId);
    }
}
