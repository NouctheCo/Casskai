-- =====================================================
-- CRITICAL INFRASTRUCTURE TABLES
-- Migration: 20251005180000
-- Description: Add notifications, audit_logs, webhooks, api_keys, support_tickets
-- =====================================================

-- ============================================================================
-- DROP EXISTING TABLES WITH WRONG STRUCTURE
-- ============================================================================
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.webhooks CASCADE;
DROP TABLE IF EXISTS public.webhook_deliveries CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.api_usage_logs CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.support_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.file_uploads CASCADE;

-- ============================================================================
-- 1. NOTIFICATIONS (Real-time notifications for users)
-- ============================================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Notification details
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'alert')),
    category TEXT CHECK (category IN ('system', 'invoice', 'payment', 'expense', 'approval', 'reminder', 'security')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Rich content
    metadata JSONB DEFAULT '{}',
    action_url TEXT,
    action_label TEXT,

    -- Status
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,

    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(user_id, priority) WHERE NOT read AND NOT archived;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. AUDIT LOGS (Complete activity tracking)
-- ============================================================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Action details
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'SEND', 'RECEIVE')),
    entity_type TEXT NOT NULL, -- 'invoice', 'payment', 'user', 'company', etc.
    entity_id UUID,

    -- Changes tracking
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT,

    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    request_method TEXT,
    request_path TEXT,

    -- Status
    status TEXT CHECK (status IN ('success', 'failure', 'pending')),
    error_message TEXT,

    -- Additional context
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Partition by date for performance (optional, for large volumes)
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin ON public.audit_logs USING brin(created_at);

