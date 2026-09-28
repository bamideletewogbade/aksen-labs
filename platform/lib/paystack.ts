import crypto from 'node:crypto';

/**
 * Paystack Integration for Aksen Labs.
 *
 * Handles invoice checkout, Mobile Money (MTN MoMo, Telecel Cash), card payments,
 * transaction verification, and HMAC-SHA512 webhook validation.
 */

export type PaystackInitializeOptions = {
  email: string;
  amountMinor: number; // In minor units (e.g. pesewas for GHS, kobo for NGN, cents for USD)
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
};

export type PaystackInitializeResult = {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  message?: string;
};

export type PaystackVerifyResult = {
  success: boolean;
  status: 'success' | 'failed' | 'abandoned' | 'unknown';
  reference: string;
  amountMinor: number;
  currency: string;
  paidAt?: string;
  channel?: string;
  customerEmail?: string;
  gatewayResponse?: string;
  metadata?: Record<string, unknown>;
  authorization?: {
    channel?: string;
    brand?: string;
    last4?: string;
    bank?: string;
  };
  message?: string;
};

export function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY || '';
  return key.trim().replace(/^["']|["']$/g, '');
}

export function getPaystackPublicKey(): string {
  const key =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    process.env.PAYSTACK_PUBLIC_KEY ||
    '';
  return key.trim().replace(/^["']|["']$/g, '');
}

export function isPaystackConfigured(): boolean {
  return Boolean(getPaystackSecretKey());
}

export function isPaystackTestMode(): boolean {
  return getPaystackSecretKey().startsWith('sk_test_');
}

/**
 * Initialises a Paystack checkout session for an invoice or retainer.
 * Returns the hosted payment URL (https://checkout.paystack.com/...)
 */
export async function initializePaystackCheckout(
  opts: PaystackInitializeOptions,
): Promise<PaystackInitializeResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return {
      success: false,
      reference: opts.reference,
      message: 'Paystack secret key is not configured.',
    };
  }

  try {
    const payload = {
      email: opts.email,
      amount: opts.amountMinor,
      currency: opts.currency.toUpperCase(),
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata || {},
      channels: opts.channels || [
        'card',
        'mobile_money',
        'bank_transfer',
        'qr',
      ],
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    if (!response.ok || !body.status || !body.data) {
      return {
        success: false,
        reference: opts.reference,
        message: body.message || 'Paystack initialization failed.',
      };
    }

    return {
      success: true,
      authorizationUrl: body.data.authorization_url,
      accessCode: body.data.access_code,
      reference: body.data.reference,
      message: body.message,
    };
  } catch (err) {
    return {
      success: false,
      reference: opts.reference,
      message:
        err instanceof Error
          ? err.message
          : 'Network error connecting to Paystack.',
    };
  }
}

/**
 * Verifies a transaction reference directly against Paystack's REST API.
 */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return {
      success: false,
      status: 'unknown',
      reference,
      amountMinor: 0,
      currency: '',
      message: 'Paystack secret key is not configured.',
    };
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const body = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at?: string;
        channel?: string;
        gateway_response?: string;
        metadata?: Record<string, unknown> | string;
        customer?: { email?: string };
        authorization?: {
          channel?: string;
          brand?: string;
          last4?: string;
          bank?: string;
        };
      };
    };

    if (!response.ok || !body.status || !body.data) {
      return {
        success: false,
        status: 'unknown',
        reference,
        amountMinor: 0,
        currency: '',
        message: body.message || 'Verification lookup failed.',
      };
    }

    const data = body.data;
    const isPaid = data.status === 'success';

    let parsedMeta: Record<string, unknown> = {};
    if (typeof data.metadata === 'object' && data.metadata !== null) {
      parsedMeta = data.metadata as Record<string, unknown>;
    } else if (typeof data.metadata === 'string' && data.metadata.trim()) {
      try {
        parsedMeta = JSON.parse(data.metadata);
      } catch {}
    }

    return {
      success: isPaid,
      status: isPaid
        ? 'success'
        : data.status === 'failed'
          ? 'failed'
          : 'abandoned',
      reference: data.reference,
      amountMinor: data.amount,
      currency: data.currency,
      paidAt: data.paid_at,
      channel: data.channel,
      customerEmail: data.customer?.email,
      gatewayResponse: data.gateway_response,
      metadata: parsedMeta,
      authorization: data.authorization,
      message: body.message,
    };
  } catch (err) {
    return {
      success: false,
      status: 'unknown',
      reference,
      amountMinor: 0,
      currency: '',
      message:
        err instanceof Error
          ? err.message
          : 'Network error communicating with Paystack.',
    };
  }
}

/**
 * Validates the HMAC-SHA512 signature on incoming Paystack webhooks.
 * Protects against replay attacks, forged webhooks, and unauthorized state changes.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const secret = getPaystackSecretKey();
  if (!secret) return false;

  try {
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(hash, 'utf8');
    const actualBuffer = Buffer.from(signatureHeader, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

/**
 * Retrieves the live status of the Paystack merchant account,
 * checking test/live mode, currency balances, and API connectivity.
 */
