import assert from 'node:assert/strict';
import crypto from 'node:crypto';

try {
  process.loadEnvFile?.('.env');
} catch {}

import {
  getPaystackSecretKey,
  getPaystackPublicKey,
  isPaystackConfigured,
  isPaystackTestMode,
  verifyPaystackWebhookSignature,
  initializePaystackCheckout,
  verifyPaystackTransaction,
  getPaystackAccountStatus,
  paystackCheckBalanceTool,
  paystackInitializePaymentTool,
  paystackVerifyPaymentTool,
  paystackGeneratePaymentLinkTool,
  executePaystackAgentTool,
  paystackAgentToolSchemas,
} from '../lib/paystack.ts';

// 1. Basic configuration tests
assert.equal(isPaystackConfigured(), true, 'Paystack secret key should be configured');
assert.equal(isPaystackTestMode(), true, 'Paystack should be in test mode');
assert.ok(getPaystackSecretKey().startsWith('sk_test_'), 'Secret key must start with sk_test_');
assert.ok(getPaystackPublicKey().startsWith('pk_test_'), 'Public key must start with pk_test_');

// 2. Webhook HMAC-SHA512 verification tests
const secret = getPaystackSecretKey();
const samplePayload = JSON.stringify({
  event: 'charge.success',
  data: {
    reference: 'TEST-REF-12345',
    amount: 50000,
    currency: 'GHS',
    paid_at: new Date().toISOString(),
  },
});

const validSignature = crypto
  .createHmac('sha512', secret)
  .update(samplePayload)
  .digest('hex');

assert.equal(
  verifyPaystackWebhookSignature(samplePayload, validSignature),
  true,
  'Valid HMAC-SHA512 signature must pass',
);

assert.equal(
  verifyPaystackWebhookSignature(samplePayload, 'invalid_forged_signature_1234567890'),
  false,
  'Tampered or invalid signature must fail',
);

assert.equal(
  verifyPaystackWebhookSignature(samplePayload, null),
  false,
  'Missing signature must fail',
);

assert.equal(
  verifyPaystackWebhookSignature(samplePayload + 'tampered', validSignature),
  false,
  'Tampered payload with original signature must fail',
);

console.log('PASS: Paystack configuration and HMAC-SHA512 signature verification.');

// 3. Live API connectivity tests with Paystack
const status = await getPaystackAccountStatus();
assert.equal(status.connected, true, 'Paystack API must connect successfully');
assert.equal(status.mode, 'test', 'Paystack mode must be test');
assert.ok(status.currencies.includes('GHS'), 'Account must support GHS currency');

console.log(`PASS: Paystack account status verified (${status.currencies.join(', ')}).`);

// 4. Live transaction initialization test
const initTestRef = `TEST-INIT-${Date.now()}`;
const initResult = await initializePaystackCheckout({
  email: 'qa-tester@aksenlabs.com',
  amountMinor: 25000, // 250.00 GHS
  currency: 'GHS',
  reference: initTestRef,
  callbackUrl: 'http://localhost:3000/pay/test-invoice',
  metadata: {
    test: true,
    environment: 'integration-test',
  },
});

assert.equal(initResult.success, true, 'Checkout initialization must succeed');
assert.ok(initResult.authorizationUrl?.startsWith('https://checkout.paystack.com/'), 'Must return Paystack hosted checkout URL');
assert.ok(initResult.accessCode, 'Must return Paystack access code');
assert.equal(initResult.reference, initTestRef, 'Returned reference must match');

console.log('PASS: Paystack live checkout session initialized successfully.');

// 5. Live transaction verification test (lookup created reference)
const verifyResult = await verifyPaystackTransaction(initTestRef);
assert.equal(verifyResult.reference, initTestRef, 'Verification reference must match');
assert.equal(verifyResult.amountMinor, 25000, 'Amount in minor units must match');
assert.equal(verifyResult.currency, 'GHS', 'Currency must match GHS');
// Since it was just created and not paid through the UI, status will be abandoned or pending
assert.ok(['abandoned', 'pending', 'ongoing'].includes(verifyResult.status), `Status should be initial unpaid state: ${verifyResult.status}`);

console.log('PASS: Paystack live transaction verification endpoint validated.');

// 6. Agent Tool Schemas
assert.equal(Array.isArray(paystackAgentToolSchemas), true, 'Tool schemas must be an array');
assert.ok(paystackAgentToolSchemas.length >= 4, 'Must provide at least 4 agent tools');
assert.ok(
  paystackAgentToolSchemas.some((t) => t.name === 'paystack_initialize_payment'),
  'Must include paystack_initialize_payment schema',
);
assert.ok(
  paystackAgentToolSchemas.some((t) => t.name === 'paystack_generate_payment_link'),
  'Must include paystack_generate_payment_link schema',
);
console.log(`PASS: Paystack AI Agent tool schemas validated (${paystackAgentToolSchemas.length} tools).`);

// 7. paystackCheckBalanceTool
const balanceCheck = await paystackCheckBalanceTool();
assert.equal(balanceCheck.connected, true, 'Balance tool must connect');
assert.equal(balanceCheck.mode, 'test', 'Mode must be test');
assert.ok(balanceCheck.currencies.includes('GHS'), 'Must support GHS');
console.log('PASS: paystackCheckBalanceTool validated.');

// 8. paystackGeneratePaymentLinkTool
const linkResult = await paystackGeneratePaymentLinkTool({
  clientName: 'Kwame Mensah',
  clientEmail: 'kwame@example.com',
  amountMinor: 45000, // 450.00 GHS
  currency: 'GHS',
  invoiceNumber: 'INV-2026-TEST',
  description: 'Two Oak Shelves Order',
});
assert.equal(linkResult.success, true, 'Payment link generator must succeed');
assert.ok(linkResult.paymentUrl?.startsWith('https://checkout.paystack.com/'), 'Must return valid Paystack checkout URL');
assert.equal(linkResult.formattedAmount, 'GHS 450.00', 'Formatted amount must be GHS 450.00');
assert.ok(linkResult.clientMessageDraft?.includes('GHS 450.00'), 'Draft message must include formatted amount');
assert.ok(linkResult.clientMessageDraft?.includes(linkResult.paymentUrl), 'Draft message must include payment link');
assert.ok(linkResult.clientMessageDraft?.includes('Mobile Money'), 'Draft message must specify payment methods');
console.log('PASS: paystackGeneratePaymentLinkTool validated with formatted message draft.');

// 9. executePaystackAgentTool dispatcher
const toolRunResult = await executePaystackAgentTool('paystack_check_balance', {});
assert.equal(toolRunResult.success, true, 'Dispatcher execution must succeed');
const verifyToolRun = await executePaystackAgentTool('paystack_verify_payment', {
  reference: initTestRef,
});
assert.equal(verifyToolRun.success, true, 'Verify tool via dispatcher must succeed');

console.log('PASS: executePaystackAgentTool universal dispatcher validated.');
console.log('ALL PAYSTACK INTEGRATION & AGENT TOOL TESTS PASSED!');

