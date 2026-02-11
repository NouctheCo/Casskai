/**
 * Service de gestion Supabase Realtime (Websockets)
 * Permet d'écouter les changements DB en temps réel
 *
 * @module realtimeService
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeTable =
  | 'invoices'
  | 'payments'
  | 'journal_entries'
  | 'bank_transactions'
  | 'clients'
  | 'suppliers';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface RealtimeChangePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  table: string;
  schema: string;
  commit_timestamp: string;
}

/**
 * Service de gestion Supabase Realtime
 * Simplifie la création de subscriptions aux changements DB
 */
class RealtimeService {
  private activeChannels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe aux changements d'une table
   *
   * @example
   * const subscription = realtimeService.subscribe({
   *   table: 'invoices',
   *   event: '*',
   *   filter: 'company_id=eq.123',
   *   callback: (payload) => {
   *     console.log('Invoice changed:', payload);
   *   }
   * });
   *
   * // Cleanup
   * subscription.unsubscribe();
   */
  subscribe<T = any>(config: {
    table: RealtimeTable;
    event?: RealtimeEvent;
    filter?: string; // Ex: "company_id=eq.123"
    callback: (payload: RealtimeChangePayload<T>) => void;
    channelName?: string;
  }): RealtimeSubscription {
    const {
      table,
      event = '*',
      filter,
      callback,
      channelName = `${table}-${event}-${Date.now()}`
    } = config;

    // Vérifier si channel existe déjà
    if (this.activeChannels.has(channelName)) {
      console.warn(`Channel ${channelName} already exists, reusing it`);
      return {
        channel: this.activeChannels.get(channelName)!,
        unsubscribe: () => this.unsubscribe(channelName)
      };
    }

    // Créer nouveau channel
    const channel = supabase.channel(channelName);

    // Configurer subscription
    const subscription = channel.on(
      'postgres_changes' as any,
      {
        event,
        schema: 'public',
        table,
        ...(filter && { filter })
      } as any,
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          table: payload.table,
          schema: payload.schema,
          commit_timestamp: payload.commit_timestamp
        });
      }
    );

    // Subscribe au channel
    subscription.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to ${table} (channel: ${channelName})`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error subscribing to ${table}`);
      } else if (status === 'TIMED_OUT') {
        console.error(`⏱️ Timeout subscribing to ${table}`);
      }
    });

    // Stocker channel actif
    this.activeChannels.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Subscribe à plusieurs tables en une fois
   *
   * @example
   * const subscription = realtimeService.subscribeMultiple([
   *   { table: 'invoices', event: '*', callback: handleInvoiceChange },
   *   { table: 'payments', event: '*', callback: handlePaymentChange }
   * ], 'dashboard-channel');
   */
  subscribeMultiple<T = any>(
    subscriptions: Array<{
      table: RealtimeTable;
      event?: RealtimeEvent;
      filter?: string;
      callback: (payload: RealtimeChangePayload<T>) => void;
    }>,
    channelName: string = `multi-${Date.now()}`
  ): RealtimeSubscription {
    // Vérifier si channel existe déjà
    if (this.activeChannels.has(channelName)) {
      console.warn(`Channel ${channelName} already exists, reusing it`);
      return {
        channel: this.activeChannels.get(channelName)!,
        unsubscribe: () => this.unsubscribe(channelName)
      };
    }

    // Créer channel unique pour toutes les subscriptions
    const channel = supabase.channel(channelName);

    // Ajouter chaque subscription au channel
    subscriptions.forEach(({ table, event = '*', filter, callback }) => {
      channel.on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter })
        } as any,
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema,
            commit_timestamp: payload.commit_timestamp
          });
        }
      );
    });

    // Subscribe au channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to ${subscriptions.length} tables (channel: ${channelName})`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error subscribing to multiple tables`);
      } else if (status === 'TIMED_OUT') {
        console.error(`⏱️ Timeout subscribing to multiple tables`);
      }
    });

    // Stocker channel actif
    this.activeChannels.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Unsubscribe d'un channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.activeChannels.get(channelName);

    if (channel) {
      supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    } else {
      console.warn(`Channel ${channelName} not found`);
    }
  }

  /**
   * Unsubscribe de tous les channels actifs
   */
  unsubscribeAll(): void {
    this.activeChannels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    });

    this.activeChannels.clear();
  }

  /**
   * Obtenir le nombre de channels actifs
   */
  getActiveChannelsCount(): number {
    return this.activeChannels.size;
  }

  /**
   * Obtenir la liste des channels actifs
   */
  getActiveChannels(): string[] {
    return Array.from(this.activeChannels.keys());
  }

  /**
   * Vérifier si un channel est actif
   */
  isChannelActive(channelName: string): boolean {
    return this.activeChannels.has(channelName);
  }

  /**
   * Obtenir un channel actif
   */
  getChannel(channelName: string): RealtimeChannel | undefined {
    return this.activeChannels.get(channelName);
  }
}

// Singleton
export const realtimeService = new RealtimeService();

/**
 * Helper pour créer un channel name unique
 */
export function createChannelName(
  prefix: string,
  companyId: string,
  suffix?: string
): string {
  const parts = [prefix, companyId];
  if (suffix) parts.push(suffix);
  return parts.join('-');
}

/**
 * Helper pour créer un filter RLS Supabase
 */
export function createCompanyFilter(companyId: string): string {
  return `company_id=eq.${companyId}`;
}

/**
 * Debounce helper pour éviter trop de refreshes
 */
export function debounceRealtimeCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
}
