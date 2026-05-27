// GA4 measurement ID — replace before going live
const GA4_ID = 'G-XXXXXXXXXX';
// Meta Pixel ID — replace before going live
const PIXEL_ID = 'XXXXXXXXXXXXXXXXXX';

const IS_DEMO = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Capture UTM params on page load and persist for 30 days
(function captureUTM() {
  const p = new URLSearchParams(location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utm = {};
  keys.forEach(k => { if (p.get(k)) utm[k] = p.get(k); });
  if (Object.keys(utm).length) {
    utm._ts = Date.now();
    localStorage.setItem('momoz_utm_v1', JSON.stringify(utm));
  }
})();

export function getUTM() {
  try {
    const raw = localStorage.getItem('momoz_utm_v1');
    if (!raw) return {};
    const utm = JSON.parse(raw);
    // 30-day TTL
    if (Date.now() - utm._ts > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem('momoz_utm_v1');
      return {};
    }
    const { _ts, ...fields } = utm;
    return fields;
  } catch { return {}; }
}

// Load GA4
if (!IS_DEMO && GA4_ID !== 'G-XXXXXXXXXX') {
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA4_ID, { send_page_view: true });
}

// Load Meta Pixel
if (!IS_DEMO && PIXEL_ID !== 'XXXXXXXXXXXXXXXXXX') {
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
    t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
}

// Unified event tracker — sends to both GA4 and Meta Pixel
export function track(event, props = {}) {
  if (IS_DEMO) {
    console.debug('[analytics]', event, props);
    return;
  }

  // GA4
  if (typeof gtag === 'function') {
    const gaMap = {
      view_item_list:  () => gtag('event', 'view_item_list', { item_list_name: 'Menu', items: props.items || [] }),
      view_item:       () => gtag('event', 'view_item', { currency: 'USD', value: (props.price_cents || 0) / 100, items: [{ item_id: props.id, item_name: props.name, price: (props.price_cents || 0) / 100 }] }),
      add_to_cart:     () => gtag('event', 'add_to_cart', { currency: 'USD', value: (props.price_cents || 0) / 100, items: [{ item_id: props.id, item_name: props.name, price: (props.price_cents || 0) / 100, quantity: props.qty || 1 }] }),
      begin_checkout:  () => gtag('event', 'begin_checkout', { currency: 'USD', value: (props.value_cents || 0) / 100, num_items: props.num_items }),
      purchase:        () => gtag('event', 'purchase', { transaction_id: props.order_id, currency: 'USD', value: (props.value_cents || 0) / 100 }),
    };
    gaMap[event]?.();
  }

  // Meta Pixel
  if (typeof fbq === 'function') {
    const fbMap = {
      view_item:      () => fbq('track', 'ViewContent', { content_ids: [props.id], content_name: props.name, content_type: 'product', value: (props.price_cents || 0) / 100, currency: 'USD' }),
      add_to_cart:    () => fbq('track', 'AddToCart', { content_ids: [props.id], content_name: props.name, value: (props.price_cents || 0) / 100, currency: 'USD' }),
      begin_checkout: () => fbq('track', 'InitiateCheckout', { value: (props.value_cents || 0) / 100, currency: 'USD', num_items: props.num_items }),
      purchase:       () => fbq('track', 'Purchase', { value: (props.value_cents || 0) / 100, currency: 'USD' }),
    };
    fbMap[event]?.();
  }
}
