# OpenRouter routing and AI use cases

Updated 10 September 2026.

## Active design

Text AI uses one gateway in `lib/openrouter.ts` and one routing policy in `lib/ai-routing.ts`. Default routing mode is `auto`: OpenRouter selects a suitable model via `openrouter/auto`. The explicit default model remains `deepseek/deepseek-v4-pro-0813`, with the previously configured models available for fallback. The application limits each request to three unique model entries as its own policy; this is not a claimed universal limit on OpenRouter's Chat Completions API.

The normal auto request order is Auto → DeepSeek → Claude Sonnet. Fixed-default mode uses DeepSeek → Claude Sonnet → GPT-4o mini. Existing configured overrides take precedence. OpenRouter chooses the actual model behind Auto; it is not guaranteed to choose the fixed default or a particular provider.

## Configuration

| Variable | Default | Effect |
| --- | --- | --- |
| OPENROUTER_API_KEY | Required existing server secret | Provider authentication |
| OPENROUTER_ROUTING_MODE | auto | auto or default |
| OPENROUTER_MODEL | deepseek/deepseek-v4-pro-0813 | Explicit default / first fixed fallback |
| OPENROUTER_FALLBACK_MODELS | anthropic/claude-sonnet-5,openai/gpt-4o-mini | Ordered fallback candidates; unique total request order capped at three |
| OPENROUTER_AUTO_COST_TIER | Per profile | low, medium, high, xhigh or max |
| OPENROUTER_AUTO_ALLOWED_MODELS | Empty | Optional comma-separated Auto candidate patterns; applies to Auto selection, not the explicit fallback list |

Configure candidate and fallback restrictions consistently if you require a global model boundary. Account-level provider restrictions and budgets also apply. A cost tier is a routing preference, not a currency-denominated spending cap. Set hard budgets in OpenRouter. Environment changes need a runtime restart or hosted configuration update.

## Use cases

| Profile | Connected features | Auto preference |
| --- | --- | --- |
| conversation | Ask Aksen, service demo replies | low |
| structured | Opportunity mapper | low; JSON response support required |
| drafting | Operations desk, source-grounded workspace assistant, public workspace demo | medium |
| creative | Creative prompt helper | low |

Actual prompts, evidence rules, human review boundaries and existing quotas remain. AI drafting does not send emails, confirm payments, sign agreements or publish. Image and video generation are separate modalities and retain dedicated model settings.

## Response quality and diagnostics

- Provider failover is enabled; model fallbacks are passed to OpenRouter.
- Completion requests allow low-effort reasoning without returning reasoning traces. Disabling reasoning caused a real Auto-selected endpoint to reject the request; this was corrected.
- A minimum 1,024-token completion allowance accommodates reasoning plus the final answer. Maximum is 4,000. Caller prompts still request concise output. Tokens are ceilings, not fixed consumption.
- Task-based timeout defaults, bounded to 60 seconds maximum.
- Reject empty answers, provider errors, length-truncated responses and invalid JSON objects for structured tasks.
- No extra application retry on authentication/provider errors; callers retain their explicit fallback/error states.
- Guide requests include the conversation ID for provider session continuity.
- Success logs record actual model, requested model order, route, profile, request ID and reported token usage where available. Existing cost logging stores provider-reported USD micros; missing cost is not zero cost. Some failed requests can still incur cost without a recorded success.

`/admin/agents` shows configuration and actual model names on new run records. Its test control performs a small fictional request using Auto or fixed-default mode, with at most five tests per admin per hour. It does not modify configuration.

## Verification

`node tests/openrouter-routing.mjs` checks request policies and malformed-response handling with mocked transport. `node tests/openrouter-routing.mjs --live` uses configured credentials for three small fictional requests: Auto conversation, fixed-default conversation and Auto JSON. No customer data or outbound messaging is involved.

## Official references

- [Auto Router](https://openrouter.ai/docs/guides/routing/routers/auto-router): automatic selection, candidate filters, cost tiers and session continuity.
- [Model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks): model request ordering and failover behaviour.
- [Reasoning compatibility](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens): supported reasoning controls and completion budgeting.

Live validation completed: Auto conversation selected `google/gemini-3.8-flash`; fixed-default selected `deepseek/deepseek-v4-pro-0813`; Auto JSON selected `z-ai/glm-5.3-flash`. All returned the expected fictional sample value, with a valid JSON object for the structured test. Selection can differ on later requests. Combined reported provider cost for the three successful checks was USD 0.000642; earlier rejected requests are not included in that sum.
