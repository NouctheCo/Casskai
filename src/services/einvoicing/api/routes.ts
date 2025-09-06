// @ts-nocheck
/**
 * E-invoicing API Routes
 * Express.js routes for e-invoicing endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { EInvoicingAPI, APIResponse } from './EInvoicingAPI';
import { 
  EInvoiceLifecycleStatus, 
  EInvoiceFormat, 
  EInvoiceChannel,
  EInvoicingError 
} from '../../../types/einvoicing.types';

export interface AuthenticatedRequest extends Request {
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

// Create router
const router = Router();

// Middleware for authentication and company extraction
const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, you would verify JWT token here
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid authentication',
      timestamp: new Date().toISOString(),
      request_id: `req_${Date.now()}`
    });
  }
};

// Middleware to extract and validate company ID
const extractCompanyId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const companyId = req.params.companyId || req.query.company_id || req.body.company_id;
  
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
const validateSubmissionRequest = (req: Request, res: Response, next: NextFunction) => {
  const { invoice_id } = req.body;
  
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
const handleAPIResponse = (apiCall: Promise<APIResponse>) => {
  return async (req: Request, res: Response) => {
    try {
      const result = await apiCall;
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
  handleAPIResponse(async (req: AuthenticatedRequest, res: Response) => {
    const { invoice_id, format, channel, async, validate, archive } = req.body;
    const requestId = req.headers['x-request-id'] as string;

    return einvoicingAPI.submitInvoice(
      invoice_id,
      req.companyId!,
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
  handleAPIResponse(async (req: AuthenticatedRequest, res: Response) => {
    const { documentId } = req.params;
    const requestId = req.headers['x-request-id'] as string;

    return einvoicingAPI.getDocumentStatus(
      documentId,
      req.companyId!,
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
  handleAPIResponse(async (req: AuthenticatedRequest, res: Response) => {
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

    return einvoicingAPI.listDocuments(
      req.companyId!,
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
  handleAPIResponse(async (req: AuthenticatedRequest, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;

    return einvoicingAPI.getCapabilities(
      req.companyId!,
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
  handleAPIResponse(async (req: AuthenticatedRequest, res: Response) => {
    const { date_from, date_to } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    return einvoicingAPI.getStatistics(
      req.companyId!,
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
  handleAPIResponse(async (req: AuthenticatedRequest, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;

    return einvoicingAPI.enableEInvoicing(
      req.companyId!,
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
  handleAPIResponse(async (req: AuthenticatedRequest, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;

    return einvoicingAPI.disableEInvoicing(
      req.companyId!,
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
  handleAPIResponse(async (req: Request, res: Response) => {
    const { message_id, status, reason } = req.body;
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
router.get('/einvoicing/health', (req: Request, res: Response) => {
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
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
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
    request_id: req.headers['x-request-id'] || `req_${Date.now()}`
  });
});

export { router as einvoicingRoutes };

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