-- ============================================================================
-- 3. WEBHOOKS (Outbound webhooks for integrations)
-- ============================================================================
CREATE TABLE public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Webhook configuration
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    secret_key TEXT NOT NULL, -- For HMAC signature

    -- Events to listen to
    events TEXT[] NOT NULL, -- ['invoice.created', 'payment.received', 'expense.approved']

    -- Filtering
    filters JSONB DEFAULT '{}', -- Additional filtering rules

    -- Retry configuration
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
    timeout_seconds INTEGER NOT NULL DEFAULT 30,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_count INTEGER NOT NULL DEFAULT 0,

    -- Headers (custom HTTP headers)
    custom_headers JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_webhooks_company_id ON public.webhooks(company_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON public.webhooks(company_id, is_active) WHERE is_active = true;

CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON public.webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. WEBHOOK DELIVERIES (Webhook execution logs)
-- ============================================================================
CREATE TABLE public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,

    -- Event details
    event_type TEXT NOT NULL,
    event_id UUID,
    payload JSONB NOT NULL,

    -- Request details
    request_url TEXT NOT NULL,
    request_headers JSONB,
    request_body JSONB,

    -- Response details
    response_status_code INTEGER,
    response_headers JSONB,
    response_body TEXT,

    -- Execution
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    error_message TEXT,
    duration_ms INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON public.webhook_deliveries(event_type, event_id);

-- ============================================================================
-- 5. API KEYS (For Enterprise plan API access)
-- ============================================================================
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Key details
    name TEXT NOT NULL,
    description TEXT,
    key_prefix TEXT NOT NULL UNIQUE, -- First 8 chars visible to user (e.g., "sk_live_")
    key_hash TEXT NOT NULL UNIQUE, -- Hashed full key (never store plaintext)

    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT '{}', -- ['invoices:read', 'invoices:write', 'payments:read']
    allowed_ips TEXT[], -- IP whitelist (optional)

    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count BIGINT NOT NULL DEFAULT 0,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revoke_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_keys_company_id ON public.api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(company_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. API USAGE LOGS (Track API calls for billing and monitoring)
-- ============================================================================
CREATE TABLE public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Request details
    method TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_size_bytes INTEGER,

    -- Response details
    status_code INTEGER NOT NULL,
    response_size_bytes INTEGER,
    response_time_ms INTEGER,

    -- Client info
    ip_address INET,
    user_agent TEXT,

    -- Rate limiting
    rate_limit_remaining INTEGER,

    -- Errors
    error_code TEXT,
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON public.api_usage_logs(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_company_id ON public.api_usage_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);

-- ============================================================================
-- 7. SUPPORT TICKETS (Integrated customer support)
-- ============================================================================
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL, -- Human-readable (e.g., "TKT-2025-0001")

    -- Ownership
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Ticket details
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('bug', 'feature_request', 'question', 'billing', 'technical', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'waiting_internal', 'resolved', 'closed')),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]', -- [{url, name, size, type}]
    metadata JSONB DEFAULT '{}',

    -- Resolution
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- SLA tracking
    first_response_at TIMESTAMPTZ,
    first_response_sla_breach BOOLEAN DEFAULT false,
    resolution_sla_deadline TIMESTAMPTZ,
    resolution_sla_breach BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Generate ticket number automatically
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    ticket_num TEXT;
BEGIN
    SELECT nextval('support_ticket_number_seq') INTO next_num;
    ticket_num := 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_support_ticket_number
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON public.support_tickets(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON public.support_tickets(ticket_number);

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 8. SUPPORT TICKET MESSAGES (Conversation thread)
-- ============================================================================
CREATE TABLE public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,

    -- Author
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL, -- Fallback if user deleted
    author_email TEXT,
    is_staff BOOLEAN NOT NULL DEFAULT false,

    -- Message content
    message TEXT NOT NULL,
    message_html TEXT, -- Rich text version

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Status updates
    status_change_from TEXT,
    status_change_to TEXT,

    -- Visibility
    is_internal BOOLEAN NOT NULL DEFAULT false, -- Internal notes not visible to customer

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_user_id ON public.support_ticket_messages(user_id);

-- ============================================================================
-- 9. FILE UPLOADS (Centralized file management)
-- ============================================================================
CREATE TABLE public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- File details
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage bucket
    file_url TEXT, -- Public URL if applicable

    -- Metadata
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_hash TEXT, -- SHA-256 for deduplication

    -- Classification
    entity_type TEXT, -- 'invoice', 'expense', 'contract', 'ticket', etc.
    entity_id UUID,
    category TEXT, -- 'document', 'image', 'attachment', 'export'

    -- Storage
    storage_bucket TEXT NOT NULL DEFAULT 'company-files',
    is_public BOOLEAN NOT NULL DEFAULT false,

    -- Virus scanning
    virus_scan_status TEXT CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed')),
    virus_scan_at TIMESTAMPTZ,

    -- Lifecycle
    expires_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_company_id ON public.file_uploads(company_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON public.file_uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_hash ON public.file_uploads(file_hash) WHERE file_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON public.file_uploads(uploaded_by);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'Real-time notifications for users';
COMMENT ON TABLE public.audit_logs IS 'Complete audit trail of all system actions';
COMMENT ON TABLE public.webhooks IS 'Outbound webhooks configuration for integrations';
COMMENT ON TABLE public.webhook_deliveries IS 'Webhook execution logs and delivery status';
COMMENT ON TABLE public.api_keys IS 'API keys for Enterprise plan programmatic access';
COMMENT ON TABLE public.api_usage_logs IS 'API usage tracking for billing and monitoring';
COMMENT ON TABLE public.support_tickets IS 'Customer support ticket system';
COMMENT ON TABLE public.support_ticket_messages IS 'Support ticket conversation messages';
COMMENT ON TABLE public.file_uploads IS 'Centralized file upload management';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Critical infrastructure tables created successfully:';
    RAISE NOTICE '   - notifications (real-time alerts)';
    RAISE NOTICE '   - audit_logs (complete tracking)';
    RAISE NOTICE '   - webhooks + webhook_deliveries';
    RAISE NOTICE '   - api_keys + api_usage_logs';
    RAISE NOTICE '   - support_tickets + support_ticket_messages';
    RAISE NOTICE '   - file_uploads (centralized storage)';
END $$;
