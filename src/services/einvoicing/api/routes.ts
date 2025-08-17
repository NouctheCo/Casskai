/* eslint-disable max-lines-per-function */
/**
 * E-invoicing API Routes (server-side only)
 * Framework-agnostic wiring: pass in a Router-like instance to attach routes.
 */

// Minimal interfaces to avoid hard dependency on Express types
interface MinimalRequest {
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
}

interface MinimalResponse {
  status: (code: number) => { json: (body: unknown) => void };
  json: (body: unknown) => void;
}

type MinimalNextFunction = () => void;

interface MinimalRouter {
  get: (
    path: string,
    ...handlers: Array<(
      req: AuthenticatedRequest,
      res: MinimalResponse,
      next: MinimalNextFunction
    ) => unknown>
  ) => unknown;
  post: (
    path: string,
    ...handlers: Array<(
      req: AuthenticatedRequest,
      res: MinimalResponse,
      next: MinimalNextFunction
    ) => unknown>
  ) => unknown;
  use: (...args: unknown[]) => unknown;
}
import { EInvoicingAPI, APIResponse } from './EInvoicingAPI';
import { 
  EInvoiceLifecycleStatus, 
  EInvoiceFormat, 
  EInvoiceChannel,
  EInvoicingError 
} from '@/types/einvoicing.types';

export interface AuthenticatedRequest extends MinimalRequest {
  user?: {
    id: string;
    email: string;
  };
  companyId?: string;
}

// Initialize API service
const einvoicingAPI = new EInvoicingAPI({
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000
  }
});

// Create a setup function to attach routes to a provided router (Express/Koa-like)
export function setupEInvoicingRoutes(router: MinimalRouter) {

// Middleware for authentication and company extraction
const authenticate = async (req: AuthenticatedRequest, res: MinimalResponse, next: MinimalNextFunction) => {
  try {
    // In a real implementation, you would verify JWT token here
  const rawAuth = req.headers.authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
        request_id: `req_${Date.now()}`
      });
    }

    // Extract user info from token (mock implementation)
    req.user = {
      id: 'user_123', // Would come from JWT
      email: 'user@example.com'
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid authentication',
      timestamp: new Date().toISOString(),
      request_id: `req_${Date.now()}`
    });
  }
};

// Middleware to extract and validate company ID
const extractCompanyId = (req: AuthenticatedRequest, res: MinimalResponse, next: MinimalNextFunction) => {
  const companyId = req.params.companyId || (req.query.company_id as string | undefined) || (req.body.company_id as string | undefined);
  
  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID is required',
      timestamp: new Date().toISOString(),
      request_id: `req_${Date.now()}`
    });
  }

  req.companyId = companyId as string;
  next();
};

// Middleware for request validation
const validateSubmissionRequest = (req: MinimalRequest, res: MinimalResponse, next: MinimalNextFunction) => {
  const { invoice_id } = req.body as { invoice_id?: string };
  
  if (!invoice_id) {
    return res.status(400).json({
      success: false,
      error: 'invoice_id is required',
      timestamp: new Date().toISOString(),
      request_id: `req_${Date.now()}`
    });
  }

  next();
};

// Error handler middleware
const handleAPIResponse = <T>(apiCallFactory: (req: AuthenticatedRequest, res: MinimalResponse) => Promise<APIResponse<T>>) => {
  return async (req: AuthenticatedRequest, res: MinimalResponse) => {
    try {
      const result = await apiCallFactory(req, res);
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('API route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        request_id: `req_${Date.now()}`
      });
    }
  };
};

// Routes

/**
 * Submit invoice for e-invoicing
 * POST /api/v1/companies/:companyId/einvoicing/submit
 */
router.post(
  '/companies/:companyId/einvoicing/submit',
  authenticate,
  extractCompanyId,
  validateSubmissionRequest,
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const { invoice_id, format, channel, async, validate, archive } = req.body as {
      invoice_id: string;
      format?: EInvoiceFormat;
      channel?: EInvoiceChannel;
      async?: boolean;
      validate?: boolean;
      archive?: boolean;
    };
    const requestId = req.headers['x-request-id'] as string;
    const companyId = req.companyId ?? (() => { throw new EInvoicingError('Company ID is required', 'BAD_REQUEST'); })();

    return einvoicingAPI.submitInvoice(
      invoice_id,
      companyId,
      { format, channel, async, validate, archive },
      requestId
    );
  })
);

