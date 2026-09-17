/* =============================================================================
   RevHops — /contact smoke test

   Run:  cd ~/Downloads/Claude/revhops.com && node tools/contact-smoke.js
   Needs jsdom, which tools/smoke.js already installs.

   The third of the per-page suites, after tools/resources-smoke.js and
   tools/hubs-smoke.js. It exists because /contact stopped being two
   third-party embeds on 17 September and became the one page on this site
   that owns a form: nine fields, a tab switch, and a submission that talks
   to HubSpot's API rather than to an iframe. All of that can break quietly.

   The two things worth knowing before changing anything here:

   1. THE SUBMISSION POSTS TWICE ON PURPOSE. HubSpot's endpoint rejects a
      payload containing a field its form does not define, and the four
      qualification properties do not exist in the portal yet. So the
      structured attempt goes first and a refusal falls back to the fields
      the form has always had, with the four answers folded into `message`.
      The fallback test below is not testing an edge case; it is testing the
      path that runs today.

   2. THE CALENDAR'S SCRIPT IS NOT IN THE MARKUP. It hangs off
      data-panel-script and loads the first time the panel is shown, because
      HubSpot's widget measures itself when its script runs and a
      display:none container can come back with no height. A test below
      fails if somebody "tidies" it back into a <script> tag.
   ============================================================================= */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'contact.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'assets/js/contact.js'), 'utf8');
const STAMP = (html.match(/site\.css\?v=([0-9a-f]+)/) || [])[1];

let fail = 0;
const ok = m => console.log('  ok   ' + m), bad = m => { fail++; console.log('  FAIL ' + m); };

/* The nine fields, and the property name each one arrives under. Changing a
   name here means changing it in HubSpot too, so the list is spelled out
   rather than read back off the page. */
const FIELDS = ['firstname', 'lastname', 'email', 'company', 'current_crm',
  'revenue_team_size', 'revops_biggest_struggle', 'change_timeline', 'message'];
const SELECTS = ['current_crm', 'revenue_team_size', 'revops_biggest_struggle', 'change_timeline'];

function build() {
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'https://revhops.com/contact' });
  const w = dom.window;
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, addListener() {} }));
  return { w, d: w.document };
}

