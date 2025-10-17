 
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './notificationService';
import { supabase } from '@/lib/supabase';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = NotificationService.getInstance();
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification with all required fields', async () => {
      const mockNotification = {
        id: '123',
        user_id: 'user-1',
        company_id: 'company-1',
        title: 'Test Notification',
        message: 'This is a test',
        type: 'info' as const,
        category: 'system' as const,
        priority: 'normal' as const,
        read: false,
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.createNotification({
        user_id: 'user-1',
        company_id: 'company-1',
        title: 'Test Notification',
        message: 'This is a test',
        type: 'info',
        category: 'system',
        priority: 'normal',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotification);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      const result = await service.createNotification({
        user_id: 'user-1',
        title: 'Test',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                count: 5,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.getUnreadCount('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(5);
    });

    it('should return 0 if no unread notifications', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                count: 0,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.getUnreadCount('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockUpdatedNotification = {
        id: '123',
        read: true,
        read_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedNotification,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.markAsRead('123');

      expect(result.success).toBe(true);
      expect(result.data?.read).toBe(true);
    });
  });

  describe('notifyCompany', () => {
    it('should create notifications for all company users', async () => {
      const mockUserCompanies = [
        { user_id: 'user-1' },
        { user_id: 'user-2' },
        { user_id: 'user-3' },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockUserCompanies,
                error: null,
              }),
            }),
          } as any;
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: null,
                count: 3,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await service.notifyCompany(
        'company-1',
        'Company Alert',
        'Important message'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should handle empty company', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await service.notifyCompany(
        'company-1',
        'Test',
        'Test'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });
  });
});