/**
 * Get document status
 * GET /api/v1/companies/:companyId/einvoicing/documents/:documentId
 */
router.get(
  '/companies/:companyId/einvoicing/documents/:documentId',
  authenticate,
  extractCompanyId,
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const { documentId } = req.params;
    const requestId = req.headers['x-request-id'] as string;

    const companyId = req.companyId ?? (() => { throw new EInvoicingError('Company ID is required', 'BAD_REQUEST'); })();
    return einvoicingAPI.getDocumentStatus(
      documentId,
      companyId,
      requestId
    );
  })
);

/**
 * List company documents
 * GET /api/v1/companies/:companyId/einvoicing/documents
 */
router.get(
  '/companies/:companyId/einvoicing/documents',
  authenticate,
  extractCompanyId,
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sort: req.query.sort as string,
      order: req.query.order as 'asc' | 'desc'
    };

    const filters = {
      status: req.query.status as EInvoiceLifecycleStatus,
      format: req.query.format as EInvoiceFormat,
      channel: req.query.channel as EInvoiceChannel,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string
    };

    const requestId = req.headers['x-request-id'] as string;

    const companyId = req.companyId ?? (() => { throw new EInvoicingError('Company ID is required', 'BAD_REQUEST'); })();
    return einvoicingAPI.listDocuments(
      companyId,
      pagination,
      filters,
      requestId
    );
  })
);

/**
 * Get e-invoicing capabilities
 * GET /api/v1/companies/:companyId/einvoicing/capabilities
 */
router.get(
  '/companies/:companyId/einvoicing/capabilities',
  authenticate,
  extractCompanyId,
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const requestId = req.headers['x-request-id'] as string;

    const companyId = req.companyId ?? (() => { throw new EInvoicingError('Company ID is required', 'BAD_REQUEST'); })();
    return einvoicingAPI.getCapabilities(
      companyId,
      requestId
    );
  })
);

/**
 * Get e-invoicing statistics
 * GET /api/v1/companies/:companyId/einvoicing/statistics
 */
router.get(
  '/companies/:companyId/einvoicing/statistics',
  authenticate,
  extractCompanyId,
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const { date_from, date_to } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    const companyId = req.companyId ?? (() => { throw new EInvoicingError('Company ID is required', 'BAD_REQUEST'); })();
    return einvoicingAPI.getStatistics(
      companyId,
      date_from as string,
      date_to as string,
      requestId
    );
  })
);

/**
 * Enable e-invoicing for company
 * POST /api/v1/companies/:companyId/einvoicing/enable
 */
router.post(
  '/companies/:companyId/einvoicing/enable',
  authenticate,
  extractCompanyId,
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const requestId = req.headers['x-request-id'] as string;

    const companyId = req.companyId ?? (() => { throw new EInvoicingError('Company ID is required', 'BAD_REQUEST'); })();
    return einvoicingAPI.enableEInvoicing(
      companyId,
      requestId
    );
  })
);

/**
 * Disable e-invoicing for company
 * POST /api/v1/companies/:companyId/einvoicing/disable
 */
router.post(
  '/companies/:companyId/einvoicing/disable',
  authenticate,
  extractCompanyId,
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const requestId = req.headers['x-request-id'] as string;

    const companyId = req.companyId ?? (() => { throw new EInvoicingError('Company ID is required', 'BAD_REQUEST'); })();
    return einvoicingAPI.disableEInvoicing(
      companyId,
      requestId
    );
  })
);

/**
 * Webhook endpoint for status updates
 * POST /api/v1/einvoicing/webhooks/status
 */
