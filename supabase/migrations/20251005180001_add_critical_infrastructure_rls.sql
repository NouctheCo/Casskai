-- =====================================================
-- CRITICAL INFRASTRUCTURE RLS POLICIES
-- Migration: 20251005180001
-- Description: Row Level Security for notifications, audit_logs, webhooks, api_keys, support_tickets, file_uploads
-- =====================================================

-- ============================================================================
-- 1. NOTIFICATIONS RLS
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- System can create notifications (service role)
CREATE POLICY "Service role can manage notifications"
    ON public.notifications
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 2. AUDIT LOGS RLS
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for their companies
CREATE POLICY "Users can view company audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

-- Only service role can insert/update audit logs
CREATE POLICY "Service role can manage audit logs"
    ON public.audit_logs
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 3. WEBHOOKS RLS
-- ============================================================================

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company webhooks"
    ON public.webhooks
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create company webhooks"
    ON public.webhooks
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins can update company webhooks"
    ON public.webhooks
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins can delete company webhooks"
    ON public.webhooks
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- 4. WEBHOOK DELIVERIES RLS
-- ============================================================================

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook deliveries for their webhooks"
    ON public.webhook_deliveries
    FOR SELECT
    USING (
        webhook_id IN (
            SELECT id FROM public.webhooks
            WHERE company_id IN (
                SELECT company_id FROM public.user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- Service role can manage deliveries
CREATE POLICY "Service role can manage webhook deliveries"
    ON public.webhook_deliveries
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 5. API KEYS RLS
-- ============================================================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company API keys"
    ON public.api_keys
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create company API keys"
    ON public.api_keys
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Admins can update company API keys"
    ON public.api_keys
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins can delete company API keys"
    ON public.api_keys
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- 6. API USAGE LOGS RLS
-- ============================================================================

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company API usage"
    ON public.api_usage_logs
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

-- Service role can insert usage logs
CREATE POLICY "Service role can manage API usage logs"
    ON public.api_usage_logs
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 7. SUPPORT TICKETS RLS
-- ============================================================================

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company tickets"
    ON public.support_tickets
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tickets for their company"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Ticket creators can update their tickets"
    ON public.support_tickets
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Support staff can manage all tickets (via service role or custom role)
CREATE POLICY "Service role can manage all tickets"
    ON public.support_tickets
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 8. SUPPORT TICKET MESSAGES RLS
-- ============================================================================

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their company tickets"
    ON public.support_ticket_messages
    FOR SELECT
    USING (
        NOT is_internal
        AND ticket_id IN (
            SELECT id FROM public.support_tickets
            WHERE company_id IN (
                SELECT company_id FROM public.user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create messages on their tickets"
    ON public.support_ticket_messages
    FOR INSERT
    WITH CHECK (
        ticket_id IN (
            SELECT id FROM public.support_tickets
            WHERE company_id IN (
                SELECT company_id FROM public.user_companies
                WHERE user_id = auth.uid()
            )
        )
        AND user_id = auth.uid()
        AND is_internal = false
    );

-- Service role can manage all messages
CREATE POLICY "Service role can manage all ticket messages"
    ON public.support_ticket_messages
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 9. FILE UPLOADS RLS
-- ============================================================================

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company files"
    ON public.file_uploads
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files for their company"
    ON public.file_uploads
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can delete their own uploads"
    ON public.file_uploads
    FOR DELETE
    USING (
        uploaded_by = auth.uid()
        AND company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

-- Admins can delete company files
CREATE POLICY "Admins can delete company files"
    ON public.file_uploads
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_company_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_category TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        company_id,
        type,
        category,
        priority,
        title,
        message,
        action_url,
        metadata
    ) VALUES (
        p_user_id,
        p_company_id,
        p_type,
        p_category,
        p_priority,
        p_title,
        p_message,
        p_action_url,
        p_metadata
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_company_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        company_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        metadata,
        status
    ) VALUES (
        p_company_id,
        p_user_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_metadata,
        'success'
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger webhooks
CREATE OR REPLACE FUNCTION public.trigger_webhooks(
    p_company_id UUID,
    p_event_type TEXT,
    p_event_id UUID,
    p_payload JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_webhook RECORD;
    v_delivery_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Find all active webhooks for this company and event
    FOR v_webhook IN
        SELECT * FROM public.webhooks
        WHERE company_id = p_company_id
          AND is_active = true
          AND p_event_type = ANY(events)
    LOOP
        -- Create delivery record
        INSERT INTO public.webhook_deliveries (
            webhook_id,
            event_type,
            event_id,
            payload,
            request_url,
            status
        ) VALUES (
            v_webhook.id,
            p_event_type,
            p_event_id,
            p_payload,
            v_webhook.url,
            'pending'
        )
        RETURNING id INTO v_delivery_id;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies created successfully for:';
    RAISE NOTICE '   - notifications';
    RAISE NOTICE '   - audit_logs';
    RAISE NOTICE '   - webhooks + webhook_deliveries';
    RAISE NOTICE '   - api_keys + api_usage_logs';
    RAISE NOTICE '   - support_tickets + support_ticket_messages';
    RAISE NOTICE '   - file_uploads';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Helper functions created:';
    RAISE NOTICE '   - create_notification()';
    RAISE NOTICE '   - log_audit_event()';
    RAISE NOTICE '   - trigger_webhooks()';
END $$;
