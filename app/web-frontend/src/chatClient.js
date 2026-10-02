import { Client } from "@stomp/stompjs";
import backendURL from "./backendURL";

// WebSocketConfig registriert den STOMP-Endpoint unter "/ws" (ohne den
// "/growdent"-Präfix, den die REST-Controller haben), daher hier separat ableiten.
function wsURL() {
    return backendURL().replace("/growdent", "").replace(/^http/, "ws") + "/ws";
}

let client = null;
function getClient() {
    if (!client) {
        client = new Client({ brokerURL: wsURL(), reconnectDelay: 5000 });
        client.activate();
    }
    return client;
}

// Abonniert /topic/room/{roomId} (siehe ChatController/ChatApiController im Backend).
// Falls die Verbindung noch nicht steht, wird das Abonnement automatisch
// nachgeholt, sobald sie aufgebaut ist. Gibt eine Unsubscribe-Funktion zurück.
export function subscribeRoom(roomId, onMessage) {
    const c = getClient();
    let sub = null;
    let cancelled = false;

    const attach = () => {
        if (cancelled) return;
        sub = c.subscribe("/topic/room/" + roomId, (frame) => onMessage(JSON.parse(frame.body)));
    };

    if (c.connected) {
        attach();
    } else {
        const prevOnConnect = c.onConnect;
        c.onConnect = (frame) => {
            if (prevOnConnect) prevOnConnect(frame);
            attach();
        };
    }

    return () => {
        cancelled = true;
        if (sub) sub.unsubscribe();
    };
}