export async function getPaystackAccountStatus(): Promise<{
  connected: boolean;
  mode: 'test' | 'live' | 'unconfigured';
  publicKey: string;
  currencies: string[];
  message: string;
}> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return {
      connected: false,
      mode: 'unconfigured',
      publicKey: '',
      currencies: [],
      message: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to .env.',
    };
  }

  const mode = isPaystackTestMode() ? 'test' : 'live';
  const publicKey = getPaystackPublicKey();

  try {
    const response = await fetch('https://api.paystack.co/balance', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const body = (await response.json()) as {
      status: boolean;
      message: string;
      data?: { currency: string; balance: number }[];
    };

    if (response.ok && body.status && Array.isArray(body.data)) {
      const currencies = body.data.map((b) => b.currency);
      return {
        connected: true,
        mode,
        publicKey,
        currencies,
        message: `Connected to Paystack (${mode} mode). Account active for ${currencies.join(', ')}.`,
      };
    }

    return {
      connected: false,
      mode,
      publicKey,
      currencies: [],
      message: body.message || 'Could not verify Paystack account balance.',
    };
  } catch (err) {
    return {
      connected: false,
      mode,
      publicKey,
      currencies: [],
      message:
        err instanceof Error
          ? err.message
          : 'Could not connect to Paystack API.',
    };
  }
}

/**
 * ---------------------------------------------------------------------------
 * Paystack AI Agent Tools & MCP Implementations
 * ---------------------------------------------------------------------------
 * Standardized tool calling interfaces for autonomous agents, conversational
 * assistants, and operations workflows.
 */

export const paystackAgentToolSchemas = [
  {
    name: 'paystack_initialize_payment',
    description:
      'Initialize a Paystack hosted payment checkout session for a customer order, deposit, or invoice.',
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Customer or buyer email address.',
        },
        amountMinor: {
          type: 'integer',
          description:
            'Total payment amount in minor units (e.g. 50000 pesewas = GHS 500.00, or 50000 kobo = NGN 500.00).',
        },
        currency: {
          type: 'string',
          enum: ['GHS', 'NGN', 'USD'],
          default: 'GHS',
          description: 'Payment currency code.',
        },
        reference: {
          type: 'string',
          description: 'Unique payment reference string. Auto-generated if omitted.',
        },
        description: {
          type: 'string',
          description: 'Description of items or service.',
        },
        callbackUrl: {
          type: 'string',
          description: 'Destination URL after payment completes.',
        },
      },
      required: ['email', 'amountMinor'],
    },
  },
  {
    name: 'paystack_verify_payment',
    description:
      'Verify a Paystack transaction reference to confirm live status, amount paid, channel (MoMo, card), and payment timestamp.',
    parameters: {
      type: 'object',
      properties: {
        reference: {
          type: 'string',
          description: 'The unique Paystack transaction reference string.',
        },
      },
      required: ['reference'],
    },
  },
  {
    name: 'paystack_check_balance',
    description:
      'Check Paystack merchant account status, active currencies, and available balances.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'paystack_generate_payment_link',
    description:
      'Create a hosted Paystack checkout link and draft a professional client payment communication.',
    parameters: {
      type: 'object',
      properties: {
        clientName: {
          type: 'string',
          description: 'Name of the client or recipient.',
        },
        clientEmail: {
          type: 'string',
          description: 'Recipient email address.',
        },
        amountMinor: {
          type: 'integer',
          description: 'Total amount in minor units (e.g. 45000 pesewas for GHS 450.00).',
        },
        currency: {
          type: 'string',
          default: 'GHS',
          description: 'Currency code (default GHS).',
        },
        invoiceNumber: {
          type: 'string',
          description: 'Optional invoice number (e.g. INV-2026-005).',
        },
        description: {
          type: 'string',
          description: 'Description of work or milestone.',
        },
      },
      required: ['clientName', 'clientEmail', 'amountMinor'],
    },
  },
] as const;

/**
 * Agent Tool: Initialize checkout
 */