/* ---------- the markup, before any script runs ---------- */
{
  const { d } = build();

  const tabs = [...d.querySelectorAll('[data-tabs] [role="tab"]')];
  tabs.length === 2 ? ok('two tabs in one tablist') : bad(tabs.length + ' tabs');
  d.querySelector('[data-tabs]').getAttribute('role') === 'tablist'
    ? ok('and the row itself is the tablist') : bad('[data-tabs] is not a tablist');

  /* Boxed buttons on this site mean booking or requesting. These change
     which panel is on screen, so they are chips, the same object as
     .res-tab on /resources. */
  tabs.every(t => t.classList.contains('c-tab') && !t.classList.contains('btn'))
    ? ok('neither tab is a .btn, which on this site means booking') : bad('a tab is styled as a button');

  tabs.every(t => {
    const p = d.getElementById(t.getAttribute('aria-controls'));
    return p && p.getAttribute('aria-labelledby') === t.id && t.getAttribute('data-tab') === p.id;
  }) ? ok('each tab and its panel point at each other') : bad('tab and panel wiring is broken');

  const msg = d.getElementById('panel-message'), book = d.getElementById('panel-book');
  !msg.hasAttribute('hidden') && book.hasAttribute('hidden')
    ? ok('the form is the panel you land on, the calendar starts hidden')
    : bad('the wrong panel is showing at rest');

  /* Both panels flashing on screen before contact.js runs is the failure
     the markup-level `hidden` prevents. */
  book.getAttribute('data-panel-script') && !/MeetingsEmbedCode/.test(
    [...d.querySelectorAll('script')].map(s => s.src).join(' '))
    ? ok('the calendar script is deferred to data-panel-script, not a <script> tag')
    : bad('the meetings embed script is loading on page load again');

  d.querySelector('noscript a[href^="mailto:team@revhops.com"]')
    ? ok('and a noscript line gives the address when neither panel can work')
    : bad('no noscript fallback');

  /* THE FORM IS OURS, NOT AN EMBED. */
  !d.querySelector('.hs-form-frame') && !/hsforms\.net/.test(html)
    ? ok('no HubSpot form embed anywhere on the page') : bad('a HubSpot form embed is back on /contact');

  const form = d.querySelector('[data-contact-form]');
  form ? ok('the form is the site’s own .form component') : bad('no [data-contact-form]');
  form.getAttribute('data-portal') === '46722926'
    ? ok('portal 46722926') : bad('portal is ' + form.getAttribute('data-portal'));
  /^[0-9a-f-]{36}$/.test(form.getAttribute('data-form'))
    ? ok('and a real form guid, not a placeholder') : bad('form guid is ' + form.getAttribute('data-form'));
  !form.hasAttribute('novalidate')
    ? ok('novalidate is off, so the browser checks the fields before we do')
    : bad('the form carries novalidate and nothing else validates');

  FIELDS.every(n => form.elements[n])
    ? ok('all nine fields are present') : bad('missing: ' + FIELDS.filter(n => !form.elements[n]));
  /* Asked for on 17 September: everything required. */
  FIELDS.every(n => form.elements[n].hasAttribute('required'))
    ? ok('and every one of them is required')
    : bad('optional: ' + FIELDS.filter(n => !form.elements[n].hasAttribute('required')));

  FIELDS.every(n => {
    const el = form.elements[n];
    return el.id && d.querySelector('label[for="' + el.id + '"]');
  }) ? ok('every field has a label tied to it by id') : bad('a field has no label');

  SELECTS.every(n => {
    const first = form.elements[n].options[0];
    return first.value === '' && first.disabled;
  }) ? ok('each dropdown opens on a disabled placeholder, so required can fail on it')
     : bad('a dropdown has a selectable empty option');

  SELECTS.every(n => form.elements[n].options.length >= 6)
    ? ok('and each carries its full list of answers') : bad('a dropdown lost its options');

  /* The values that arrive in HubSpot are the option labels, so a dropdown
     property created with different option text silently stores nothing.
     Spot-check the two that were written by hand. */
  [...form.elements['current_crm'].options].some(o => o.text === 'HubSpot')
    && [...form.elements['change_timeline'].options].some(o => /costing us money/.test(o.text))
    ? ok('the option text is the value HubSpot will receive') : bad('a dropdown option was reworded');

  const submit = form.querySelector('[data-submit]');
  submit && submit.classList.contains('btn')
    ? ok('the submit is a boxed button, because it requests something') : bad('submit is not a .btn');
  form.querySelector('[data-form-error]').hasAttribute('hidden')
    ? ok('the error box starts hidden') : bad('the error box is showing at rest');
  const okBox = d.querySelector('[data-form-ok]');
  okBox && okBox.hasAttribute('hidden') && okBox.querySelector('h2')
    ? ok('and the sent state is in the markup, hidden, with a heading to move focus to')
    : bad('no hidden [data-form-ok] with a heading');

  /* Site-wide rules. */
  !/href="\/[^"]/.test(html) && !/src="\/[^\/]/.test(html)
    ? ok('no root-absolute links, so the site works at any base path')
    : bad('a root-absolute link survived relativise()');
  [...d.querySelectorAll('script[src]')].filter(s => !/^(https?:)?\/\//.test(s.getAttribute('src')))
    .every(s => s.getAttribute('src').includes('v=' + STAMP))
    ? ok('cache stamp ' + STAMP + ' on every local script') : bad('a local script has a stale stamp');
  /contact\.js\?v=/.test(html) ? ok('and contact.js is loaded here') : bad('contact.js is not on the page');
  !d.querySelector('.close-panel, [data-close-panel]')
    ? ok('no closing panel: the page is already two calls to action') : bad('a close panel came back');
}

/* ---------- the tabs, with the script running ---------- */
{
  const { w, d } = build();
  w.eval(js);
  const [tMsg, tBook] = [...d.querySelectorAll('[data-tabs] [role="tab"]')];
  const msg = d.getElementById('panel-message'), book = d.getElementById('panel-book');

  tMsg.getAttribute('aria-selected') === 'true' && tBook.getAttribute('tabindex') === '-1'
    ? ok('on load the message tab is selected and the other is out of the tab order')
    : bad('initial tab state is wrong');

  tBook.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  !book.hidden && msg.hidden && tBook.getAttribute('aria-selected') === 'true'
    ? ok('clicking Book a call swaps the panels') : bad('the panels did not swap');

  const loaded = () => [...d.querySelectorAll('script')]
    .filter(s => /MeetingsEmbedCode/.test(s.src || '')).length;
  loaded() === 1 ? ok('and the calendar script is injected exactly once on first reveal')
                 : bad('meetings script injected ' + loaded() + ' times');
  tMsg.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  tBook.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  loaded() === 1 ? ok('and not again on the second visit') : bad('the script is injected on every reveal');

  /* Arrow keys, because a tablist that only answers the mouse is not one. */
  tBook.focus();
  d.querySelector('[data-tabs]').dispatchEvent(
    new w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  tMsg.getAttribute('aria-selected') === 'true'
    ? ok('the arrow keys move between tabs') : bad('arrow keys do nothing');
}

/* ---------- /contact#book lands on the calendar ---------- */
{
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'https://revhops.com/contact#book' });
  const w = dom.window, d = w.document;
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.eval(js);
  !d.getElementById('panel-book').hidden && d.getElementById('panel-message').hidden
    ? ok('a #book link opens the calendar rather than the form') : bad('#book did not select the calendar');
}

