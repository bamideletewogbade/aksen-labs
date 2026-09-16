/**
 * The product screens drawn into the kit.
 *
 * These are drawn, not captured. The real admin holds real records, and the
 * rule is that a public asset shows a fictional business instead of a blurred
 * real one. Every name, number and naira amount below is invented.
 *
 * Each screen is plain HTML so the same file feeds the still images and, once
 * rendered to a transparent PNG, the videos. One drawing, two uses.
 */

const chip = (text, tone = 'wait') => `<span class="chip chip-${tone}">${text}</span>`;

const shell = (title, sub, body, badge = '') => `
<div class="app">
  <div class="app-top">
    <div class="app-dot"></div>
    <div class="app-title"><b>${title}</b><span>${sub}</span></div>
    ${badge}
  </div>
  <div class="app-body">${body}</div>
</div>`;

const approve = (text) =>
  `<div class="approve"><div class="approve-icon">✓</div><div><b>${text}</b><span>AI prepared this. You decide.</span></div><div class="approve-btn">Approve</div></div>`;

export const screens = {
  orders: (b) =>
    shell(
      b.business,
      'Order desk',
      `<div class="bubble in">Hi, I want the green ankara gown, size 12. Deliver to Yaba please 🙏</div>
       <div class="bubble out">Got it! Green ankara gown, size 12, delivery to Yaba. Total ₦38,500 with delivery. Shall I send payment details?</div>
       <div class="rows">
         <div class="row"><div><b>Green ankara gown · 12</b><span>Tolu A. · Yaba</span></div>${chip('New', 'new')}</div>
         <div class="row"><div><b>Adire two-piece · M</b><span>Chidi O. · Surulere</span></div>${chip('Paid', 'ok')}</div>
         <div class="row"><div><b>Aso-oke set · L</b><span>Funmi B. · Ikeja</span></div>${chip('Packed', 'ok')}</div>
       </div>
       ${approve('Confirm payment for 1 order')}`,
      `<div class="count">12<span>today</span></div>`,
    ),
  kitchen: (b) =>
    shell(
      b.business,
      'Kitchen screen',
      `<div class="tickets">
        ${[
          ['#214', 'Jollof rice + chicken ×2', 'Wuse 2 · 12:40', 'Cooking', 'wait'],
          ['#215', 'Pounded yam + egusi', 'Garki · 12:45', 'New', 'new'],
          ['#216', 'Fried rice + plantain ×3', 'Maitama · 12:50', 'Ready', 'ok'],
          ['#217', 'Pepper soup (goat)', 'Jabi · 12:55', 'New', 'new'],
        ]
          .map(
            ([n, meal, where, s, t]) =>
              `<div class="ticket"><div class="ticket-n">${n}</div><div><b>${meal}</b><span>${where}</span></div>${chip(s, t)}</div>`,
          )
          .join('')}
      </div>
      <div class="note">Orders reach the kitchen with meal, address and time filled in.</div>`,
      `<div class="count">31<span>orders</span></div>`,
    ),
  reminders: (b) =>
    shell(
      b.business,
      'Refill reminders',
      `<div class="bubble out small">Good morning Mrs Okafor 👋 Your monthly refill is due on Friday. Reply YES and we will have it ready for pickup.</div>
       <div class="rows">
         ${[
           ['Mrs N. Okafor', 'Due Fri'],
           ['Mr I. Bello', 'Due Sat'],
           ['Ms A. Musa', 'Due Sat'],
           ['Mr K. Eze', 'Due Mon'],
         ]
           .map(([n, d]) => `<div class="row"><div><b>${n}</b><span>Monthly refill</span></div>${chip(d, 'wait')}</div>`)
           .join('')}
       </div>
       ${approve('Send 6 reminders')}`,
    ),
  pipeline: (b) =>
    shell(
      b.business,
      'Enquiries',
      `<div class="cols">
        ${[
          ['New', [['3-bed flat, Lekki', 'From Instagram'], ['Land, Ibeju', 'From WhatsApp']]],
          ['Viewing', [['2-bed, Ikate', 'Sat 11:00']]],
          ['Follow up', [['Duplex, Chevron', 'Draft ready']]],
        ]
          .map(
            ([h, cards]) =>
              `<div class="col"><div class="col-h">${h}</div>${cards
                .map(([t, s]) => `<div class="card"><b>${t}</b><span>${s}</span></div>`)
                .join('')}</div>`,
          )
          .join('')}
      </div>
      ${approve('Send follow-up to 1 lead')}`,
      `<div class="count">9<span>this week</span></div>`,
    ),
  admissions: (b) =>
    shell(
      b.business,
      'Admissions 2026/27',
      `<div class="bars">
        ${[
          ['Applied', 64, 100],
          ['Assessment booked', 38, 60],
          ['Offer sent', 21, 34],
          ['Fees paid', 14, 22],
        ]
          .map(
            ([l, n, w]) =>
              `<div class="bar"><span>${l}</span><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><b>${n}</b></div>`,
          )
          .join('')}
      </div>
      <div class="rows">
        <div class="row"><div><b>Chiamaka N. · JSS1</b><span>Assessment Tue 10:00</span></div>${chip('Booked', 'ok')}</div>
        <div class="row"><div><b>Tobi A. · Primary 4</b><span>Second term fees</span></div>${chip('Reminder', 'wait')}</div>
      </div>`,
    ),
  calendar: (b) =>
    shell(
      b.business,
      'Bookings · Saturday',
      `<div class="slots">
        ${[
          ['9:00', 'Knotless braids', 'Ada', 'ok'],
          ['11:30', 'Free slot', '', 'free'],
          ['12:00', 'Silk press', 'Zainab', 'ok'],
          ['2:00', 'Lash fill', 'Bisi', 'ok'],
          ['3:30', 'Free slot', '', 'free'],
        ]
          .map(
            ([t, s, n, k]) =>
              `<div class="slot slot-${k}"><span class="slot-t">${t}</span><div><b>${s}</b>${n ? `<span>${n}</span>` : ''}</div>${k === 'ok' ? chip('Reminded', 'ok') : chip('Open', 'new')}</div>`,
          )
          .join('')}
      </div>`,
      `<div class="count">8<span>booked</span></div>`,
    ),
  tracking: (b) =>
    shell(
      b.business,
      'Parcel SD-4821',
      `<div class="map"><div class="route"></div><div class="pin pin-a"></div><div class="pin pin-b"></div><div class="rider">🛵</div></div>
       <div class="steps">
         ${[
           ['Picked up · Ikeja', '10:12', true],
           ['On the way · Third Mainland', '10:48', true],
           ['Arriving · Victoria Island', 'ETA 11:20', false],
         ]
           .map(
             ([s, t, done]) =>
               `<div class="step ${done ? 'done' : ''}"><div class="step-dot"></div><div><b>${s}</b><span>${t}</span></div></div>`,
           )
           .join('')}
       </div>`,
    ),
  quote: (b) =>
    shell(
      b.business,
      'Quote · Wedding, 300 guests',
      `<div class="lines">
        ${[
          ['Hall decor & lighting', '₦1,850,000'],
          ['Chairs and tables (300)', '₦720,000'],
          ['Floral centrepieces ×30', '₦540,000'],
          ['Coordination team', '₦400,000'],
        ]
          .map(([l, p]) => `<div class="line"><span>${l}</span><b>${p}</b></div>`)
          .join('')}
        <div class="line total"><span>Total</span><b>₦3,510,000</b></div>
      </div>
      <div class="draft">Drafted from the WhatsApp brief · needs your check</div>
      ${approve('Send quote to client')}`,
    ),
  stock: (b) =>
    shell(
      b.business,
      'Stock & sales',
      `<div class="kpis"><div><span>Sales today</span><b>₦486,200</b></div><div><span>Low stock</span><b class="warn">5 items</b></div></div>
       <div class="spark">${[40, 55, 48, 70, 62, 85, 78].map((h) => `<i style="height:${h}%"></i>`).join('')}</div>
       <div class="rows">
         <div class="row"><div><b>Semolina 1kg bag</b><span>6 left · sells 14/day</span></div>${chip('Reorder', 'warn')}</div>
         <div class="row"><div><b>Evaporated milk tin</b><span>11 left · sells 20/day</span></div>${chip('Reorder', 'warn')}</div>
         <div class="row"><div><b>Instant noodles, carton</b><span>32 left</span></div>${chip('OK', 'ok')}</div>
       </div>`,
    ),
};

