import { Client } from "@stomp/stompjs";
import backendURL from "./backendURL";

function wsURL() {
    const apiUrl = backendURL();
    return apiUrl.replace(/^http/, "ws") + "/ws";
}

let client = null;
const pendingSubscriptions = new Map();

function ensureClient() {
    if (!client) {
        client = new Client({
            brokerURL: wsURL(),
            reconnectDelay: 5000,
            onConnect: () => {
                pendingSubscriptions.forEach((entry, roomId) => {
                    if (entry.subscription) return;

                    const sub = client.subscribe("/topic/room/" + roomId, (frame) => {
                        try {
                            entry.callback(JSON.parse(frame.body));
                        } catch (error) {
                            console.error("Chat message parse error", error);
                        }
                    });

                    pendingSubscriptions.set(roomId, { ...entry, subscription: sub });
                });
            },
        });
        client.activate();
    }
    return client;
}

export function subscribeRoom(roomId, onMessage) {
    const c = ensureClient();

    const existing = pendingSubscriptions.get(roomId);
    if (existing && existing.callback !== onMessage) {
        existing.subscription?.unsubscribe();
        pendingSubscriptions.set(roomId, { callback: onMessage, subscription: null });
    }

    if (c.connected) {
        const active = pendingSubscriptions.get(roomId);
        if (active && active.subscription) {
            active.callback = onMessage;
            return () => {
                active.subscription.unsubscribe();
                pendingSubscriptions.delete(roomId);
            };
        }

        const sub = c.subscribe("/topic/room/" + roomId, (frame) => {
            try {
                onMessage(JSON.parse(frame.body));
            } catch (error) {
                console.error("Chat message parse error", error);
            }
        });

        pendingSubscriptions.set(roomId, { callback: onMessage, subscription: sub });

        return () => {
            sub.unsubscribe();
            pendingSubscriptions.delete(roomId);
        };
    }

    const entry = pendingSubscriptions.get(roomId) || { callback: onMessage, subscription: null };
    entry.callback = onMessage;
    pendingSubscriptions.set(roomId, entry);

    return () => {
        const current = pendingSubscriptions.get(roomId);
        if (current?.subscription) {
            current.subscription.unsubscribe();
        }
        pendingSubscriptions.delete(roomId);
    };
}
