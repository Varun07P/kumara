/**
 * site.js - KES Component Loader (Offline Safe)
 */
(function () {
  const headerHTML = `<style>
/* --------------------------------
   GLOBAL DESIGN TOKENS (Self-contained)
-------------------------------- */
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

/* --------------------------------
   TOPBAR
   -------------------------------- */
.topbar { background: var(--navy); padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
.tb-inner { display: flex; justify-content: space-between; align-items: center; }
.tb-left { display: flex; gap: 24px; }
.tb-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(255,255,255,.9); font-weight: 400; }
.tb-item svg { width: 13px; height: 13px; fill: var(--blue-alt); flex-shrink: 0; opacity: .8; }
.tb-right { display: flex; gap: 7px; }
.tb-cert { padding: 2px 9px; border: 1px solid rgba(204,39,0,.3); border-radius: 2px; font-family: 'Barlow Condensed', sans-serif; font-size: 9.5px; font-weight: 700; color: var(--blue-alt); letter-spacing: .08em; text-transform: uppercase; }

/* --------------------------------
   NAVBAR
-------------------------------- */
.navbar { border-bottom: 3px solid var(--blue-alt); background: #fff; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 24px rgba(8,17,31,.1); width: 100%; }
.nav-inner { display: flex; align-items: center; justify-content: space-between; height: 68px; position: relative; z-index: 10; }
.logo { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; text-decoration: none; }
.logo img { height: 46px; width: auto; display: block; }

/* Desktop Nav */
.nav-menu { display: flex; align-items: center; height: 68px; gap: 0; }
.nav-item { position: relative; height: 100%; display: flex; align-items: center; }
.nav-link { display: flex; align-items: center; gap: 5px; height: 68px; padding: 0 14px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: .03em; text-transform: uppercase; cursor: pointer; border-bottom: 3px solid transparent; transition: color .2s, border-color .2s; white-space: nowrap; text-decoration: none; }
.nav-link:hover, .nav-item.active .nav-link { color: var(--blue-alt); border-bottom-color: var(--blue-alt); }
.nav-link .chev { width: 11px; height: 11px; fill: currentColor; transition: transform .22s; flex-shrink: 0; }
.nav-item:hover .nav-link .chev, .nav-item.open .nav-link .chev { transform: rotate(180deg); }

/* Dropdown (Desktop Default) */
.dropdown { position: absolute; top: calc(100% + 3px); left: 0; background: #fff; border: 1px solid var(--border); border-radius: 0 12px 12px 12px; box-shadow: 0 24px 64px rgba(8,17,31,.18); opacity: 0; visibility: hidden; transform: translateY(-8px); transition: all .25s cubic-bezier(.16, 1, .3, 1); z-index: 500; }
.nav-item:hover .dropdown { opacity: 1; visibility: visible; transform: none; }
.mega-dropdown { position: fixed; left: 50%; transform: translateX(-50%) translateY(-10px); background: #fff; border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 28px 72px rgba(8,17,31,.22); opacity: 0; visibility: hidden; transition: all .28s cubic-bezier(.16,1,.3,1); z-index: 9999; }
.mega-parent:hover .mega-dropdown { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }

/* Mega Content Classes */
.mega-products { width: 1120px; max-width: 94vw; padding: 28px 32px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; }
.mega-services { width: 720px; max-width: 94vw; padding: 24px; display: block; }

.mega-col { padding: 0 18px; border-right: 1px solid var(--border); }
.mega-col:first-child { padding-left: 0; }
.mega-col:last-child { border-right: none; padding-right: 0; }
.mega-hd { display:flex; align-items:center; gap:6px; font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 800; color: var(--blue-alt); letter-spacing: .14em; text-transform: uppercase; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 2px solid rgba(204,39,0,.12); white-space: nowrap; }
.mega-hd .mh-cnt { font-size:9px; font-weight:600; color:var(--grey2); background:var(--off); padding:1px 6px; border-radius:8px; letter-spacing:.05em; }
.mega-item { display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 12.5px; color: var(--grey); cursor: pointer; transition: all .18s; font-weight: 500; text-decoration: none; border-radius: 6px; line-height: 1.3; margin:0 -6px; }
.mega-item:hover { color: var(--blue-alt); background:rgba(204,39,0,.04); padding-left: 10px; }
.mega-item::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--blue-alt); flex-shrink: 0; opacity: .2; transition: opacity .15s, transform .15s; }
.mega-item:hover::before { opacity: 1; transform:scale(1.3); }

/* Ultra-Compact Low-Height Services Dropdown */
.svc-compact-dropdown {
  position: absolute;
  top: calc(100% + 3px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  width: 760px;
  max-width: 95vw;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 16px 44px rgba(8,17,31,.16);
  opacity: 0;
  visibility: hidden;
  transition: all .2s cubic-bezier(.16,1,.3,1);
  z-index: 9999;
}
.nav-item:hover .svc-compact-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.svc-side-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sc-card {
  background: var(--off);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all .18s ease;
}
.sc-card:hover {
  background: #ffffff;
  border-color: rgba(204,39,0,.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(6,14,26,.06);
}

.sc-ico {
  width: 34px;
  height: 34px;
  border-radius: 7px;
  background: rgba(204,39,0,.08);
  border: 1px solid rgba(204,39,0,.18);
  color: var(--blue-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .18s ease;
}
.sc-card:hover .sc-ico {
  background: var(--blue-alt);
  color: #fff;
  border-color: var(--blue-alt);
}
.sc-ico svg {
  width: 17px;
  height: 17px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sc-body {
  flex: 1;
  min-width: 0;
}
.sc-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: var(--navy);
  text-transform: uppercase;
  letter-spacing: .02em;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sc-arr {
  font-size: 12px;
  color: var(--grey2);
  transition: all .18s ease;
}
.sc-card:hover .sc-arr {
  color: var(--blue-alt);
  transform: translateX(3px);
}
.sc-sub {
  font-size: 11px;
  color: var(--grey);
  line-height: 1.25;
  font-weight: 400;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sc-footer {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--border-sub);
  text-align: center;
}
.sc-footer a {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  font-weight: 800;
  color: var(--blue-alt);
  text-transform: uppercase;
  letter-spacing: .06em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  transition: gap .18s ease;
}
.sc-footer a:hover {
  gap: 7px;
  text-decoration: underline;
}

.mega-products .mega-drop-footer { grid-column: 1 / -1; }
.mega-drop-footer { margin-top: 24px; padding: 18px 24px; background: rgba(204,39,0,.03); border-radius: 10px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(204,39,0,.08); }
.mega-drop-footer span { font-size: 12.5px; color: var(--grey); font-weight: 500; }
.mega-drop-footer a { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: #fff; background: var(--blue-alt); text-transform: uppercase; letter-spacing: .08em; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 6px; transition: all .25s; }
.mega-drop-footer a:hover { background: var(--blue-alt2); transform: translateY(-1px); gap: 12px; box-shadow: 0 4px 12px rgba(204,39,0,.15); }

/* Actions — z-index keeps hamburger/close visible above mobile menu */
.nav-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.nav-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--blue-alt); color: #fff; padding: 10px 22px; border-radius: 3px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; transition: all .22s; text-decoration: none; }
.nav-cta:hover { background: var(--blue-alt2); transform: translateY(-1px); }

/* Hamburger / Mobile Toggle */
.menu-toggle { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: pointer; background: none; border: none; padding: 0; flex-shrink: 0; }
.menu-toggle .bar-box { width: 24px; height: 18px; position: relative; }
.menu-toggle .bar { position: absolute; left: 0; top: 50%; display: block; width: 24px; height: 2.5px; background: var(--navy); border-radius: 2px; margin-top: -1px; transition: all .32s cubic-bezier(0.4, 0, 0.2, 1); }
.menu-toggle .bar:nth-child(1) { transform: translateY(-8px); }
.menu-toggle .bar:nth-child(2) { opacity: 1; }
.menu-toggle .bar:nth-child(3) { transform: translateY(8px); }

.nav-open .menu-toggle .bar:nth-child(1) { transform: translateY(0) rotate(45deg); background: var(--blue-alt); }
.nav-open .menu-toggle .bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
.nav-open .menu-toggle .bar:nth-child(3) { transform: translateY(0) rotate(-45deg); background: var(--blue-alt); }

/* -------------------------------- Intermediate: nav items get tight on medium desktops -------------------------------- */
@media (max-width: 1200px) {
  .nav-link { padding: 0 10px; font-size: 13px; }
  .mega-products { width: 960px; }
  .mega-services { width: 640px; }
  .mega-col { padding: 0 12px; }
}

/* -------------------------------- Tablet & Mobile: hamburger menu -------------------------------- */
@media (max-width: 1024px) {
  .menu-toggle { display: flex; }

  .nav-menu {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    /* top is set dynamically by JS — fallback: */
    top: 71px;
    height: auto;
    background: #fff;
    flex-direction: column;
    align-items: stretch;
    transform: translateX(100%);
    transition: transform .42s cubic-bezier(.16,1,.3,1);
    z-index: 5;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: -4px 0 24px rgba(8,17,31,.12);
    pointer-events: none;
    padding: 0;
  }
  .navbar.nav-open .nav-menu { transform: translateX(0); pointer-events: auto; }

  /* Dim overlay behind menu — z-index:1 keeps it BELOW nav-inner(10) and nav-menu(5) */
  .navbar.nav-open::before {
    content: '';
    position: fixed;
    inset: 0;
    background: rgba(8,17,31,.35);
    z-index: 1;
  }

  .nav-item { width: 100%; height: auto; border-bottom: 1px solid var(--border); display: block; }
  .nav-link { height: 56px; width: 100%; padding: 0 24px; justify-content: space-between; font-size: 15px; border-bottom: none; }

  /* Dropdowns: static accordion, expand on .open */
  .dropdown, .mega-dropdown {
    position: static !important;
    left: auto !important;
    top: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    box-shadow: none;
    border: none;
    border-radius: 0;
    max-height: 0;
    overflow: hidden;
    transition: max-height .4s ease;
    background: var(--off);
    width: 100%;
    margin-top: 0;
  }
  .nav-item.open .dropdown,
  .nav-item.open .mega-dropdown {
    max-height: 5000px;
    overflow-y: auto;
  }

  /* Single-column mega content */
  .mega-products { width: 100% !important; max-width: 100% !important; padding: 12px 20px !important; display: flex !important; flex-direction: column !important; }
  .mega-services { width: 100% !important; max-width: 100% !important; padding: 12px 20px !important; display: block !important; }
  .svc-grid-inner { display: flex !important; flex-direction: column !important; gap: 8px; width: 100%; }
  .mega-col { border-right: none; border-bottom: 1px solid var(--border); padding: 14px 0; width: 100%; }
  .mega-col:first-child { padding-left: 0; }
  .mega-col:last-child { border-bottom: none; padding-right: 0; }
  .mega-drop-footer { flex-direction: column; gap: 14px; text-align: center; padding: 18px 16px; margin: 12px 0 0 0; }
  .mega-hd { font-size: 11px; }
  .mega-item { font-size: 13px; padding: 9px 6px; }
  .svc-item { padding: 10px 8px; }
}

/* -------------------------------- Small screens: hide topbar, shrink CTA -------------------------------- */
@media (max-width: 600px) {
  .topbar { display: none; }
  .logo img { height: 42px; }
  .nav-cta { padding: 9px 14px; }
  .nav-actions { gap: 8px; }
}
@media (max-width: 480px) {
  .logo img { height: 38px; }
  .nav-cta span:not(.arr) { display: none; }
  .nav-cta { padding: 9px 12px; }
}


</style>

<div class="topbar"><div class="W"><div class="tb-inner">
  <div class="tb-left">
    <span class="tb-item">
      <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      No.1538/O, 1F, 12th Cross, 4th Stage, 2nd Block, BTM Layout, Hulimavu, Bengaluru - 560 076, Karnataka, India.
    </span>
    <span class="tb-item">
      <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
      +91 99006 04365
    </span>
    <span class="tb-item">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
      info@kumarasolutions.in
    </span>
  </div>
  <div class="tb-right">
    <span class="tb-cert">ISO 9001:2015</span>
    <span class="tb-cert">CPRI</span>
    <span class="tb-cert">IEC 61439</span>
  </div>
</div></div></div>


<nav class="navbar"><div class="W nav-inner">
  <a class="logo" href="index.html">
    <img src="images/logo.png" alt="Kumara Engineering Solutions">
  </a>

  <div class="nav-menu" id="navMenu">
    <div class="nav-item">
      <a href="index.html" class="nav-link">Home</a>
    </div>
    <div class="nav-item">
      <a href="aboutus.html" class="nav-link">About</a>
    </div>
    <!-- Services dropdown (Ultra-Compact Low-Height with Worker Icon) -->
    <div class="nav-item has-dropdown">
      <a href="services.html" class="nav-link">Services <svg class="chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></a>
      <div class="dropdown svc-compact-dropdown">
        <div class="svc-side-grid">
          <!-- 01: Consultancy with Worker / Hardhat Icon -->
          <a href="engineeringcounsultancy.html" class="sc-card">
            <div class="sc-ico" title="Engineering Advisory">
              <svg viewBox="0 0 24 24"><path d="M2 20h20"/><path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/><circle cx="12" cy="8" r="4"/><path d="M7 8a5 5 0 0 1 10 0H7z"/><path d="M12 3v2"/></svg>
            </div>
            <div class="sc-body">
              <div class="sc-title">Engineering Consultancy <span class="sc-arr">&rarr;</span></div>
              <div class="sc-sub">MEPF SLDs &amp; CEIG Sanctions</div>
            </div>
          </a>

          <!-- 02: Works Contract -->
          <a href="workscontract.html" class="sc-card">
            <div class="sc-ico" title="Turnkey Works Contract">
              <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div class="sc-body">
              <div class="sc-title">Works Contract <span class="sc-arr">&rarr;</span></div>
              <div class="sc-sub">Substations, Cabling &amp; 24/7 AMC</div>
            </div>
          </a>

          <!-- 03: Panel Manufacturing -->
          <a href="manufacturing.html" class="sc-card">
            <div class="sc-ico" title="Switchgear Manufacturing">
              <svg viewBox="0 0 24 24"><path d="M2 20h20"/><path d="M5 20V8l5 4V8l5 4V4h5v16H5z"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="18" y1="12" x2="18.01" y2="12"/></svg>
            </div>
            <div class="sc-body">
              <div class="sc-title">Panel Manufacturing <span class="sc-arr">&rarr;</span></div>
              <div class="sc-sub">CPRI 100kA Switchboards &amp; Bus Ducts</div>
            </div>
          </a>
        </div>

        <div class="sc-footer">
          <a href="services.html">View All Services Overview &rarr;</a>
        </div>
      </div>
    </div>

    <!-- Products mega-menu -->
    <div class="nav-item mega-parent">
      <div class="nav-link">Products <svg class="chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></div>
      <div class="mega-dropdown">
        <div class="mega-products">
          <div class="mega-col">
            <div class="mega-hd">Distribution <span class="mh-cnt">10</span></div>
            <a class="mega-item" href="products.html#mv-switchgear">MV Switchgear Panels</a>
            <a class="mega-item" href="products.html#lv-switchgear">LV Switchgear Panels</a>
            <a class="mega-item" href="products.html#css">Compact Substation (CSS)</a>
            <a class="mega-item" href="products.html#transformer">Transformers</a>
            <a class="mega-item" href="products.html#mcc-panel">MCC Panel</a>
            <a class="mega-item" href="products.html#pcc-panel">PCC Panel</a>
            <a class="mega-item" href="products.html#pmcc-panel">PMCC Panel</a>
            <a class="mega-item" href="products.html#power-dist">Power Distribution</a>
            <a class="mega-item" href="products.html#raw-power">Raw Power Panel</a>
            <a class="mega-item" href="products.html#star-delta">Star Delta Panel</a>
          </div>
          <div class="mega-col">
            <div class="mega-hd">Control &amp; Sync <span class="mh-cnt">6</span></div>
            <a class="mega-item" href="products.html#dg-sync">DG Sync Panel</a>
            <a class="mega-item" href="products.html#apfc-panel">APFC Panel</a>
            <a class="mega-item" href="products.html#ats-panel">ATS Panel</a>
            <a class="mega-item" href="products.html#plc-panel">PLC Control Panel</a>
            <a class="mega-item" href="products.html#vfd-panel">VFD Panel</a>
            <a class="mega-item" href="products.html#meter-panel">Meter Panel</a>
          </div>
          <div class="mega-col">
            <div class="mega-hd">Building &amp; HVAC <span class="mh-cnt">6</span></div>
            <a class="mega-item" href="products.html#hvac-panel">HVAC Panel</a>
            <a class="mega-item" href="products.html#ahu-panel">AHU Control Panel</a>
            <a class="mega-item" href="products.html#lift-panel">Lift Control Panel</a>
            <a class="mega-item" href="products.html#fire-pump">Fire Pump Panel</a>
            <a class="mega-item" href="products.html#water-pump">Water Pump Panel</a>
            <a class="mega-item" href="products.html#kitchen-panel">Kitchen Panel</a>
          </div>
          <div class="mega-col">
            <div class="mega-hd">Specialty <span class="mh-cnt">4</span></div>
            <a class="mega-item" href="products.html#aviation-panel">Aviation Lighting</a>
            <a class="mega-item" href="products.html#street-light">Street Light Panel</a>
            <a class="mega-item" href="products.html#solar-panel">Solar Panel</a>
            <a class="mega-item" href="products.html#ups-panel">UPS Panel</a>
          </div>
          <div class="mega-col">
            <div class="mega-hd">Infrastructure <span class="mh-cnt">2</span></div>
            <a class="mega-item" href="products.html#busduct">HV &amp; LV Bus Duct</a>
            <a class="mega-item" href="products.html#cable-tray">Ladder Type Tray</a>
            <a class="mega-item" href="products.html#cable-tray">Perforated Tray</a>
            <a class="mega-item" href="products.html#cable-tray">Wire Mesh Tray</a>
            <a class="mega-item" href="products.html#cable-tray">Cable Raceway</a>
          </div>
          <div class="mega-drop-footer">
            <span>28+ Products &middot; IEC 61439 &middot; IS:8623 &middot; CPRI Certified</span>
            <a href="products.html">View All Products &rarr;</a>
          </div>
        </div>
      </div>
    </div>

    <div class="nav-item">
      <a href="process.html" class="nav-link">Process</a>
    </div>
    <div class="nav-item">
      <a href="gallery.html" class="nav-link">Gallery</a>
    </div>
    <div class="nav-item">
      <a href="contactus.html" class="nav-link">Contact</a>
    </div>
  </div>

    <div class="nav-actions">
      <a href="admin.html" class="nav-cta"><span>Login</span> <span class="arr">&#8594;</span></a>
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">
        <div class="bar-box">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </div>
      </button>
    </div>
</div></nav>`;
  const footerHTML = `<style>
/* --------------------------------
   PREMIUM CRAFTED LIGHT FOOTER (Matches Design Mockup)
   -------------------------------- */
footer {
  position: relative;
  background: #ffffff;
  color: #1e293b;
  padding: 46px 0 20px;
  border-top: 1px solid #f1f5f9;
  font-family: inherit;
}

.ft-wrap {
  width: 96vw;
  max-width: 1760px;
  margin: 0 auto;
}

.ft-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.82fr 0.88fr 1.32fr;
  align-items: start;
  gap: clamp(24px, 3.2vw, 54px);
}

/* Left Brand Card */
.ft-brand-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 30px 26px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.035);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ft-brand-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
  background-size: 8px 8px;
  opacity: 0.65;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(circle at top right, black 35%, transparent 80%);
  mask-image: radial-gradient(circle at top right, black 35%, transparent 80%);
}

.ft-logo {
  display: inline-flex;
  width: fit-content;
}

.ft-logo img {
  height: 42px;
  width: auto;
  display: block;
}

.ft-brand-line {
  width: 32px;
  height: 3px;
  background: var(--blue-alt);
  margin: 14px 0 16px;
  border-radius: 2px;
}

.ft-desc {
  font-size: 13.5px;
  line-height: 1.68;
  color: #334155;
  font-weight: 400;
  margin: 0 0 24px;
}

.ft-soc {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.fsoc {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  text-decoration: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  transition: all .2s ease;
}

.fsoc svg {
  width: 15px;
  height: 15px;
  fill: #1e293b;
  transition: fill .2s ease;
}

.fsoc:hover {
  background: var(--blue-alt);
  border-color: var(--blue-alt);
  color: #ffffff;
  transform: translateY(-2px);
}

.fsoc:hover svg {
  fill: #ffffff;
}

/* Nav & Product Columns */
.ft-col h4 {
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  color: #0b1a30;
  letter-spacing: .06em;
  text-transform: uppercase;
  margin: 0;
}

.ft-head-line {
  width: 26px;
  height: 2.5px;
  background: var(--blue-alt);
  margin: 8px 0 18px;
  border-radius: 2px;
}

.ft-links {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.ft-links a {
  font-size: 13.5px;
  line-height: 1.4;
  color: #334155;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all .18s ease;
  width: fit-content;
}

.ft-links a .ft-chev {
  color: var(--blue-alt);
  font-size: 13px;
  font-weight: 700;
  transition: transform .18s ease;
}

.ft-links a:hover {
  color: var(--blue-alt);
  transform: translateX(3px);
}

.ft-links a:hover .ft-chev {
  transform: translateX(2px);
}

/* Contact Column */
.ft-contact-boxes {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.fc-box {
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 10px 14px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  text-decoration: none;
  transition: all .2s ease;
}

.fc-box:hover {
  border-color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.fc-ico {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--blue-alt);
  stroke: var(--blue-alt);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fc-ico svg {
  width: 18px;
  height: 18px;
  stroke: var(--blue-alt);
}

.fc-val {
  font-size: 12.5px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.45;
}

.ft-badges-strip {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 13px;
}

.ft-cert-chip {
  padding: 5px 12px;
  border: 1px solid rgba(204, 39, 0, 0.38);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--blue-alt);
  background: #ffffff;
  letter-spacing: .04em;
  text-transform: uppercase;
  transition: all .2s ease;
}

.ft-cert-chip:hover {
  background: rgba(204, 39, 0, 0.04);
  border-color: var(--blue-alt);
}

/* Bottom Bar */
.ft-bottom {
  border-top: 1px solid #f1f5f9;
  padding: 18px 0;
  margin-top: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.ft-b-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ft-shield-ic {
  width: 24px;
  height: 24px;
  color: var(--blue-alt);
  stroke: var(--blue-alt);
  flex-shrink: 0;
}

.ft-b-copy {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #475569;
  line-height: 1.4;
}

.ft-b-designer {
  border-left: 1px solid #e2e8f0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.ft-d-lbl {
  font-size: 11px;
  color: #64748b;
}

.ft-d-link {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--blue-alt);
  text-decoration: none;
}

.ft-d-link:hover {
  text-decoration: underline;
}

.ft-b-badges {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.ft-pill {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 12px;
  background: #ffffff;
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.ft-pill svg {
  width: 14px;
  height: 14px;
  color: #64748b;
  stroke: #64748b;
  flex-shrink: 0;
}

/* Round Back to Top */
#btt {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--blue-alt);
  color: #ffffff;
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(204, 39, 0, 0.38);
  transition: all .2s ease;
  outline: none;
}

#btt.on {
  display: flex;
}

#btt:hover {
  background: var(--blue-alt2);
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(204, 39, 0, 0.5);
}

#btt svg {
  width: 18px;
  height: 18px;
  stroke: #ffffff;
}

/* Responsive */
@media (max-width: 1100px) {
  .ft-grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 640px) {
  footer {
    padding: 32px 0 16px;
  }
  .ft-wrap {
    width: calc(100% - 32px);
  }
  .ft-grid {
    grid-template-columns: 1fr;
    gap: 26px;
  }
  .ft-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .ft-b-designer {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
    width: 100%;
  }
}
</style>

<!-- FOOTER -->
<footer>
  <div class="W ft-wrap">
    <div class="ft-grid">
      <!-- Brand Card Column -->
      <div class="ft-brand-card">
        <a class="ft-logo" href="index.html" aria-label="Kumara Engineering Solutions home">
          <img src="images/logo.png" alt="Kumara Engineering Solutions">
        </a>
        <div class="ft-brand-line"></div>
        <p class="ft-desc">The True Leader in End-to-End Power Distribution, Control Systems and Turnkey Electrical Solutions. Serving Karnataka and beyond &mdash; built on 24+ years of inherited excellence.</p>
        
        <div class="ft-soc">
          <a href="#" class="fsoc" aria-label="LinkedIn">in</a>
          <a href="#" class="fsoc" aria-label="Facebook">f</a>
          <a href="#" class="fsoc" aria-label="YouTube">
            <svg viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z"/><path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#fff"/></svg>
          </a>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="ft-col">
        <h4>QUICK LINKS</h4>
        <div class="ft-head-line"></div>
        <div class="ft-links">
          <a href="index.html"><span class="ft-chev">&gt;</span> Home</a>
          <a href="aboutus.html"><span class="ft-chev">&gt;</span> About Us</a>
          <a href="services.html"><span class="ft-chev">&gt;</span> Services</a>
          <a href="products.html"><span class="ft-chev">&gt;</span> Products</a>
          <a href="consultancy.html"><span class="ft-chev">&gt;</span> Consultancy</a>
          <a href="process.html"><span class="ft-chev">&gt;</span> Manufacturing Process</a>
          <a href="gallery.html"><span class="ft-chev">&gt;</span> Gallery</a>
          <a href="contactus.html"><span class="ft-chev">&gt;</span> Contact</a>
        </div>
      </div>

      <!-- Products -->
      <div class="ft-col">
        <h4>PRODUCTS</h4>
        <div class="ft-head-line"></div>
        <div class="ft-links">
          <a href="products.html#lv-switchgear"><span class="ft-chev">&gt;</span> LT Panel</a>
          <a href="products.html#mcc-panel"><span class="ft-chev">&gt;</span> MCC Panel</a>
          <a href="products.html#plc-panel"><span class="ft-chev">&gt;</span> PLC Control Panel</a>
          <a href="products.html#apfc-panel"><span class="ft-chev">&gt;</span> APFC Panel</a>
          <a href="products.html#busduct"><span class="ft-chev">&gt;</span> HV &amp; LV Bus Duct</a>
          <a href="products.html#vfd-panel"><span class="ft-chev">&gt;</span> VFD Panel</a>
          <a href="products.html#ats-panel"><span class="ft-chev">&gt;</span> ATS Panel</a>
          <a href="products.html#dg-sync"><span class="ft-chev">&gt;</span> DG Sync Panel</a>
        </div>
      </div>

      <!-- Contact Us -->
      <div class="ft-col">
        <h4>CONTACT US</h4>
        <div class="ft-head-line"></div>
        <div class="ft-contact-boxes">
          <div class="fc-box">
            <div class="fc-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div class="fc-val">No.1538/O, 1F, 12th Cross, 4th Stage, 2nd Block, BTM Layout, Hulimavu, Bengaluru - 560 076, Karnataka, India.</div>
          </div>

          <a href="tel:+919900604365" class="fc-box">
            <div class="fc-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            </div>
            <div class="fc-val">+91 99006 04365</div>
          </a>

          <a href="mailto:info@kumarasolutions.in" class="fc-box">
            <div class="fc-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
            </div>
            <div class="fc-val">info@kumarasolutions.in</div>
          </a>

          <div class="fc-box">
            <div class="fc-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div class="fc-val">Mon-Sat &middot; 9 AM &ndash; 6 PM IST</div>
          </div>
        </div>

        <div class="ft-badges-strip">
          <span class="ft-cert-chip">IEC 61439</span>
          <span class="ft-cert-chip">IS:8623</span>
          <span class="ft-cert-chip">CPRI</span>
          <span class="ft-cert-chip">ISO 9001</span>
        </div>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="ft-bottom">
      <div class="ft-b-left">
        <svg class="ft-shield-ic" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <div class="ft-b-copy">
          <span>&copy; 2026 Kumara Engineering Solutions Private Limited.</span>
          <span>All rights reserved.</span>
        </div>
      </div>

      <div class="ft-b-designer">
        <span class="ft-d-lbl">Designed by</span>
        <a href="https://niyanitsolutions.com" target="_blank" rel="noopener" class="ft-d-link">Niyan IT Solutions</a>
      </div>

      <div class="ft-b-badges">
        <span class="ft-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
          ISO CERTIFIED
        </span>
        <span class="ft-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h20M4 18v-4a8 8 0 1 1 16 0v4M9 10h6"/></svg>
          CLASS I CONTRACTOR
        </span>
        <span class="ft-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          GSTIN: 29ANNPB3536E1Z3
        </span>
        <span class="ft-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          BENGALURU, KA
        </span>
      </div>
    </div>
  </div>
</footer>

<button id="btt" type="button" aria-label="Back to top">
  <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
</button>`;

  const headerSlot = document.getElementById('site-header');
  const footerSlot = document.getElementById('site-footer');

  if (headerSlot) headerSlot.outerHTML = headerHTML;
  if (footerSlot) footerSlot.outerHTML = footerHTML;

  const btt = document.getElementById('btt');
  if (btt) {
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

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
    var navbar = document.querySelector('.navbar');
    var toggle = document.getElementById('menuToggle');
    var navMenu = document.getElementById('navMenu');
    var navItems = document.querySelectorAll('.nav-item');
    if (!navbar || !navMenu) return;

    /* -------------------------------- Position helpers -------------------------------- */
    function getNavbarBottom() {
      return navbar.getBoundingClientRect().bottom;
    }

    function positionMobileMenu() {
      if (window.innerWidth > 1024) return;
      navMenu.style.top = getNavbarBottom() + 'px';
    }

    function positionMegaDropdowns() {
      if (window.innerWidth <= 1024) return;
      var top = getNavbarBottom() + 'px';
      document.querySelectorAll('.mega-dropdown').forEach(function (dd) {
        dd.style.top = top;
      });
    }

    function clearPositions() {
      navMenu.style.top = '';
      document.querySelectorAll('.mega-dropdown').forEach(function (dd) {
        dd.style.top = '';
      });
    }

    function closeMenu() {
      navbar.classList.remove('nav-open');
      document.body.style.overflow = '';
      navItems.forEach(function (i) { i.classList.remove('open'); });
    }

    /* -------------------------------- Initial positioning -------------------------------- */
    positionMegaDropdowns();
    positionMobileMenu();

    /* -------------------------------- Scroll: reposition dropdowns -------------------------------- */
    window.addEventListener('scroll', function () {
      positionMegaDropdowns();
      positionMobileMenu();

      var btt = document.getElementById('btt');
      navbar.style.boxShadow = scrollY > 10
        ? '0 2px 28px rgba(8,17,31,.14)'
        : '0 2px 24px rgba(8,17,31,.10)';
      if (btt) btt.classList.toggle('on', scrollY > 400);
    }, { passive: true });

    /* -------------------------------- Hamburger toggle -------------------------------- */
    toggle && toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpening = !navbar.classList.contains('nav-open');
      if (isOpening) {
        positionMobileMenu();
        navbar.classList.add('nav-open');
        document.body.style.overflow = 'hidden';
      } else {
        closeMenu();
      }
    });

    /* -------------------------------- Dropdown accordion on mobile -------------------------------- */
    navItems.forEach(function (item) {
      var link = item.querySelector(':scope > .nav-link');
      var dropdown = item.querySelector(':scope > .dropdown') || item.querySelector(':scope > .mega-dropdown');
      if (!link || !dropdown) return;
      link.addEventListener('click', function (e) {
        if (window.innerWidth > 1024) return;
        e.preventDefault();
        e.stopPropagation();
        var opening = !item.classList.contains('open');
        navItems.forEach(function (i) { i.classList.remove('open'); });
        if (opening) item.classList.add('open');
      });
    });

    /* -------------------------------- Close mobile menu on leaf-link click -------------------------------- */
    document.querySelectorAll('.nav-menu a.nav-link, .mega-item, .dd-item, .svc-item').forEach(function (el) {
      el.addEventListener('click', function () {
        if (window.innerWidth > 1024) return;
        if (el.classList.contains('nav-link') && el.closest('.mega-parent')) return;
        closeMenu();
      });
    });

    /* -------------------------------- Resize: clean up -------------------------------- */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) {
        closeMenu();
        clearPositions();
        positionMegaDropdowns();
      } else {
        clearPositions();
        positionMobileMenu();
      }
    });
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.rv, .rl, .rr').forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
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