export const uiCss = `
.app{width:860px;background:#fff;border-radius:40px;box-shadow:0 40px 90px rgba(2,20,12,.45),0 0 0 1px rgba(16,38,29,.06);overflow:hidden;font-family:Geist,sans-serif;color:#10261d}
.app-top{display:flex;align-items:center;gap:18px;padding:30px 36px;background:#eff3e8;border-bottom:1px solid #dfe6da}
.app-dot{width:52px;height:52px;border-radius:15px;background:#175b3b;box-shadow:inset 0 0 0 10px #c2f576}
.app-title{flex:1;display:flex;flex-direction:column}.app-title b{font-size:32px;font-weight:650;letter-spacing:-.5px}.app-title span{font-size:22px;color:#53635a}
.count{font-size:44px;font-weight:700;color:#175b3b;display:flex;flex-direction:column;align-items:flex-end;line-height:1}.count span{font-size:18px;color:#53635a;font-weight:500}
.app-body{padding:30px 36px 36px;display:flex;flex-direction:column;gap:20px}
.bubble{max-width:82%;padding:20px 24px;border-radius:26px;font-size:26px;line-height:1.35}
.bubble.in{background:#f1f1ee;border-bottom-left-radius:8px}
.bubble.out{background:#d9fdd3;align-self:flex-end;border-bottom-right-radius:8px}
.bubble.small{font-size:24px;max-width:92%}
.rows{display:flex;flex-direction:column;border:1px solid #e3e9df;border-radius:22px;overflow:hidden}
.row{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #eef2eb}.row:last-child{border:0}
.row b,.card b,.ticket b,.slot b,.step b{display:block;font-size:25px;font-weight:600}
.row span,.card span,.ticket span,.slot span,.step span{font-size:20px;color:#53635a}
.chip{font-size:19px;font-weight:600;padding:8px 16px;border-radius:999px;white-space:nowrap}
.chip-new{background:#e7f7c9;color:#2d5a07}.chip-ok{background:#d8efe1;color:#175b3b}.chip-wait{background:#fdf0d5;color:#8a5a00}.chip-warn{background:#fde2dc;color:#a3321b}
.approve{display:flex;align-items:center;gap:18px;background:#062319;color:#e7efe3;border-radius:24px;padding:20px 22px}
.approve-icon{width:48px;height:48px;border-radius:50%;background:#c2f576;color:#062319;display:grid;place-items:center;font-weight:800;font-size:26px}
.approve b{display:block;font-size:25px}.approve span{font-size:19px;color:#a9bcb2}.approve>div:nth-child(2){flex:1}
.approve-btn{background:#c2f576;color:#062319;font-weight:700;font-size:22px;padding:14px 22px;border-radius:14px}
.tickets{display:flex;flex-direction:column;gap:14px}
.ticket{display:flex;align-items:center;gap:18px;padding:18px 20px;border-radius:20px;background:#f7f9f4;border:1px solid #e3e9df}.ticket>div:nth-child(2){flex:1}
.ticket-n{font-family:'Geist Mono',monospace;font-size:22px;background:#062319;color:#c2f576;padding:10px 12px;border-radius:12px}
.note{font-size:21px;color:#53635a}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.col{background:#f4f7f0;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:12px;min-height:250px}
.col-h{font-size:19px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#53635a;padding:4px 6px}
.card{background:#fff;border-radius:16px;padding:14px;box-shadow:0 2px 0 #e3e9df}.card b{font-size:22px}.card span{font-size:18px}
.bars{display:flex;flex-direction:column;gap:16px}
.bar{display:grid;grid-template-columns:250px 1fr 60px;align-items:center;gap:14px;font-size:22px}.bar b{text-align:right;font-size:26px}
.bar-track{height:18px;background:#eef2eb;border-radius:9px;overflow:hidden}.bar-fill{height:100%;background:linear-gradient(90deg,#175b3b,#7fd36b);border-radius:9px}
.slots{display:flex;flex-direction:column;gap:12px}
.slot{display:flex;align-items:center;gap:18px;padding:16px 20px;border-radius:18px;background:#f7f9f4;border-left:8px solid #175b3b}.slot>div{flex:1}
.slot-free{background:#fff;border:2px dashed #c9d4c7;border-left:8px solid #c2f576}
.slot-t{font-family:'Geist Mono',monospace;font-size:22px !important;color:#10261d !important;width:78px}
.map{position:relative;height:250px;border-radius:24px;background:#e4ecdf;overflow:hidden;background-image:linear-gradient(#d6e0d1 2px,transparent 2px),linear-gradient(90deg,#d6e0d1 2px,transparent 2px);background-size:50px 50px}
.route{position:absolute;left:80px;top:180px;width:640px;height:120px;border-top:8px dashed #175b3b;border-radius:50% 50% 0 0;transform:rotate(-12deg)}
.pin{position:absolute;width:30px;height:30px;border-radius:50%;border:8px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.2)}.pin-a{left:70px;top:170px;background:#175b3b}.pin-b{right:90px;top:60px;background:#e2552f}
.rider{position:absolute;left:430px;top:88px;font-size:52px}
.steps{display:flex;flex-direction:column;gap:16px;padding-left:6px}
.step{display:flex;gap:18px;align-items:center;opacity:.55}.step.done{opacity:1}
.step-dot{width:26px;height:26px;border-radius:50%;border:5px solid #175b3b;background:#fff}.step.done .step-dot{background:#175b3b}
.lines{display:flex;flex-direction:column;border:1px solid #e3e9df;border-radius:22px;overflow:hidden}
.line{display:flex;justify-content:space-between;padding:18px 24px;font-size:24px;border-bottom:1px solid #eef2eb}.line b{font-weight:600}
.line.total{background:#062319;color:#fff;border:0;font-size:28px}.line.total b{color:#c2f576}
.draft{font-size:21px;color:#8a5a00;background:#fdf0d5;padding:12px 18px;border-radius:14px;align-self:flex-start}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:14px}.kpis>div{background:#f4f7f0;border-radius:20px;padding:18px 22px}.kpis span{display:block;font-size:20px;color:#53635a}.kpis b{font-size:38px}.kpis .warn{color:#a3321b}
.spark{display:flex;align-items:flex-end;gap:12px;height:120px;padding:0 6px}.spark i{flex:1;background:linear-gradient(#7fd36b,#175b3b);border-radius:10px 10px 4px 4px}
`;
