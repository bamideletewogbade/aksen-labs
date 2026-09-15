'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';

/**
 * An address to write to when a product opens.
 *
 * The products page used to send anyone interested in CV Forge to the agent
 * mapper, which is the business enquiry funnel: it asks what you want your
 * business to do better. A jobseeker has no answer to that, so the one product
 * closest to launch collected nothing from the people most likely to use it.
 *
 * The second field is optional on purpose. An email alone is enough to be told
 * when it opens; the line about what they want it to do is what makes the list
 * worth reading rather than counting.
 */
export function ProductWaitlist({
  productSlug,
  productName,
}: {
  productSlug: string;
  productName: string;
}) {
  const [email, setEmail] = useState('');
  const [hopedFor, setHopedFor] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'joined' | 'error'>(
    'idle',
  );
  const [failure, setFailure] = useState('');

  async function join(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setFailure('');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product: productSlug, email, hopedFor }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      // Show the reason we were given. Someone told they are already on the
      // list should not be sent back to type the same address again.
      if (!response.ok) throw new Error(data.error || '');
      setStatus('joined');
    } catch (error) {
      setFailure(error instanceof Error ? error.message : '');
      setStatus('error');
    }
  }

  if (status === 'joined')
    return (
      <output className="product-waitlist-done">
        <Check size={17} />
        <p>
          <strong>You are on the list.</strong> We will write to you at {email}{' '}
          when {productName} opens. Nothing else will be sent to that address.
        </p>
      </output>
    );

  return (
    <form className="product-waitlist" onSubmit={join}>
      <p className="product-waitlist-lead">
        <strong>Tell us where to write when it opens.</strong>
      </p>
      <label>
        Your email
        <input
          required
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        What are you hoping it does for you? <span>Optional</span>
        <input
          value={hopedFor}
          maxLength={280}
          placeholder="One line is plenty"
          onChange={(event) => setHopedFor(event.target.value)}
        />
      </label>
      <button disabled={status === 'sending'}>
        {status === 'sending' ? 'Adding you…' : 'Tell me when it opens'}
        <ArrowRight size={15} />
      </button>
      <small className="product-waitlist-privacy">
        One email, when it opens.{' '}
        <Link href="/privacy">How we handle your information</Link>.
      </small>
      {status === 'error' && (
        <small role="alert" className="product-waitlist-error">
          {failure || 'We could not add you just then. Please try again.'}
        </small>
      )}
    </form>
  );
}
