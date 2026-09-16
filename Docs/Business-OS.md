# The operating system

A way to run Aksen Labs that does not depend on feeling like it.

Motivation is a bad power source. It is highest right after a decision and lowest on the third Tuesday, which is exactly when the business needs work done. This replaces it with four things: a queue that is already decided, a daily minimum too small to argue with, a visible record of what happened, and a weekly refill. You are not asked to choose. You are asked to do the top three.

**Deliberately four markdown files and four slash commands, not a screen.** Section 7 of the operating brief says no new admin modules until Phase 4 passes, and a founder dashboard is the most seductive possible way to break that rule while feeling productive. If this gets used for six weeks without a gap, it has earned a screen. Not before.

---

## The daily three

Every day, exactly three things. Never four. Never "and also".

| Lane | What it is | Why it exists |
| --- | --- | --- |
| **SELL** | Moves money closer. A message, a conversation, a follow-up, a name added to the list, an offer made. | Without a forced lane, this is the one that never happens. The whole company's failure mode is building instead of selling. |
| **BUILD** | Moves the product toward the *current phase's exit test*. Nothing else. | Stops building from expanding to fill the day. If it does not serve the exit test, it is not today's work. |
| **COMPOUND** | Makes next month cheaper. A template, a logged hour, a recorded conversation, a piece of content. | The difference between a job and a business. |

### The rules

1. **SELL is first and is never optional.** If the day collapses and only one thing gets done, it is the SELL one.
2. **Each item is 25 minutes or less.** Not "close the enquiry loop". "Add the founder notification to the enquiry handler." If it will not fit in 25 minutes, it is not an item, it is a project, and it gets split in the weekly review.
3. **The three are drawn from the queue, not invented in the morning.** Choosing costs willpower you need for doing.
4. **The floor is one message.** On a day that is genuinely destroyed, the minimum is one message to one business owner. That is it. The floor is set this low on purpose: a streak that survives a bad day is worth more than a good day.
5. **BUILD only ever comes from the current phase.** If you are in Phase 0, work that belongs to Phase 3 is not available to you, however appealing.
6. **A skipped SELL is recorded as a skipped SELL.** Not as a busy day. The log does not round up.

---

## The commands

| Command | What it does |
| --- | --- |
| `/today` | Draws the three from the queue, puts SELL first, logs them, shows the streak and the numbers |
| `/done` | Marks what actually happened, honestly, and closes the day |
| `/weekly` | Refills the queue, updates the scoreboard, moves revenue ideas along, splits anything that has stalled twice |
| `/money` | Adds or reviews a money-making mechanism in the revenue ledger |

---

## The scoreboard

Two numbers. Everything else is noise until these move.

**Conversations with owners this week.** A conversation is a real exchange with someone who runs a business, in which they described their own problem in their own words. A message that was not replied to is not a conversation. A demo to a friend is not a conversation.

**Cedis invoiced this month.** Invoiced, not promised, not scoped, not discussed.

If both are zero for three weeks running, the strategy is wrong and no amount of building will fix it. The weekly review is required to say so out loud.

**What is deliberately not on the scoreboard:** features shipped, tests passing, pages redesigned, commits made, documents written. All of those can be at an all-time high in a company that is dying.

---

## The revenue ledger

`Docs/Revenue-Ledger.md` holds every way this business could actually make money, as a pipeline rather than a list of hopes.

```
Noticed  →  Sized  →  Testing  →  Earning
                 ↘            ↘
                  Parked       Killed
```

| Stage | Means | To leave it, you need |
| --- | --- | --- |
| **Noticed** | Somebody spotted it. No claim it is good. | A written mechanism: who pays, for what, how often |
| **Sized** | We know what it would cost to test and what "it worked" means | A test actually started |
| **Testing** | A cheap experiment is running with a deadline | The exit criterion met, or missed |
| **Earning** | Money has arrived from it | Nothing. This is the goal. |
| **Parked** | Plausible, wrong time. Has a date to reconsider. | The date arriving |
| **Killed** | Tested and failed, or fails a hard rule. Keeps its reason. | Nothing. Killed is permanent unless the reason stops being true. |

**Rules for the ledger**

- Every item names **how money actually arrives**: who pays, for what, how often, at what price. An idea that cannot answer that is not a mechanism, it is a feeling.
- Every item names its **cost to test in hours and cedis**. Ideas are free; tests are not.
- Nothing moves to Testing without an **exit criterion written before the test starts**. Otherwise every result is interpreted as encouraging.
- **At most two items in Testing at once.** This is the rule the whole ledger exists to enforce.
- Killed items stay visible with their reason. A graveyard is the cheapest form of institutional memory.

---

## The weekly review

Fifteen minutes, same time each week. Run `/weekly`.

1. Fill in the two numbers. No adjusting, no explaining.
2. Anything in the queue that was carried three days running gets split or killed.
3. Move revenue ledger items that earned their move. Nothing moves out of politeness.
4. Refill each lane to at least five items.
5. Answer one question in writing: **what did a real business owner tell me this week that I did not already believe?** If the answer is nothing, next week's SELL lane is conversations only.

---

## What this system is protecting against

Named plainly, so it can be checked rather than assumed:

- **Building instead of selling.** The forced SELL lane, and BUILD restricted to the current phase.
- **Choosing instead of doing.** The queue is decided in advance.
- **Motivation dependence.** The one-message floor and the streak.
- **Scope drift on money ideas.** Two items in Testing, exit criteria written first.
- **Flattering yourself in the record.** Two numbers, neither of which can be faked by working hard.
