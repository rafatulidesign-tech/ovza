/* OVZA Trust Services — landing page interactions
   - Jurisdiction data is read from the #jurisdictions cards in the HTML
     (single source of truth: edit prices there).
   - Builder state persists in sessionStorage so it survives navigation. */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var STORAGE_KEY = "ovza-trust-builder";
  var MAX_BENEFICIARIES = 5;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function storage(action, value) {
    try {
      if (action === "get") return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (e) { return null; }
  }

  function formatUSD(n) {
    return "USD $" + Number(n).toLocaleString("en-US");
  }

  function flash(el) {
    if (!el || reduceMotion) return;
    el.classList.remove("flash");
    void el.offsetWidth; // restart animation
    el.classList.add("flash");
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = $(".nav-toggle");
  var nav = $("#primary-nav");
  if (navToggle && nav) {
    var setNav = function (open) {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); navToggle.focus(); }
    });
    window.matchMedia("(min-width: 1081px)").addEventListener("change", function (mq) { if (mq.matches) setNav(false); });
  }

  /* ---------- Jurisdiction data (from HTML cards) ---------- */
  var jurisdictions = {};
  $$("[data-jurisdiction]").forEach(function (card) {
    var d = card.dataset;
    jurisdictions[d.jurisdiction] = {
      id: d.jurisdiction,
      name: d.name,
      flag: d.flag,
      registration: Number(d.registration),
      renewal: Number(d.renewal),
      days: d.days
    };
  });

  /* ---------- Trust builder ---------- */
  var form = $("#trust-builder");
  if (form) {
    var els = {
      name: $("#trust-name"),
      nameField: $("#trust-name").closest(".field"),
      jurisdiction: $("#jurisdiction"),
      wishesToggle: $("#wishes-toggle"),
      wishesPanel: $("#wishes-panel"),
      wishes: $("#wishes"),
      beneficiaryList: $("#beneficiary-list"),
      addBeneficiary: $("#add-beneficiary"),
      outName: $("#out-name"),
      outFlag: $("#out-flag"),
      outJurisdiction: $("#out-jurisdiction"),
      outTrustee: $("#out-trustee"),
      outBeneficiaries: $("#out-beneficiaries"),
      outWishes: $("#out-wishes"),
      outReg: $("#out-registration"),
      outRenewal: $("#out-renewal"),
      outDays: $("#out-days"),
      status: $("#builder-status"),
      progress: $$(".builder__steps span")
    };

    // Populate jurisdiction select from card data
    Object.keys(jurisdictions).forEach(function (id) {
      var j = jurisdictions[id];
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = j.flag + "  " + j.name;
      els.jurisdiction.appendChild(opt);
    });

    var benCounter = 0;
    function addBeneficiaryRow(data, focus) {
      if (els.beneficiaryList.children.length >= MAX_BENEFICIARIES) return;
      benCounter += 1;
      var id = "ben-" + benCounter;
      var row = document.createElement("div");
      row.className = "beneficiary";
      row.innerHTML =
        '<label class="visually-hidden" for="' + id + '-name">Beneficiary name</label>' +
        '<input class="input" id="' + id + '-name" type="text" maxlength="60" placeholder="Beneficiary name" autocomplete="off">' +
        '<label class="visually-hidden" for="' + id + '-type">Beneficiary type</label>' +
        '<select class="select" id="' + id + '-type"><option value="Individual">Individual</option><option value="Company">Company</option><option value="Charity">Charity</option></select>' +
        '<button type="button" class="icon-btn" aria-label="Remove beneficiary">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
      var nameInput = row.querySelector("input");
      var typeSelect = row.querySelector("select");
      if (data) { nameInput.value = data.name || ""; typeSelect.value = data.type || "Individual"; }
      row.querySelector("button").addEventListener("click", function () {
        row.remove();
        update();
        els.addBeneficiary.focus();
      });
      els.beneficiaryList.appendChild(row);
      if (focus) nameInput.focus();
      update();
    }

    function readState() {
      return {
        name: els.name.value.trim(),
        jurisdiction: els.jurisdiction.value,
        wishesEnabled: els.wishesToggle.checked,
        wishes: els.wishes.value.trim(),
        beneficiaries: $$(".beneficiary", els.beneficiaryList).map(function (row) {
          return { name: row.querySelector("input").value.trim(), type: row.querySelector("select").value };
        })
      };
    }

    var lastJurisdiction = null;
    function update() {
      var s = readState();
      var j = jurisdictions[s.jurisdiction];

      // Trust name on diagram
      if (s.name) {
        els.outName.textContent = /trust$/i.test(s.name) ? s.name : s.name + " Trust";
        els.outName.classList.remove("is-placeholder");
      } else {
        els.outName.textContent = "Your trust name";
        els.outName.classList.add("is-placeholder");
      }
      if (s.name.length >= 3) els.nameField.classList.remove("has-error");

      // Jurisdiction-dependent values
      if (j) {
        var changed = lastJurisdiction !== j.id;
        var apply = function () {
          els.outFlag.textContent = j.flag;
          els.outJurisdiction.textContent = j.name;
          els.outTrustee.textContent = "Local trustee · " + j.name;
          els.outReg.textContent = formatUSD(j.registration);
          els.outRenewal.textContent = formatUSD(j.renewal);
          els.outDays.textContent = j.days + " business days";
          els.outFlag.classList.remove("is-swapping");
        };
        if (changed && lastJurisdiction !== null && !reduceMotion) {
          els.outFlag.classList.add("is-swapping");
          setTimeout(apply, 200);
          flash(els.outReg); flash(els.outRenewal);
        } else { apply(); }
        lastJurisdiction = j.id;
      }

      // Beneficiaries
      var named = s.beneficiaries.filter(function (b) { return b.name; });
      if (named.length) {
        els.outBeneficiaries.textContent = named.map(function (b) { return b.name; }).join(", ");
      } else {
        els.outBeneficiaries.textContent = s.beneficiaries.length
          ? s.beneficiaries.length + " beneficiar" + (s.beneficiaries.length === 1 ? "y" : "ies")
          : "Add who the trust is for";
      }
      els.addBeneficiary.disabled = s.beneficiaries.length >= MAX_BENEFICIARIES;

      // Letter of wishes
      els.outWishes.textContent = s.wishesEnabled
        ? (s.wishes ? "“" + s.wishes + "”" : "Your personal guidance")
        : "Optional";

      // Progress indicator
      var done = [!!j, s.name.length >= 3, s.beneficiaries.length > 0, s.wishesEnabled];
      els.progress.forEach(function (bar, i) { bar.classList.toggle("is-done", done[i]); });
      var ready = s.name.length >= 3 && !!j;
      els.status.className = "status-badge" + (ready ? "" : " status-badge--pending");
      els.status.innerHTML = ready
        ? '<span aria-hidden="true">✓</span> Ready for checkout'
        : '<span aria-hidden="true">●</span> In progress';

      storage("set", s);
    }

    function setWishes(open, focus) {
      els.wishesPanel.classList.toggle("is-open", open);
      els.wishesPanel.setAttribute("aria-hidden", String(!open));
      els.wishes.tabIndex = open ? 0 : -1;
      if (open && focus) setTimeout(function () { els.wishes.focus(); }, reduceMotion ? 0 : 150);
    }

    // Restore saved state (or ?jurisdiction= param)
    var saved = storage("get");
    var params = new URLSearchParams(window.location.search);
    if (saved) {
      els.name.value = saved.name || "";
      if (jurisdictions[saved.jurisdiction]) els.jurisdiction.value = saved.jurisdiction;
      els.wishesToggle.checked = !!saved.wishesEnabled;
      els.wishes.value = saved.wishes || "";
      (saved.beneficiaries || []).forEach(function (b) { addBeneficiaryRow(b, false); });
    }
    if (jurisdictions[params.get("jurisdiction")]) els.jurisdiction.value = params.get("jurisdiction");
    setWishes(els.wishesToggle.checked, false);

    // Events
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    els.wishesToggle.addEventListener("change", function () { setWishes(els.wishesToggle.checked, true); });
    els.addBeneficiary.addEventListener("click", function () { addBeneficiaryRow(null, true); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = readState();
      if (s.name.length < 3) {
        els.nameField.classList.add("has-error");
        els.name.setAttribute("aria-invalid", "true");
        els.name.focus();
        return;
      }
      els.name.removeAttribute("aria-invalid");
      storage("set", s);
      // Hand-off to checkout. Replace with the real OVZA checkout route.
      var q = new URLSearchParams({ jurisdiction: s.jurisdiction, name: s.name });
      window.location.href = form.getAttribute("action") + "?" + q.toString();
    });

    // "Get started" buttons on jurisdiction cards pre-select the builder
    $$("[data-select-jurisdiction]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        els.jurisdiction.value = btn.getAttribute("data-select-jurisdiction");
        update();
        $("#top").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        setTimeout(function () { els.name.focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
      });
    });

    update();
  }

  /* ---------- FAQ accordion (single open, arrow-key navigation) ---------- */
  var faqButtons = $$(".faq__btn");
  function setFaq(btn, open) {
    var item = btn.closest(".faq__item");
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", String(open));
    item.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
  }
  faqButtons.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      var willOpen = btn.getAttribute("aria-expanded") !== "true";
      faqButtons.forEach(function (b) { if (b !== btn) setFaq(b, false); });
      setFaq(btn, willOpen);
    });
    btn.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowDown") next = faqButtons[(i + 1) % faqButtons.length];
      if (e.key === "ArrowUp") next = faqButtons[(i - 1 + faqButtons.length) % faqButtons.length];
      if (e.key === "Home") next = faqButtons[0];
      if (e.key === "End") next = faqButtons[faqButtons.length - 1];
      if (next) { e.preventDefault(); next.focus(); }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Footer year ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
