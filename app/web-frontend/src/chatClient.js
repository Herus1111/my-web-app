import { Client } from "@stomp/stompjs";
import backendURL from "./backendURL";

function wsURL() {
    return backendURL().replace("/growdent", "").replace(/^http/, "ws") + "/ws";
}

let client = null;
const pendingSubscriptions = new Map();

function ensureClient() {
    if (!client) {
        client = new Client({ brokerURL: wsURL(), reconnectDelay: 5000, onConnect: () => {
            pendingSubscriptions.forEach((cb, roomId) => {
                const sub = client.subscribe("/topic/room/" + roomId, (frame) => cb(JSON.parse(frame.body)));
                pendingSubscriptions.set(roomId, { callback: cb, subscription: sub });
            });
        } });
        client.activate();
    }
    return client;
}

export function subscribeRoom(roomId, onMessage) {
    const c = ensureClient();

    if (pendingSubscriptions.has(roomId)) {
        const prev = pendingSubscriptions.get(roomId);
        if (prev && prev.callback !== onMessage) {
            prev.subscription?.unsubscribe();
            pendingSubscriptions.set(roomId, { callback: onMessage, subscription: null });
        }
    }

    if (c.connected) {
        const existing = pendingSubscriptions.get(roomId);
        if (existing && existing.subscription) {
            existing.callback = onMessage;
            return () => {
                existing.subscription.unsubscribe();
                pendingSubscriptions.delete(roomId);
            };
        }

        const sub = c.subscribe("/topic/room/" + roomId, (frame) => onMessage(JSON.parse(frame.body)));
        pendingSubscriptions.set(roomId, { callback: onMessage, subscription: sub });
        return () => {
            sub.unsubscribe();
            pendingSubscriptions.delete(roomId);
        };
    }

    pendingSubscriptions.set(roomId, { callback: onMessage, subscription: null });

    return () => {
        const existing = pendingSubscriptions.get(roomId);
        if (existing && existing.subscription) {
            existing.subscription.unsubscribe();
        }
        pendingSubscriptions.delete(roomId);
    };
}
