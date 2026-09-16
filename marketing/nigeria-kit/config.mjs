/**
 * Everything the Nigeria kit says that could go stale, in one file.
 *
 * Prices come from Docs/Nigeria-Friends-Kit-and-Pricing-2026-09-16.md. Change
 * them there first, then here, then rebuild. A price that lives only on an image
 * a friend has already posted cannot be taken back, so keep this file honest.
 */

export const contact = {
  whatsappDisplay: '+234 915 583 3108',
  whatsappDigits: '2349155833108',
  // The Workers address moves when the domain is set up. Change it here and
  // rebuild; nothing else in the kit hardcodes it. Set to '' to hide it.
  link: 'aksen-labs.bishoptewogbade.workers.dev',
};

export const offers = [
  { id: 'call', name: 'Discovery call', price: 'Free', note: '20 minutes on WhatsApp. We tell you the best first step.' },
  { id: 'leads', name: 'Lead Pack', price: '₦29,900', note: '30 checked businesses in your niche, sources shown.' },
  { id: 'check', name: 'Business Check', price: '₦49,900', note: 'One-page plan. Credited to your build in 30 days.' },
  { id: 'page', name: 'Starter Page', price: '₦99,000', note: 'One-page site with a WhatsApp order button.' },
  { id: 'orders', name: 'WhatsApp Order Desk', price: '₦149,000', note: 'Every order in one dashboard. Care from ₦19,900/mo.' },
  { id: 'bookings', name: 'Bookings & Reminders', price: '₦179,000', note: 'Online booking and reminders. Care from ₦19,900/mo.' },
  { id: 'custom', name: 'Custom systems', price: 'From ₦450,000', note: 'Dashboards, portals, internal tools. Quoted after the call.' },
];

/**
 * One fictional business per industry. Names are invented and every asset says
 * "Fictional example". The `ui` key picks the product screen drawn for it.
 */
export const industries = [
  {
    id: 'boutique', art: 'ng-boutique', sector: 'Fashion', place: 'Lagos',
    business: 'Adaeze Styles',
    hook: 'Orders buried in your DMs?',
    line: 'WhatsApp and Instagram orders land in one list your team can see.',
    ui: 'orders', offer: 'orders',
  },
  {
    id: 'restaurant', art: 'ng-restaurant', sector: 'Food', place: 'Abuja',
    business: 'Mama T Kitchen',
    hook: 'Lunch rush on WhatsApp?',
    line: 'Orders arrive complete: meal, address, time. The kitchen sees them in order.',
    ui: 'kitchen', offer: 'orders',
  },
  {
    id: 'pharmacy', art: 'ng-pharmacy', sector: 'Pharmacy', place: 'Abuja',
    business: 'CarePoint Pharmacy',
    hook: 'Customers forget their refills?',
    line: 'A friendly reminder goes out before the pack runs out. Staff approve the list.',
    ui: 'reminders', offer: 'bookings',
  },
  {
    id: 'realestate', art: 'ng-realestate', sector: 'Real estate', place: 'Lekki',
    business: 'Keystone Homes',
    hook: 'Leads from Instagram going cold?',
    line: 'Enquiries captured, viewings booked, follow-ups drafted for you to send.',
    ui: 'pipeline', offer: 'leads',
  },
  {
    id: 'school', art: 'ng-school', sector: 'Schools', place: 'Ibadan',
    business: 'Brightfield Academy',
    hook: 'Admissions season chaos?',
    line: 'Parents apply online, you see every stage, fee reminders go out on time.',
    ui: 'admissions', offer: 'check',
  },
  {
    id: 'salon', art: 'ng-salon', sector: 'Beauty', place: 'Port Harcourt',
    business: 'Glow by Kemi',
    hook: 'Double bookings again?',
    line: 'Clients book a free slot themselves and get a reminder the day before.',
    ui: 'calendar', offer: 'bookings',
  },
  {
    id: 'logistics', art: 'ng-logistics', sector: 'Logistics', place: 'Lagos',
    business: 'SwiftDrop Dispatch',
    hook: '"Where is my package?" x100',
    line: 'Customers get a tracking link. Riders update it in one tap.',
    ui: 'tracking', offer: 'check',
  },
  {
    id: 'events', art: 'ng-events', sector: 'Events', place: 'Enugu',
    business: 'Golden Hour Events',
    hook: 'Quotes taking days?',
    line: 'A quote drafted from the brief in minutes. You check it and send it.',
    ui: 'quote', offer: 'check',
  },
  {
    id: 'minimart', art: 'ng-minimart', sector: 'Retail', place: 'Kano',
    business: 'Daily Needs Mart',
    hook: 'Running out of best sellers?',
    line: 'Low stock flagged early, sales totals every evening, less guessing.',
    ui: 'stock', offer: 'check',
  },
];
