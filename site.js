/**
 * site.js - KES Component Loader (Offline Safe)
 */
(function () {
  const headerHTML = `<style>
/* ─────────────────────────────────────────────
   GLOBAL DESIGN TOKENS (Self-contained)
───────────────────────────────────────────── */
:root {
  --navy:      #08111f;
  --navy2:     #0c1a30;
  --navy3:     #0f2040;
  --blue:      #1251a3;
  --blue2:     #1565c8;
  --blue3:     #1a7ae8;
  --blue-pale: #fbeae6;
  --blue-alt:  #cc2700;
  --blue-alt2: #a81e00;
  --blue-alt3: #8a1800;
  --white:     #ffffff;
  --off:       #f9f5f4;
  --grey:      #64748b;
  --grey2:     #94a3b8;
  --border:    #dde6f5;
  --text:      #0f1f35;
}

/* ─────────────────────────────────────────────
   TOPBAR
   ───────────────────────────────────────────── */
.topbar { background: var(--navy); padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
.tb-inner { display: flex; justify-content: space-between; align-items: center; }
.tb-left { display: flex; gap: 24px; }
.tb-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(255,255,255,.45); font-weight: 400; }
.tb-item svg { width: 13px; height: 13px; fill: var(--blue-alt); flex-shrink: 0; opacity: .8; }
.tb-right { display: flex; gap: 7px; }
.tb-cert { padding: 2px 9px; border: 1px solid rgba(204,39,0,.3); border-radius: 2px; font-family: 'Barlow Condensed', sans-serif; font-size: 9.5px; font-weight: 700; color: var(--blue-alt); letter-spacing: .08em; text-transform: uppercase; }

/* ─────────────────────────────────────────────
   NAVBAR
   ───────────────────────────────────────────── */
.navbar { border-bottom: 3px solid var(--blue-alt); background: #fff; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 24px rgba(8,17,31,.1); }
.nav-inner { display: flex; align-items: center; justify-content: space-between; height: 68px; }
.logo { display: flex; align-items: center; gap: 13px; cursor: pointer; flex-shrink: 0; text-decoration: none; }
.logo-mark { width: 46px; height: 46px; background: var(--navy); border-radius: 7px; display: grid; place-items: center; flex-shrink: 0; }
.logo-mark svg { width: 22px; height: 22px; }
.logo-text .name { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 16px; color: var(--navy); letter-spacing: .01em; line-height: 1.2; }
.logo-text .sub { font-size: 10px; color: var(--blue-alt); font-weight: 500; letter-spacing: .03em; margin-top: 1px; }

/* Desktop Nav */
.nav-menu { display: flex; align-items: center; height: 68px; gap: 0; }
.nav-item { position: relative; height: 100%; display: flex; align-items: center; }
.nav-link { display: flex; align-items: center; gap: 5px; height: 68px; padding: 0 14px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: .03em; text-transform: uppercase; cursor: pointer; border-bottom: 3px solid transparent; transition: color .2s, border-color .2s; white-space: nowrap; }
.nav-link:hover, .nav-item.active .nav-link { color: var(--blue-alt); border-bottom-color: var(--blue-alt); }
.nav-link .chev { width: 11px; height: 11px; fill: currentColor; transition: transform .22s; flex-shrink: 0; }
.nav-item:hover .nav-link .chev { transform: rotate(180deg); }

/* Dropdown */
.dropdown { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid var(--border); border-radius: 0 0 10px 10px; box-shadow: 0 16px 48px rgba(8,17,31,.16); min-width: 240px; opacity: 0; visibility: hidden; transform: translateY(-6px); transition: all .22s cubic-bezier(.16, 1, .3, 1); z-index: 500; }
.nav-item:hover .dropdown { opacity: 1; visibility: visible; transform: none; }
.dd-item { display: flex; align-items: center; gap: 10px; padding: 12px 18px; font-size: 13px; color: var(--grey); font-weight: 500; cursor: pointer; border-bottom: 1px solid rgba(221,230,245,.5); transition: all .18s; text-decoration: none; }
.dd-item:hover { background: var(--off); color: var(--navy); padding-left: 24px; }
.dd-item .ic { width: 28px; height: 28px; background: var(--off); border-radius: 5px; display: grid; place-items: center; flex-shrink: 0; transition: background .18s; }
.dd-item:hover .ic { background: var(--blue-alt); }

/* Mega */
.mega { min-width: 540px; padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
.mega-hd { font-family: 'Barlow Condensed', sans-serif; font-size: 9.5px; font-weight: 800; color: var(--blue-alt); letter-spacing: .15em; text-transform: uppercase; padding: 8px 6px 5px; grid-column: 1/-1; border-bottom: 1px solid var(--border); margin-bottom: 3px; }
.mega-item { display: flex; align-items: center; gap: 7px; padding: 7px 10px; font-size: 12.5px; color: var(--grey); border-radius: 5px; cursor: pointer; transition: all .15s; font-weight: 500; text-decoration: none; }
.mega-item:hover { background: var(--blue-pale); color: var(--blue2); }
.mega-item::before { content: ''; width: 4px; height: 4px; border-radius: 50%; background: var(--blue-alt); flex-shrink: 0; }

/* CTA + Actions */
.nav-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.nav-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--blue-alt); color: #fff; padding: 10px 22px; border-radius: 3px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; transition: all .22s; text-decoration: none; }
.nav-cta:hover { background: var(--blue-alt2); transform: translateY(-1px); }

/* Hamburger / Mobile */
.menu-toggle { display: none; flex-direction: column; justify-content: center; gap: 5px; width: 36px; height: 36px; cursor: pointer; background: none; border: none; padding: 4px; flex-shrink: 0; }
.menu-toggle .bar { display: block; width: 22px; height: 2px; background: var(--navy); border-radius: 2px; transition: all .3s ease; }
.nav-open .menu-toggle .bar:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav-open .menu-toggle .bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
.nav-open .menu-toggle .bar:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

@media (max-width: 1024px) {
  .menu-toggle { display: flex; }
  .nav-menu { position: fixed; top: 71px; left: 0; right: 0; bottom: 0; background: #fff; flex-direction: column; align-items: stretch; height: auto; transform: translateX(100%); transition: transform .38s cubic-bezier(.16,1,.3,1); z-index: 999; overflow-y: auto; box-shadow: -4px 0 24px rgba(8,17,31,.12); }
  .navbar.nav-open .nav-menu { transform: translateX(0); }
  .nav-item { width: 100%; height: auto; border-bottom: 1px solid var(--border); display: block; }
  .nav-link { height: 56px; width: 100%; padding: 0 28px; justify-content: space-between; font-size: 15px; border-bottom: none; }
  .dropdown { position: static; opacity: 1; visibility: visible; transform: none; box-shadow: none; border: none; border-radius: 0; max-height: 0; overflow: hidden; transition: max-height .35s ease; background: var(--off); min-width: 100%; }
  .nav-item.open .dropdown { max-height: 1500px; }
  .mega { grid-template-columns: 1fr; padding: 8px 28px; min-width: 100%; }
}
</style>

<div class="topbar"><div class="W"><div class="tb-inner">
  <div class="tb-left">
    <span class="tb-item">
      <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      No.79, GF, BHCS Layout, Bommanahalli, Bengaluru &ndash; 560 068
    </span>
    <span class="tb-item">
      <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
      +91 99802 77557
    </span>
    <span class="tb-item">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
      info@kespl.co.in
    </span>
  </div>
  <div class="tb-right">
    <span class="tb-cert">ISO 9001:2015</span>
    <span class="tb-cert">CPRI</span>
    <span class="tb-cert">IEC 61439</span>
  </div>
</div></div></div>


<nav class="navbar"><div class="W nav-inner">
  <div class="logo" onclick="location.href='index.html'">
    <div class="logo-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue-alt)" stroke-width="1.8" stroke-linecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    </div>
    <div class="logo-text">
      <div class="name">Kumara Engineering Solutions</div>
      <div class="sub">Pvt. Ltd. &middot; Est. 2023 &middot; Bengaluru</div>
    </div>
  </div>

  <div class="nav-menu" id="navMenu">
    <div class="nav-item">
      <a href="index.html" class="nav-link">Home</a>
    </div>
    <div class="nav-item">
      <a href="aboutus.html" class="nav-link">About</a>
    </div>
    <div class="nav-item">
      <div class="nav-link">Products <svg class="chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></div>
            <div class="dropdown mega">
        <div class="mega-col">
          <div class="mega-hd">Distribution Panels</div>
          <div class="mega-item" onclick="location.href='products.html#lt-panel'">LT Panel</div>
          <div class="mega-item" onclick="location.href='products.html#mcc-panel'">MCC Panel</div>
          <div class="mega-item" onclick="location.href='products.html#pcc-panel'">PCC Panel</div>
          <div class="mega-item" onclick="location.href='products.html#pmcc-panel'">PMCC Panel</div>
          <div class="mega-item" onclick="location.href='products.html#power-dist'">Power Distribution</div>
          <div class="mega-item" onclick="location.href='products.html#raw-power'">Raw Power Panel</div>
        </div>
        <div class="mega-col">
          <div class="mega-hd">Control & Sync</div>
          <div class="mega-item" onclick="location.href='products.html#dg-sync'">DG Synch Panel</div>
          <div class="mega-item" onclick="location.href='products.html#apfc-panel'">APFC Panel</div>
          <div class="mega-item" onclick="location.href='products.html#ats-panel'">ATS Panel</div>
          <div class="mega-item" onclick="location.href='products.html#plc-panel'">PLC Control Panel</div>
          <div class="mega-item" onclick="location.href='products.html#vfd-panel'">VFD Panel</div>
          <div class="mega-item" onclick="location.href='products.html#meter-panel'">Meter Panel</div>
        </div>
        <div class="mega-col">
          <div class="mega-hd">Building & HVAC</div>
          <div class="mega-item" onclick="location.href='products.html#hvac-panel'">HVAC Panel</div>
          <div class="mega-item" onclick="location.href='products.html#ahu-panel'">AHU Control Panel</div>
          <div class="mega-item" onclick="location.href='products.html#lift-panel'">Lift Control Panel</div>
          <div class="mega-item" onclick="location.href='products.html#lighting-panel'">Street/Aviation Light</div>
        </div>
        <div class="mega-col">
          <div class="mega-hd">Infrastructure</div>
          <div class="mega-item" onclick="location.href='products.html#busduct'">HV & LV Bus Duct</div>
          <div class="mega-item" onclick="location.href='products.html#cable-tray'">Cable Tray & Raceway</div>
        </div>
      </div>
    </div>
    <div class="nav-item">
      <div class="nav-link">Services <svg class="chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></div>
            <div class="dropdown">
        <div class="dd-item" onclick="location.href='services.html#consultancy'"><div class="ic"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div> Engineering Consultancy</div>
        <div class="dd-item" onclick="location.href='services.html#design'"><div class="ic"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div> Design & MEPF Services</div>
        <div class="dd-item" onclick="location.href='services.html#works'"><div class="ic"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></div> Works Contracts & PM</div>
        <div class="dd-item" onclick="location.href='services.html#manufacturing'"><div class="ic"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="22 4 12 14.01 9 11.01"/></svg></div> Manufacturing & AMC</div>
      </div>
    </div>
    <div class="nav-item">
      <a href="process.html" class="nav-link">Process</a>
    </div>
    <div class="nav-item">
      <a href="contactus.html" class="nav-link">Contact</a>
    </div>
  </div>

  <div class="nav-actions">
    <a href="contactus.html" class="nav-cta">Get a Quote <span class="arr">&#8594;</span></a>
    <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
  </div>
</div></nav>`;
  const footerHTML = `<style>
/* ─────────────────────────────────────────────
   GLOBAL DESIGN TOKENS (Self-contained)
───────────────────────────────────────────── */
:root {
  --navy:      #08111f;
  --navy2:     #0c1a30;
  --navy3:     #0f2040;
  --blue:      #1251a3;
  --blue2:     #1565c8;
  --blue3:     #1a7ae8;
  --blue-pale: #fbeae6;
  --blue-alt:  #cc2700;
  --blue-alt2: #a81e00;
  --blue-alt3: #8a1800;
  --white:     #ffffff;
  --off:       #f9f5f4;
  --grey:      #64748b;
  --grey2:     #94a3b8;
  --border:    #dde6f5;
  --text:      #0f1f35;
}

/* ─────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────── */
footer { background: var(--navy); color: #fff; padding: 72px 0 0; }
.ft-grid { display: grid; grid-template-columns: 2.2fr 1fr 1fr 1.35fr; gap: 56px; padding-bottom: 56px; border-bottom: 1px solid rgba(255,255,255,.07); }
.ft-logo { display: flex; align-items: center; gap: 13px; margin-bottom: 17px; }
.fl-mk { width: 42px; height: 42px; border-radius: 6px; background: var(--blue); display: grid; place-items: center; flex-shrink: 0; }
.fl-mk svg { width: 20px; height: 20px; }
.fl-nm { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 15px; color: #fff; letter-spacing: .01em; line-height: 1.2; }
.fl-sub { font-size: 10px; color: var(--blue-alt); letter-spacing: .05em; text-transform: uppercase; margin-top: 1px; }
.ft-desc { font-size: 13.5px; line-height: 1.82; color: rgba(255,255,255,.3); font-weight: 300; margin-bottom: 24px; max-width: 320px; }
.ft-soc { display: flex; gap: 8px; }
.fsoc { width: 36px; height: 36px; border-radius: 6px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); display: grid; place-items: center; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; color: rgba(255,255,255,.38); transition: all .2s; text-decoration: none; }
.fsoc:hover { background: var(--blue-alt); color: #fff; border-color: var(--blue-alt); }
.ft-col h4 { font-family: 'Barlow Condensed', sans-serif; font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,.2); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.06); letter-spacing: .14em; text-transform: uppercase; }
.ft-links { display: flex; flex-direction: column; gap: 10px; }
.ft-links a { font-size: 13.5px; color: rgba(255,255,255,.36); font-weight: 300; cursor: pointer; transition: color .2s; display: flex; align-items: center; gap: 7px; text-decoration: none; }
.ft-links a:hover { color: rgba(255,255,255,.78); }
.ft-links a::before { content: ''; width: 6px; height: 2px; background: var(--blue-alt); opacity: .4; flex-shrink: 0; transition: width .2s, opacity .2s; }
.ft-links a:hover::before { width: 12px; opacity: 1; }
.ft-contact { display: flex; flex-direction: column; gap: 11px; }
.fc-i { display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; color: rgba(255,255,255,.34); line-height: 1.6; font-weight: 300; }
.ft-bottom { padding: 22px 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.ft-bottom p { font-size: 11.5px; color: rgba(255,255,255,.2); }
.ft-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.ftb { padding: 3px 9px; border: 1px solid rgba(204,39,0,.22); border-radius: 2px; font-family: 'Barlow Condensed', sans-serif; font-size: 9.5px; font-weight: 700; color: var(--blue-alt); letter-spacing: .09em; text-transform: uppercase; }

/* Back to Top */
#btt { position: fixed; bottom: 28px; right: 28px; z-index: 999; width: 44px; height: 44px; border-radius: 6px; background: var(--blue-alt); color: #fff; display: none; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; box-shadow: 0 4px 18px rgba(204,39,0,.4); cursor: pointer; transition: all .22s; font-family: 'Barlow Condensed', sans-serif; border: none; outline: none; }
#btt.on { display: flex; }
#btt:hover { background: var(--blue-alt2); transform: translateY(-3px); }

@media (max-width: 1024px) {
  .ft-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .ft-grid { grid-template-columns: 1fr; }
}
</style>

<!-- FOOTER -->
<footer>
  <div class="W">
    <div class="ft-grid">
      <div>
        <div class="ft-logo">
          <div class="fl-mk">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue-alt)" stroke-width="1.8" stroke-linecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div>
            <div class="fl-nm">Kumara Engineering Solutions</div>
            <div class="fl-sub">Private Limited &middot; Est. 2023</div>
          </div>
        </div>
        <p class="ft-desc">The True Leader in End-to-End Power Distribution, Control Systems and Turnkey Electrical Solutions. Serving Karnataka and beyond &mdash; built on 16+ years of inherited excellence.</p>
        <div class="ft-soc">
          <a href="#" class="fsoc">in</a>
          <a href="#" class="fsoc">fb</a>
          <a href="#" class="fsoc">yt</a>
        </div>
      </div>
      <div class="ft-col">
        <h4>Quick Links</h4>
        <div class="ft-links">
          <a href="index.html">Home</a>
          <a href="aboutus.html">About Us</a>
          <a href="products.html">Products</a>
          <a href="services.html">Services</a>
          <a href="process.html">Manufacturing Process</a>
          <a href="contactus.html">Contact</a>
        </div>
      </div>
      <div class="ft-col">
        <h4>Products</h4>
        <div class="ft-links">
          <a href="products.html#lt-panel">LT Panel</a>
          <a href="products.html#mcc-panel">MCC Panel</a>
          <a href="products.html#plc-panel">PLC Control Panel</a>
          <a href="products.html#apfc-panel">APFC Panel</a>
          <a href="products.html#busduct">HV &amp; LV Bus Duct</a>
          <a href="products.html#vfd-panel">VFD Panel</a>
          <a href="products.html#ats-panel">ATS Panel</a>
          <a href="products.html#dg-panel">DG Sync Panel</a>
        </div>
      </div>
      <div class="ft-col">
        <h4>Contact Us</h4>
        <div class="ft-contact">
          <div class="fc-i"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/></svg> No.79, GF, BHCS Layout, Viratnagar, Bommanahalli, Bengaluru &ndash; 560 068</div>
          <div class="fc-i"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> +91 80 2573 7557 &nbsp;/&nbsp; +91 99802 77557</div>
          <div class="fc-i"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 6l-10 7L2 6"/></svg> info@kespl.co.in</div>
          <div class="fc-i"><svg viewBox="0 0 24 24" fill="none" class="svg-ic"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"/></svg> Mon&ndash;Sat &middot; 9 AM &ndash; 6 PM IST</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:18px">
          <span class="ftb">IEC 61439</span>
          <span class="ftb">IS:8623</span>
          <span class="ftb">CPRI</span>
          <span class="ftb">ISO 9001</span>
        </div>
      </div>
    </div>
    <div class="ft-bottom">
      <p>&copy; 2025 Kumara Engineering Solutions Private Limited. All rights reserved.</p>
      <div class="ft-badges">
        <span class="ftb">ISO Certified</span>
        <span class="ftb">Class I Contractor</span>
        <span class="ftb">GSTIN: 29ANNPB3536E1Z3</span>
        <span class="ftb">Bengaluru, Karnataka</span>
      </div>
    </div>
  </div>
</footer>

<button id="btt" onclick="window.scrollTo({top:0,behavior:'smooth'})">&uarr;</button>`;

  const headerSlot = document.getElementById('site-header');
  const footerSlot = document.getElementById('site-footer');

  if (headerSlot) headerSlot.outerHTML = headerHTML;
  if (footerSlot) footerSlot.outerHTML = footerHTML;

  function setActiveNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(function (item) {
      const a = item.querySelector('a.nav-link');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href === page || (page === '' && href === 'index.html')) {
        item.classList.add('active');
      }
    });
  }

  function initNav() {
    const navbar = document.querySelector('.navbar');
    const toggle = document.getElementById('menuToggle');
    const navItems = document.querySelectorAll('.nav-item');
    if (!navbar) return;

    toggle && toggle.addEventListener('click', function () {
      navbar.classList.toggle('nav-open');
      document.body.style.overflow = navbar.classList.contains('nav-open') ? 'hidden' : '';
    });

    navItems.forEach(function (item) {
      const link = item.querySelector(':scope > .nav-link');
      const dropdown = item.querySelector(':scope > .dropdown');
      if (!link || !dropdown) return;
      link.addEventListener('click', function (e) {
        if (window.innerWidth > 1024) return;
        e.preventDefault();
        const opening = !item.classList.contains('open');
        navItems.forEach(function (i) { i.classList.remove('open'); });
        if (opening) item.classList.add('open');
      });
    });

    document.querySelectorAll('.nav-menu a.nav-link, .mega-item, .dd-item').forEach(function (el) {
      el.addEventListener('click', function () {
        navbar.classList.remove('nav-open');
        document.body.style.overflow = '';
        navItems.forEach(function (i) { i.classList.remove('open'); });
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) {
        navbar.classList.remove('nav-open');
        document.body.style.overflow = '';
        navItems.forEach(function (i) { i.classList.remove('open'); });
      }
    });

    var btt = document.getElementById('btt');
    window.addEventListener('scroll', function () {
      navbar.style.boxShadow = scrollY > 10
        ? '0 2px 28px rgba(8,17,31,.14)'
        : '0 2px 24px rgba(8,17,31,.10)';
      if (btt) btt.classList.toggle('on', scrollY > 400);
    }, { passive: true });
  }

  function initReveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('in');
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    document.querySelectorAll('.rv, .rl, .rr').forEach(function (el) { io.observe(el); });
  }

  setTimeout(function() {
    setActiveNav();
    initNav();
    initReveal();
  }, 0);
})();
