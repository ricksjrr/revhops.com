/* ==========================================================================
   RevHops — the contact page (/contact)

   Two jobs, and they are deliberately separate.

   1. THE TABS.  Send a message / Book a call, one panel on screen at a time.
      Both panels are in the markup with nothing hidden, so with JavaScript
      off the visitor gets the form and the calendar stacked rather than a
      dead control and an unreachable panel. This script is what hides the
      inactive one, which is the only order that degrades correctly.

      The calendar's embed script is loaded on first reveal, not on page
      load, from `data-panel-script`. Two reasons: HubSpot's meetings widget
      measures itself when its script runs, and a container that is
      `display: none` at that moment can come back with no height; and
      somebody who only wanted the form never pays for the request.

   2. THE FORM.  This is NOT a HubSpot embed. It is the site's own markup,
      using the .form / .field components already in site.css, posting to
      HubSpot's forms submission endpoint — which is public, takes no key
      and sends CORS headers, so a static page on GitHub Pages can call it.

      THE ENDPOINT VALIDATES EVERY FIELD NAME against the form definition in
      HubSpot and rejects the whole submission if one of them is unknown. The
      four qualification properties do not exist in the portal yet, so the
      post runs twice: the structured payload first, and if HubSpot refuses
      it, the four answers are folded into `message` as labelled lines and
      only the fields the form has always had are sent.

      So the enquiry arrives either way, and it arrives complete either way.
      The moment the properties exist and are on the form, the first attempt
      starts succeeding and nothing in this file changes. That is the whole
      point of the two attempts — do not "simplify" it to one until the
      properties are live, and see HANDOFF.md for what has to be created.

      `hutk` is HubSpot's own tracking cookie, dropped by the tracking script
      in the head of every page. Passing it is what ties the submission to
      the rest of the visitor's session instead of creating a contact with no
      history behind it.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- the tabs ---------------------------------------------------- */

  var tabsRoot = document.querySelector('[data-tabs]');
  if (tabsRoot) {
    var tabs = [].slice.call(tabsRoot.querySelectorAll('[data-tab]'));
    var panels = tabs.map(function (t) {
      return document.getElementById(t.getAttribute('data-tab'));
    });

    function wake(panel) {
      if (!panel) return;
      var src = panel.getAttribute('data-panel-script');
      if (!src || panel.getAttribute('data-panel-loaded')) return;
      panel.setAttribute('data-panel-loaded', '1');
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      document.body.appendChild(s);
    }

    function show(i, moveFocus) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        if (panels[n]) panels[n].hidden = !on;
      });
      if (moveFocus && tabs[i]) tabs[i].focus();
      wake(panels[i]);
      /* replaceState rather than location.hash: setting the hash scrolls the
         panel under the floating nav, and the tab is a view of this page
         rather than a place on it. */
      var id = tabs[i].getAttribute('data-hash');
      if (id && window.history && history.replaceState) {
        history.replaceState(null, '', id === 'message' ? location.pathname : '#' + id);
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
    });

    tabsRoot.addEventListener('keydown', function (e) {
      var at = tabs.indexOf(document.activeElement);
      if (at < 0) return;
      var to = null;
      if (e.key === 'ArrowRight') to = (at + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') to = (at - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = tabs.length - 1;
      if (to === null) return;
      e.preventDefault();
      show(to, true);
    });

    /* /contact#book lands on the calendar. Anything else lands on the form. */
    var start = 0;
    tabs.forEach(function (t, i) {
      if ('#' + t.getAttribute('data-hash') === location.hash) start = i;
    });
    show(start);
  }

  /* ---------- the form --------------------------------------------------- */

  var form = document.querySelector('[data-contact-form]');
  if (!form) return;

  var PORTAL = form.getAttribute('data-portal');
  var GUID = form.getAttribute('data-form');
  var ENDPOINT = 'https://api.hsforms.com/submissions/v3/integration/submit/' +
                 PORTAL + '/' + GUID;

  /* The fields the HubSpot contact form has always had. Attempt two sends
     only these. */
  var CORE = ['firstname', 'lastname', 'email', 'company', 'message'];

  /* The four that need properties creating. The label is what they are
     called inside `message` when attempt one is refused, so it has to read
     as a line in an email rather than as a property name. */
  var EXTRA = [
    ['current_crm', 'CRM today'],
    ['revenue_team_size', 'Revenue team size'],
    ['revops_biggest_struggle', 'Biggest RevOps struggle'],
    ['change_timeline', 'Timeline']
  ];

  var btn = form.querySelector('[data-submit]');
  var btnLabel = btn ? btn.textContent : 'Send message';
  var errBox = form.querySelector('[data-form-error]');
  var okBox = document.querySelector('[data-form-ok]');

  function val(name) {
    var el = form.elements[name];
    return el && el.value ? String(el.value).trim() : '';
  }

  function hutk() {
    var m = document.cookie.match(/(^|;)\s*hubspotutk=([^;]*)/);
    return m ? decodeURIComponent(m[2]) : '';
  }

  /* The qualification answers as labelled lines, appended to whatever the
     visitor wrote. Used by attempt two, and by the mailto fallback. */
  function folded() {
    var lines = EXTRA.map(function (f) {
      var v = val(f[0]);
      return v ? f[1] + ': ' + v : '';
    }).filter(Boolean);
    var body = val('message');
    return lines.length ? body + '\n\n' + lines.join('\n') : body;
  }

  function payload(names, message) {
    var fields = names.map(function (n) {
      return {
        objectTypeId: '0-1',
        name: n,
        value: n === 'message' && message != null ? message : val(n)
      };
    }).filter(function (f) { return f.value !== ''; });

    return JSON.stringify({
      submittedAt: Date.now(),
      fields: fields,
      context: {
        hutk: hutk() || undefined,
        pageUri: location.href,
        pageName: document.title
      }
    });
  }

  function post(body) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    }).then(function (r) { return r.ok; }, function () { return false; });
  }

  function fail() {
    if (!errBox) return;
    var href = 'mailto:team@revhops.com?subject=' +
      encodeURIComponent('Enquiry from ' + (val('company') || 'the website')) +
      '&body=' + encodeURIComponent(folded());
    errBox.innerHTML = 'That did not go through. Send it to ' +
      '<a href="' + href + '">team@revhops.com</a> instead and we will ' +
      'pick it up from there.';
    errBox.hidden = false;
  }

  function done() {
    if (!okBox) return;
    form.hidden = true;
    /* The line above the form counts the questions. Left on screen over the
       sent state it is describing a form that is no longer there. */
    var intro = document.querySelector('[data-form-intro]');
    if (intro) intro.hidden = true;
    okBox.hidden = false;
    /* The heading, not the panel: a focus target that is not itself
       focusable needs the tabindex, and a panel would read its whole
       contents out as one string. */
    var h = okBox.querySelector('h2, h3');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (errBox) errBox.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Sending'; }

    var structured = CORE.concat(EXTRA.map(function (f) { return f[0]; }));

    post(payload(structured))
      .then(function (ok) {
        if (ok) return true;
        return post(payload(CORE, folded()));
      })
      .then(function (ok) {
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
        if (ok) done(); else fail();
      });
  });
}());
