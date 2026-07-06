import { Injectable } from '@angular/core';
import * as Ably from 'ably';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
/**
 * @summary Service that manages Ably connection state, channel subscriptions,
 * and automatic synchronization upon reconnection.
 * @author Jesús Iván Castillo Vidal
 */
export class RealtimeService {
  private client: Ably.Realtime | null = null;
  private activeSubscriptions = new Map<string, { channel: any; callback: any }>();
  private wasDisconnected = false;

  /** Observable that emits when Ably recovers from a disconnect/suspend state */
  readonly reconnect$ = new Subject<void>();

  /** Checks if the Ably client is connected */
  isConnected(): boolean {
    return this.client?.connection.state === 'connected';
  }

  /** Lazy initialization of the Ably Realtime client */
  connect(): void {
    if (this.client) return;
    
    console.log('[RealtimeService] Initializing Ably connection...');
    this.client = new Ably.Realtime({
      key: environment.ablyKey,
      autoConnect: true
    });

    this.client.connection.on((stateChange) => {
      console.log(`[RealtimeService] Ably connection state changed to: ${stateChange.current}`);
      if (stateChange.current === 'connected') {
        if (this.wasDisconnected) {
          console.log('[RealtimeService] Connection restored. Triggering state re-sync.');
          this.reconnect$.next();
          this.wasDisconnected = false;
        }
      } else if (stateChange.current === 'disconnected' || stateChange.current === 'suspended') {
        this.wasDisconnected = true;
      }
    });
  }

  /** Clears all subscriptions and closes the Ably connection */
  disconnect(): void {
    if (!this.client) return;
    
    console.log('[RealtimeService] Disconnecting and cleaning up Ably...');
    try {
      this.activeSubscriptions.forEach((sub, key) => {
        const parts = key.split('::');
        const eventName = parts[1];
        sub.channel.unsubscribe(eventName, sub.callback);
      });
    } catch (e) {
      console.error('[RealtimeService] Error cleaning up subscriptions:', e);
    }
    
    this.activeSubscriptions.clear();
    this.client.close();
    this.client = null;
    this.wasDisconnected = false;
  }

  /** Subscribes to a specific event on a channel */
  subscribe(channelName: string, eventName: string, callback: (message: any) => void): void {
    this.connect();
    const channel = this.client!.channels.get(channelName);
    const key = `${channelName}::${eventName}`;

    if (this.activeSubscriptions.has(key)) {
      console.warn(`[RealtimeService] Subscription for ${key} already exists. Skipping.`);
      return;
    }

    const wrappedCallback = (msg: any) => {
      console.log(`[RealtimeService] Event received [${channelName} -> ${eventName}]:`, msg.data);
      callback(msg);
    };

    channel.subscribe(eventName, wrappedCallback);
    this.activeSubscriptions.set(key, { channel, callback: wrappedCallback });
  }

  /** Unsubscribes from a specific event on a channel */
  unsubscribe(channelName: string, eventName: string): void {
    const key = `${channelName}::${eventName}`;
    const sub = this.activeSubscriptions.get(key);
    if (sub) {
      sub.channel.unsubscribe(eventName, sub.callback);
      this.activeSubscriptions.delete(key);
    }
  }

  /** Detaches a channel and unsubscribes all events on it */
  unsubscribeChannel(channelName: string): void {
    if (!this.client) return;
    
    try {
      const channel = this.client.channels.get(channelName);
      for (const key of Array.from(this.activeSubscriptions.keys())) {
        if (key.startsWith(`${channelName}::`)) {
          const sub = this.activeSubscriptions.get(key);
          if (sub) {
            const eventName = key.split('::')[1];
            sub.channel.unsubscribe(eventName, sub.callback);
          }
          this.activeSubscriptions.delete(key);
        }
      }
      channel.detach();
    } catch (e) {
      console.error(`[RealtimeService] Error detaching channel ${channelName}:`, e);
    }
  }
}