router.post(
  '/einvoicing/webhooks/status',
  // Note: Webhooks typically don't require authentication but should verify signature
  handleAPIResponse(async (req: AuthenticatedRequest) => {
    const { message_id, status, reason } = req.body as { message_id?: string; status?: string; reason?: string };
    const requestId = req.headers['x-request-id'] as string;

    if (!message_id || !status) {
      throw new EInvoicingError('message_id and status are required', 'BAD_REQUEST');
    }

    return einvoicingAPI.updateDocumentStatus(
      message_id,
      status as EInvoiceLifecycleStatus,
      reason,
      requestId
    );
  })
);

/**
 * Health check endpoint
 * GET /api/v1/einvoicing/health
 */
router.get('/einvoicing/health', (_req: MinimalRequest, res: MinimalResponse) => {
  res.json({
    success: true,
    data: {
      service: 'e-invoicing',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString(),
    request_id: `req_${Date.now()}`
  });
});

// Error handling middleware
router.use((error: Error, req: MinimalRequest, res: MinimalResponse, _next: MinimalNextFunction) => {
  console.error('E-invoicing API error:', error);

  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  if (error instanceof EInvoicingError) {
    errorMessage = error.message;
    errorCode = error.code;
    
    // Map error codes to HTTP status codes
    switch (error.code) {
      case 'AUTH_REQUIRED':
      case 'AUTH_ERROR':
        statusCode = 401;
        break;
      case 'ACCESS_DENIED':
        statusCode = 403;
        break;
      case 'NOT_FOUND':
        statusCode = 404;
        break;
      case 'RATE_LIMIT_EXCEEDED':
        statusCode = 429;
        break;
      case 'BAD_REQUEST':
      case 'VALIDATION_ERROR':
        statusCode = 400;
        break;
      case 'FEATURE_DISABLED':
        statusCode = 403;
        break;
      default:
        statusCode = 500;
    }
  }

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    request_id: (req.headers['x-request-id'] as string) || `req_${Date.now()}`
  });
});
  return router;
}

// Export route documentation for API docs generation
export const routeDocumentation = {
  basePath: '/api/v1',
  routes: [
    {
      method: 'POST',
      path: '/companies/:companyId/einvoicing/submit',
      description: 'Submit an invoice for e-invoicing processing',
      parameters: {
        path: { companyId: 'string' },
        body: {
          invoice_id: 'string',
          format: 'FACTURX | UBL | CII (optional)',
          channel: 'PPF | PDP:* (optional)',
          async: 'boolean (optional)',
          validate: 'boolean (optional)',
          archive: 'boolean (optional)'
        }
      },
      responses: {
        200: 'Submission successful',
        400: 'Bad request',
        401: 'Authentication required',
        403: 'Feature not enabled or access denied',
        429: 'Rate limit exceeded',
        500: 'Internal server error'
      }
    },
    {
      method: 'GET',
      path: '/companies/:companyId/einvoicing/documents',
      description: 'List e-invoicing documents with pagination and filtering',
      parameters: {
        path: { companyId: 'string' },
        query: {
          page: 'number (optional)',
          limit: 'number (optional)',
          status: 'EInvoiceLifecycleStatus (optional)',
          format: 'EInvoiceFormat (optional)',
          channel: 'EInvoiceChannel (optional)',
          date_from: 'ISO date string (optional)',
          date_to: 'ISO date string (optional)'
        }
      }
    },
    {
      method: 'GET',
      path: '/companies/:companyId/einvoicing/documents/:documentId',
      description: 'Get status of a specific e-invoicing document'
    },
    {
      method: 'GET',
      path: '/companies/:companyId/einvoicing/capabilities',
      description: 'Get e-invoicing capabilities for a company'
    },
    {
      method: 'GET',
      path: '/companies/:companyId/einvoicing/statistics',
      description: 'Get e-invoicing statistics for a company'
    },
    {
      method: 'POST',
      path: '/companies/:companyId/einvoicing/enable',
      description: 'Enable e-invoicing feature for a company'
    },
    {
      method: 'POST',
      path: '/companies/:companyId/einvoicing/disable',
      description: 'Disable e-invoicing feature for a company'
    },
    {
      method: 'POST',
      path: '/einvoicing/webhooks/status',
      description: 'Webhook endpoint for receiving status updates from delivery channels'
    },
    {
      method: 'GET',
      path: '/einvoicing/health',
      description: 'Health check endpoint'
    }
  ]
};