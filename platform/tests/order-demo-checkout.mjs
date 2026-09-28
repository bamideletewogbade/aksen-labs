import assert from 'node:assert/strict';

try {
  process.loadEnvFile?.('.env');
} catch {}

import { checkSpecification, orderScenarios } from '../lib/order-demo.ts';
import { initializePaystackCheckout, verifyPaystackTransaction } from '../lib/paystack.ts';

console.log('Testing Order Demo Checkout flow...');

// 1. Spec calculation check
const spec = { ...orderScenarios.complete };
const check = checkSpecification(spec);
assert.equal(check.issues.length, 0, 'Complete scenario should have 0 issues');
assert.equal(check.totalPesewas, 90000, '2 shelves at GHS 450 each = 90,000 pesewas');

// 2. Initialize Order Demo Checkout with Paystack
const demoRef = `ORDER-DEMO-${Date.now()}-TEST`;
const initResult = await initializePaystackCheckout({
  email: 'demo-customer@aksenlabs.com',
  amountMinor: check.totalPesewas,
  currency: 'GHS',
  reference: demoRef,
  callbackUrl: `http://localhost:3000/order-demo?stage=paid&reference=${demoRef}&paystack=success`,
  metadata: {
    type: 'order_demo',
    scenario: 'complete',
    spec,
  },
});

assert.equal(initResult.success, true, 'Demo checkout initialization must succeed');
assert.ok(initResult.authorizationUrl?.startsWith('https://checkout.paystack.com/'), 'Must return Paystack hosted checkout URL');
assert.equal(initResult.reference, demoRef, 'Returned reference must match demoRef');

console.log('PASS: Order Demo Paystack checkout initialization verified.');

// 3. Verify that Paystack API acknowledges this demo order reference
const verifyResult = await verifyPaystackTransaction(demoRef);
assert.equal(verifyResult.reference, demoRef);
assert.equal(verifyResult.amountMinor, 90000);
assert.equal(verifyResult.currency, 'GHS');
assert.equal(verifyResult.metadata?.type, 'order_demo');

console.log('PASS: Paystack verified demo order reference metadata & currency.');
console.log('ALL ORDER DEMO PAYSTACK TESTS PASSED!');