/* ---------- the submission ---------- */
function submitWith(respond) {
  const { w, d } = build();
  const calls = [];
  w.fetch = function (url, opt) {
    calls.push({ url: url, body: JSON.parse(opt.body) });
    return Promise.resolve({ ok: respond(calls.length) });
  };
  w.eval(js);
  const form = d.querySelector('[data-contact-form]');
  form.elements['firstname'].value = 'Dana';
  form.elements['lastname'].value = 'Reyes';
  form.elements['email'].value = 'dana@example.com';
  form.elements['company'].value = 'Northwind';
  form.elements['current_crm'].value = 'Pipedrive';
  form.elements['revenue_team_size'].value = '6 to 15';
  form.elements['revops_biggest_struggle'].value = 'Nobody owns the process';
  form.elements['change_timeline'].value = 'This quarter';
  form.elements['message'].value = 'Forecast is guesswork.';
  form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  return new Promise(r => setTimeout(() => r({ w, d, form, calls }), 20));
}

(async function () {
  {
    const { d, form, calls } = await submitWith(() => true);
    calls.length === 1 ? ok('a submission is one request when HubSpot accepts it')
                       : bad(calls.length + ' requests on the happy path');
    /submissions\/v3\/integration\/submit\/46722926\/[0-9a-f-]{36}$/.test(calls[0].url)
      ? ok('to the forms submission endpoint for this portal and form') : bad('posted to ' + calls[0].url);
    const names = calls[0].body.fields.map(f => f.name);
    FIELDS.every(n => names.includes(n))
      ? ok('carrying all nine answers as their own fields') : bad('sent ' + names.join(', '));
    calls[0].body.fields.every(f => f.objectTypeId === '0-1')
      ? ok('typed as contact fields') : bad('a field has the wrong objectTypeId');
    calls[0].body.context.pageUri && calls[0].body.context.pageName
      ? ok('with the page it was sent from') : bad('no page context');

    form.hidden && !d.querySelector('[data-form-ok]').hidden
      ? ok('and the form is replaced by the sent state, so nobody sends it twice')
      : bad('the form is still on screen after sending');
    d.querySelector('[data-form-intro]').hidden
      ? ok('the line counting the questions goes with it')
      : bad('the intro line is still describing a form that has gone');
  }

  {
    /* The path that runs until the four properties exist in the portal. */
    const { d, form, calls } = await submitWith(n => n === 2);
    calls.length === 2 ? ok('a refusal is retried once, not reported') : bad(calls.length + ' requests after a refusal');
    const second = calls[1].body.fields.map(f => f.name);
    !second.some(n => /current_crm|revenue_team_size|revops_biggest_struggle|change_timeline/.test(n))
      ? ok('the retry sends only the fields the HubSpot form already defines')
      : bad('the retry still carries a property that does not exist');
    const msg = calls[1].body.fields.find(f => f.name === 'message').value;
    /Forecast is guesswork/.test(msg) && /CRM today: Pipedrive/.test(msg)
      && /Timeline: This quarter/.test(msg) && /Biggest RevOps struggle: Nobody owns the process/.test(msg)
      ? ok('with the four answers folded into the message, so nothing is lost')
      : bad('the folded message is missing an answer:\n' + msg);
    form.hidden && !d.querySelector('[data-form-ok]').hidden
      ? ok('and the visitor still sees it go') : bad('the fallback did not report success');
  }

  {
    const { d, form } = await submitWith(() => false);
    const err = d.querySelector('[data-form-error]');
    !err.hidden && /team@revhops\.com/.test(err.innerHTML)
      ? ok('two failures show the address rather than swallowing the enquiry')
      : bad('no usable error state');
    /mailto:[^"]*Forecast%20is%20guesswork/.test(err.innerHTML)
      ? ok('and the mailto carries what they had written') : bad('the mailto fallback is empty');
    !form.hidden ? ok('the form stays on screen so it can be sent again') : bad('the form vanished on failure');
    const btn = form.querySelector('[data-submit]');
    !btn.disabled && btn.textContent === 'Send message'
      ? ok('and the button comes back') : bad('the button is stuck at ' + JSON.stringify(btn.textContent));
  }

  /* ---------- every internal link on the page resolves ---------- */
  {
    const { d } = build();
    const dead = [...d.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
      .filter(h => h && !/^(https?:|mailto:|#)/.test(h))
      /* /resources/blog is served by HubSpot, not by this repo. The footer
         comment says so; it is a live URL with no file behind it. */
      .filter(h => h !== 'resources/blog')
      .filter(h => {
        const clean = h.split('#')[0].replace(/^\.\//, '');
        if (!clean) return false;
        return !['', '.html'].some(ext => fs.existsSync(path.join(ROOT, clean + ext)))
          && !fs.existsSync(path.join(ROOT, clean, 'index.html'));
      });
    dead.length === 0 ? ok('every internal link resolves to a page') : bad('dead links: ' + dead.join(', '));
  }

  console.log(fail ? '\n' + fail + ' FAILURE(S)\n' : '\nall contact checks passed\n');
  process.exit(fail ? 1 : 0);
}());