export async function paystackInitializePaymentTool(args: {
  email: string;
  amountMinor: number;
  currency?: string;
  reference?: string;
  description?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  authorizationUrl?: string;
  reference: string;
  accessCode?: string;
  message?: string;
}> {
  const currency = (args.currency || 'GHS').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const reference = args.reference || `AGT-${Date.now()}-${randomSuffix}`;
  const callbackUrl =
    args.callbackUrl ||
    `${process.env.SITE_URL || 'https://aksenlabs.com'}/pay/receipt?reference=${reference}`;

  const result = await initializePaystackCheckout({
    email: args.email,
    amountMinor: args.amountMinor,
    currency,
    reference,
    callbackUrl,
    metadata: {
      ...args.metadata,
      source: 'agent_tool',
      description: args.description || 'Agent-generated checkout',
    },
  });

  return {
    success: result.success,
    authorizationUrl: result.authorizationUrl,
    reference: result.reference,
    accessCode: result.accessCode,
    message: result.message,
  };
}

/**
 * Agent Tool: Verify payment
 */
export async function paystackVerifyPaymentTool(args: {
  reference: string;
}): Promise<PaystackVerifyResult> {
  if (!args.reference || typeof args.reference !== 'string') {
    return {
      success: false,
      status: 'unknown',
      reference: '',
      amountMinor: 0,
      currency: '',
      message: 'A valid reference string is required.',
    };
  }
  return verifyPaystackTransaction(args.reference.trim());
}

/**
 * Agent Tool: Check balance & account status
 */
export async function paystackCheckBalanceTool(): Promise<{
  connected: boolean;
  mode: 'test' | 'live' | 'unconfigured';
  publicKey: string;
  currencies: string[];
  message: string;
}> {
  return getPaystackAccountStatus();
}

/**
 * Agent Tool: Generate hosted payment link and customer message draft
 */
export async function paystackGeneratePaymentLinkTool(args: {
  clientName: string;
  clientEmail: string;
  amountMinor: number;
  currency?: string;
  description?: string;
  invoiceNumber?: string;
  originUrl?: string;
}): Promise<{
  success: boolean;
  paymentUrl?: string;
  reference: string;
  formattedAmount: string;
  clientMessageDraft?: string;
  message?: string;
}> {
  const currency = (args.currency || 'GHS').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const reference = `PAY-${Date.now()}-${randomSuffix}`;
  const baseUrl = args.originUrl || process.env.SITE_URL || 'https://aksenlabs.com';
  const callbackUrl = `${baseUrl}/order-demo?stage=paid&reference=${reference}&paystack=success`;

  const checkoutResult = await initializePaystackCheckout({
    email: args.clientEmail,
    amountMinor: args.amountMinor,
    currency,
    reference,
    callbackUrl,
    metadata: {
      source: 'agent_payment_generator',
      clientName: args.clientName,
      invoiceNumber: args.invoiceNumber,
      description: args.description,
    },
  });

  const decimalAmount = (args.amountMinor / 100).toFixed(2);
  const formattedAmount = `${currency} ${decimalAmount}`;

  if (!checkoutResult.success || !checkoutResult.authorizationUrl) {
    return {
      success: false,
      reference,
      formattedAmount,
      message: checkoutResult.message || 'Payment link generation failed.',
    };
  }

  const invoiceTag = args.invoiceNumber ? ` for ${args.invoiceNumber}` : '';
  const messageDraft = `Hello ${args.clientName},

Your payment request${invoiceTag} for ${formattedAmount} is ready.

You can complete payment directly and securely using the link below:
${checkoutResult.authorizationUrl}

Accepted payment methods:
• Mobile Money (MTN MoMo, Telecel Cash)
• Visa / Mastercard

Payment Reference: ${reference}

Please let us know once complete, or our system will automatically acknowledge receipt once verified.

Warm regards,
Aksen Labs Desk`;

  return {
    success: true,
    paymentUrl: checkoutResult.authorizationUrl,
    reference,
    formattedAmount,
    clientMessageDraft: messageDraft,
    message: 'Payment link and client message generated successfully.',
  };
}

/**
 * Universal dispatcher for Paystack Agent Tools.
 */
export async function executePaystackAgentTool(
  name: string,
  args: Record<string, unknown>,
  context?: { originUrl?: string },
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    switch (name) {
      case 'paystack_initialize_payment': {
        const email = String(args.email || '');
        const amountMinor = Number(args.amountMinor || 0);
        if (!email || !amountMinor) {
          return { success: false, error: 'email and amountMinor are required.' };
        }
        const res = await paystackInitializePaymentTool({
          email,
          amountMinor,
          currency: args.currency ? String(args.currency) : undefined,
          reference: args.reference ? String(args.reference) : undefined,
          description: args.description ? String(args.description) : undefined,
          callbackUrl: args.callbackUrl ? String(args.callbackUrl) : undefined,
        });
        return { success: res.success, data: res };
      }

      case 'paystack_verify_payment': {
        const reference = String(args.reference || '');
        if (!reference) {
          return { success: false, error: 'reference is required.' };
        }
        const res = await paystackVerifyPaymentTool({ reference });
        const toolSucceeded = res.status !== 'unknown';
        return {
          success: toolSucceeded,
          data: res,
          error: toolSucceeded ? undefined : res.message,
        };
      }

      case 'paystack_check_balance': {
        const res = await paystackCheckBalanceTool();
        return { success: res.connected, data: res };
      }

      case 'paystack_generate_payment_link': {
        const clientName = String(args.clientName || 'Client');
        const clientEmail = String(args.clientEmail || '');
        const amountMinor = Number(args.amountMinor || 0);
        if (!clientEmail || !amountMinor) {
          return {
            success: false,
            error: 'clientEmail and amountMinor are required.',
          };
        }
        const res = await paystackGeneratePaymentLinkTool({
          clientName,
          clientEmail,
          amountMinor,
          currency: args.currency ? String(args.currency) : undefined,
          invoiceNumber: args.invoiceNumber ? String(args.invoiceNumber) : undefined,
          description: args.description ? String(args.description) : undefined,
          originUrl: context?.originUrl,
        });
        return { success: res.success, data: res };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Tool execution error.',
    };
  }
}

