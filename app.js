document.addEventListener('DOMContentLoaded', () => {
  // Fetch central data registry (try database-backed API first, fall back to static file)
  fetch('/api/get-content')
    .then(response => {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      return response.json();
    })
    .catch(err => {
      console.log('[CMS Fallback] Database API offline or local development. Fetching static content.json...');
      return fetch('content.json').then(res => res.json());
    })
    .then(data => {
      // Initialize layout rendering
      if (document.getElementById('hero-headline')) {
        renderHomePage(data);
      }
      if (document.getElementById('pow-case-studies-container')) {
        renderProofOfWorkPage(data);
      }
      
      // Initialize core behaviors
      initCaseStudyToggles();
      initFilters();
      initContactForm(data);
      checkQueryParameters();
      initScrollObservers();
    })
    .catch(err => {
      console.error('Error loading content registry:', err);
    });
});

/**
 * 1. Render Home Page Elements Dynamically
 */
function renderHomePage(data) {
  // Render Hero
  if (data.homepage.hero.tag && document.getElementById('hero-tag')) {
    document.getElementById('hero-tag').textContent = data.homepage.hero.tag;
  }
  const rawHeadline = data.homepage.hero.headline;
  // Parse brackets [words] into whiteboard style inline SVG highlights
  const parsedHeadline = rawHeadline.replace(/\[(.*?)\]/g, `
    <span class="italic-highlight" style="position: relative; display: inline-block;">
      $1
      <svg style="position: absolute; bottom: -8px; left: 0; width: 100%; height: 12px; pointer-events: none;" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M3,7 Q50,2 97,5" stroke="var(--ink-accent)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
    </span>
  `);
  document.getElementById('hero-headline').innerHTML = parsedHeadline;
  document.getElementById('hero-subhead').textContent = data.homepage.hero.subhead;

  if (data.homepage.hero.primary_btn_text && document.getElementById('hero-btn-primary')) {
    document.getElementById('hero-btn-primary').textContent = data.homepage.hero.primary_btn_text;
  }
  if (data.homepage.hero.secondary_btn_text && document.getElementById('hero-btn-secondary')) {
    document.getElementById('hero-btn-secondary').textContent = data.homepage.hero.secondary_btn_text;
  }

  // Render Capabilities Header
  if (data.homepage.capabilities_header) {
    if (document.getElementById('cap-tag')) document.getElementById('cap-tag').textContent = data.homepage.capabilities_header.tag;
    if (document.getElementById('cap-title-text')) document.getElementById('cap-title-text').textContent = data.homepage.capabilities_header.title;
    if (document.getElementById('cap-subtitle')) document.getElementById('cap-subtitle').textContent = data.homepage.capabilities_header.subtitle;
  }

  // Render Capabilities
  const capabilitiesContainer = document.getElementById('capabilities-container');
  if (capabilitiesContainer) {
    capabilitiesContainer.innerHTML = data.homepage.capabilities.map(cap => `
      <div class="capability-card">
        <span class="capability-num">${cap.num}</span>
        <h3>${cap.title}</h3>
        <p>${cap.desc}</p>
      </div>
    `).join('');
  }

  // Render Proof Strip (Stats Banner)
  const proofContainer = document.getElementById('proof-strip-container');
  if (proofContainer) {
    proofContainer.innerHTML = data.homepage.proof_strip.map(item => {
      let statHtml = item.stat;
      if (item.circled) {
        statHtml = `
          <span style="position: relative; display: inline-block; padding-right: 5px;">
            ${item.stat}
            <svg style="position: absolute; top: -5%; left: -10%; width: 120%; height: 110%; pointer-events: none;" viewBox="0 0 100 100" fill="none"><path d="M50,5 C78,5 95,25 93,50 C91,72 72,92 50,92 C28,92 8,72 6,48 C4,24 25,8 55,9" stroke="var(--ink-accent)" stroke-width="3" stroke-linecap="round"/></svg>
          </span>
        `;
      }
      return `
        <a href="proof-of-work.html?project=${item.id}" class="proof-item">
          <div class="stat-number">${statHtml}</div>
          <div class="stat-description">${item.desc}</div>
          <span class="stat-link">Read case study details</span>
        </a>
      `;
    }).join('');
  }

  // Render Industries Served Row
  if (data.homepage.industries_served) {
    if (document.getElementById('industries-served-title')) {
      document.getElementById('industries-served-title').textContent = data.homepage.industries_served.title;
    }
    const tagsContainer = document.getElementById('industries-served-tags');
    if (tagsContainer && data.homepage.industries_served.tags) {
      tagsContainer.innerHTML = data.homepage.industries_served.tags.map((tag, idx) => `
        <span class="industry-tag ${idx % 3 === 1 ? 'accent-tag' : ''}">${tag}</span>
      `).join('');
    }
  }

  // Render About Paragraphs
  const aboutContainer = document.getElementById('about-content-container');
  if (aboutContainer) {
    aboutContainer.innerHTML = `
      <h2 style="position: relative; display: inline-block;">
        ${data.homepage.about.headline}
        <svg style="position: absolute; bottom: -8px; left: 0; width: 60%; height: 8px; pointer-events: none;" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0,5 Q50,2 100,5" stroke="var(--ink-accent-blue)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
      </h2>
      <p style="margin-top: 1.5rem;">${data.homepage.about.p1}</p>
      <p>${data.homepage.about.p2}</p>
      <p>${data.homepage.about.p3}</p>
    `;
  }

  // Render Process Timeline (How We Work)
  const processContainer = document.getElementById('process-timeline-container');
  if (processContainer && data.homepage.process) {
    processContainer.innerHTML = `
      <h3 style="font-family: var(--font-sans); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; color: var(--text-muted); margin-bottom: -0.5rem;">${data.homepage.process.tag}</h3>
      ${data.homepage.process.steps.map(step => `
        <div class="process-step">
          <div class="step-num">${step.num}</div>
          <div class="step-details">
            <h4>${step.title}</h4>
            <p>${step.desc}</p>
          </div>
        </div>
      `).join('')}
    `;
  }

  // Render Contact Info Block
  const contactInfoContainer = document.getElementById('contact-info-container');
  if (contactInfoContainer && data.homepage.contact_section) {
    contactInfoContainer.innerHTML = `
      <div>
        <h2>${data.homepage.contact_section.headline}</h2>
        <p>${data.homepage.contact_section.subtext}</p>
      </div>
      <div>
        <span style="font-family: var(--font-hand); color: var(--ink-accent); font-size: 1.35rem; display: block; transform: rotate(-1deg); margin-bottom: 0.25rem;">${data.homepage.contact_section.email_prompt}</span>
        <a href="mailto:${data.personal.email}" class="direct-email">${data.personal.email}</a>
      </div>
    `;
  }

  // Render Footer Elements
  if (data.personal) {
    if (document.getElementById('footer-logo')) document.getElementById('footer-logo').textContent = data.personal.footer_logo || 'MANAN | CONTENT STRATEGIST';
    if (document.getElementById('footer-subtext')) document.getElementById('footer-subtext').textContent = data.personal.footer_subtext || '© 2026 Gurgaon, India. Built with structured logic.';
  }
}

/**
 * 2. Render Proof of Work Case Studies & Campaigns Dynamically
 */
function renderProofOfWorkPage(data) {
  // Render Proof of Work Hero Text
  if (data.proof_of_work_page) {
    if (document.getElementById('pow-subtext')) {
      document.getElementById('pow-subtext').textContent = data.proof_of_work_page.subtext;
    }
    
    // Render Campaign Cards Header
    if (data.proof_of_work_page.campaign_cards_header) {
      if (document.getElementById('pow-cards-tag')) document.getElementById('pow-cards-tag').textContent = data.proof_of_work_page.campaign_cards_header.tag;
      if (document.getElementById('pow-cards-title')) document.getElementById('pow-cards-title').textContent = data.proof_of_work_page.campaign_cards_header.title;
      if (document.getElementById('pow-cards-subtitle')) document.getElementById('pow-cards-subtitle').textContent = data.proof_of_work_page.campaign_cards_header.subtitle;
    }

    // Render Bottom CTA
    if (data.proof_of_work_page.cta) {
      if (document.getElementById('pow-cta-headline')) document.getElementById('pow-cta-headline').textContent = data.proof_of_work_page.cta.headline;
      if (document.getElementById('pow-cta-subhead')) document.getElementById('pow-cta-subhead').textContent = data.proof_of_work_page.cta.subhead;
      if (document.getElementById('pow-cta-btn')) document.getElementById('pow-cta-btn').textContent = data.proof_of_work_page.cta.btn_text;
    }
  }

  // Render Footer Elements
  if (data.personal) {
    if (document.getElementById('footer-logo')) document.getElementById('footer-logo').textContent = data.personal.footer_logo || 'MANAN | CONTENT STRATEGIST';
    if (document.getElementById('footer-subtext')) document.getElementById('footer-subtext').textContent = data.personal.footer_subtext || '© 2026 Gurgaon, India. Built with structured logic.';
  }
  // Render Full Case Studies (Tier 1)
  const caseStudiesContainer = document.getElementById('pow-case-studies-container');
  const fullProjects = data.projects.filter(p => p.type === 'full');
  
  caseStudiesContainer.innerHTML = fullProjects.map(proj => {
    if (proj.layout === 'route') {
      return `
        <div class="case-study-card route-case-study fade-in" data-project-id="${proj.id}" data-industries="${proj.filterClass}">
          <div class="case-study-header" style="text-align: left;">
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 1.5px; color: #7D8B96; text-transform: uppercase; margin-bottom: 0.5rem;">
              ${proj.category}
            </div>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; color: #22303F; margin: 0 0 0.5rem 0; font-weight: 700;">
               ${proj.brand}
            </h2>
            <p class="case-study-brief" style="color: #7D8B96; margin: 0 0 1.5rem 0;">
              ${proj.brief}
            </p>
            <div class="case-study-expand-trigger" style="justify-content: flex-start; gap: 0.5rem; padding: 0.5rem 0 0 0;">
              <span>[ EXPAND ROUTE DIAGNOSIS ]</span>
              <span class="arrow-icon" style="color: #B4532B; transform: rotate(0deg); transition: transform 0.2s ease;">↓</span>
            </div>
          </div>

          <!-- Expanded Detail -->
          <div class="case-study-detail" id="detail-${proj.id}">
            <div style="margin-top: 2.5rem;">
              
              <!-- Beat 1: About the Brand -->
              <div class="route-beat-row">
                <div class="route-timeline-col">
                  <div class="route-dot surrey"></div>
                  <div class="route-segment segment-before"></div>
                </div>
                <div class="route-content-col">
                  <span class="route-label-mono">SECTION 01 / CONTEXT</span>
                  <h2>About the Brand</h2>
                  <p>${proj.about_brand}</p>
                </div>
              </div>

              <!-- Beat 2: Objective -->
              <div class="route-beat-row">
                <div class="route-timeline-col">
                  <div class="route-dot objective"></div>
                  <div class="route-segment segment-before"></div>
                </div>
                <div class="route-content-col">
                  <span class="route-label-mono">SECTION 02 / GOAL</span>
                   <h2>Objective</h2>
                  <p>${proj.objective}</p>
                </div>
              </div>

              <!-- Beat 3: Strategy -->
              <div class="route-beat-row">
                <div class="route-timeline-col">
                  <div class="route-dot strategy"></div>
                  <div class="route-segment segment-after"></div>
                </div>
                <div class="route-content-col">
                  <span class="route-label-mono">SECTION 03 / METHOD</span>
                  <h2>Strategy</h2>
                  <p>
                    ${proj.strategy.replace(proj.founder_quote, `</p><div class="route-pull-quote">"${proj.founder_quote}"</div><p>`)}
                  </p>
                </div>
              </div>

              <!-- Beat 4: Outcome -->
              <div class="route-beat-row">
                <div class="route-timeline-col">
                  <div class="route-branching-desktop">
                    <svg class="branching-svg" viewBox="0 0 100 180" preserveAspectRatio="none" style="width: 100px; height: 100%; min-height: 180px;">
                      <defs>
                        <mask id="dash-mask">
                          <path d="M50,30 C50,70 85,75 85,145" stroke="white" stroke-width="4" fill="none" class="mask-path" />
                        </mask>
                      </defs>
                      <line x1="50" y1="0" x2="50" y2="30" stroke="var(--route-rust)" stroke-width="2" />
                      <path d="M50,30 C50,60 15,60 15,90" stroke="var(--route-rust)" stroke-width="2" fill="none" class="branch-path" />
                      <path d="M50,30 C50,60 32,60 32,105" stroke="var(--route-rust)" stroke-width="2" fill="none" class="branch-path" />
                      <path d="M50,30 C50,70 50,70 50,120" stroke="var(--route-rust)" stroke-width="2" fill="none" class="branch-path" />
                      <path d="M50,30 C50,60 68,60 68,105" stroke="var(--route-rust)" stroke-width="2" fill="none" class="branch-path" />
                      <path d="M50,30 C50,70 85,75 85,145" stroke="var(--route-rust)" stroke-width="1.5" stroke-dasharray="3,3" fill="none" mask="url(#dash-mask)" />
                      
                      <circle cx="15" cy="90" r="3.5" fill="var(--route-rust)" class="branch-dot-draw" />
                      <circle cx="32" cy="105" r="3.5" fill="var(--route-rust)" class="branch-dot-draw" />
                      <circle cx="50" cy="120" r="3.5" fill="var(--route-rust)" class="branch-dot-draw" />
                      <circle cx="68" cy="105" r="3.5" fill="var(--route-rust)" class="branch-dot-draw" />
                      <circle cx="85" cy="145" r="3.5" fill="var(--route-red)" class="branch-dot-draw" />
                      
                      <!-- Line continuation down to teaser waypoint -->
                      <line x1="50" y1="120" x2="50" y2="180" stroke="var(--route-rust)" stroke-width="2" class="branch-path" />

                      <text x="15" y="101" font-family="'IBM Plex Mono', monospace" font-size="6" text-anchor="middle" fill="var(--route-slate)">BC</text>
                      <text x="32" y="116" font-family="'IBM Plex Mono', monospace" font-size="6" text-anchor="middle" fill="var(--route-slate)">ON</text>
                      <text x="50" y="131" font-family="'IBM Plex Mono', monospace" font-size="6" text-anchor="middle" fill="var(--route-slate)">QC</text>
                      <text x="68" y="116" font-family="'IBM Plex Mono', monospace" font-size="6" text-anchor="middle" fill="var(--route-slate)">AB</text>
                      <text x="85" y="156" font-family="'IBM Plex Mono', monospace" font-size="6" text-anchor="middle" fill="var(--route-red)" font-weight="bold">INTL</text>
                    </svg>
                  </div>
                </div>
                <div class="route-content-col">
                  <span class="route-label-mono">SECTION 04 / REACH</span>
                  <h2>Outcome</h2>
                  <p>${proj.outcome}</p>
                  
                  <div class="route-branching-mobile">
                    <div class="mobile-branch-item"><span class="dot"></span><span class="label">BC (British Columbia)</span></div>
                    <div class="mobile-branch-item"><span class="dot"></span><span class="label">ON (Ontario)</span></div>
                    <div class="mobile-branch-item"><span class="dot"></span><span class="label">QC (Quebec)</span></div>
                    <div class="mobile-branch-item"><span class="dot"></span><span class="label">AB (Alberta)</span></div>
                    <div class="mobile-branch-item"><span class="dot dashed"></span><span class="label intl">INTL (International Travel-Insurance Leads)</span></div>
                  </div>
                </div>
              </div>

              <!-- Wiseconomy Email Strategy Teaser Addendum -->
              <div class="route-beat-row route-teaser-row">
                <div class="route-timeline-col">
                  <div class="route-dot teaser-dot"></div>
                </div>
                <div class="route-content-col" style="padding-bottom: 0;">
                  <a href="${proj.email_teaser ? proj.email_teaser.url : 'wiseconomy-email-strategy.html'}" class="route-teaser-link">
                    <span class="teaser-text">${proj.email_teaser ? proj.email_teaser.text : 'Focused Email Strategy to Convert Dead Leads.'}</span>
                    <span class="teaser-arrow">→</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;
    } else if (proj.layout === 'ownership') {
      return `
        <div class="case-study-card fade-in" data-project-id="${proj.id}" data-industries="${proj.filterClass}">
          <div class="case-study-header">
            <div class="case-study-title-row">
              <div class="industry-tags" style="margin-bottom: 0.25rem;">
                <span class="industry-tag accent-tag">${proj.category}</span>
              </div>
              <h2>${proj.brand}</h2>
            </div>
            <p class="case-study-brief">
              ${proj.brief}
            </p>
            <div class="case-study-expand-trigger">
              <span>[ EXPAND STRATEGIC DIAGNOSIS ]</span>
              <span class="arrow-icon">↓</span>
            </div>
          </div>

          <!-- Expanded Detail -->
          <div class="case-study-detail" id="detail-${proj.id}">
            <div class="ownership-intro-grid" style="text-align: left;">
              <div class="strategy-block">
                <h3 style="font-family: var(--font-sans); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">Category Challenge</h3>
                <p style="font-size: 1.05rem; line-height: 1.6; color: var(--ink-primary);">${proj.snapshot}</p>
              </div>
              <div class="strategy-block">
                <h3 style="font-family: var(--font-sans); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">Role Framing & Ownership</h3>
                <p style="font-size: 1.1rem; line-height: 1.6; font-weight: 600; color: var(--ink-primary); border-left: 3px solid var(--ink-accent-blue); padding-left: 1.25rem; margin-top: 0.25rem;">${proj.role_framing}</p>
              </div>
            </div>

            <h3 style="font-family: var(--font-sans); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">[ Scope of Work & Content Pillars ]</h3>
            
            <div class="ownership-scope-grid">
              ${proj.scope_areas.map((area, index) => {
                const noteColors = ['#FEF9E7', '#E8F8F5', '#EBF5FB', '#FDEDEC', '#EAFAF1', '#FEF5E7', '#F5EEF8'];
                const color = noteColors[index % noteColors.length];
                const rotateDeg = (index % 2 === 0 ? -0.8 : 0.8);
                return `
                  <div style="background-color: ${color}; border: 1px solid rgba(28,28,28,0.1); padding: 1.75rem; box-shadow: 3px 6px 12px rgba(0,0,0,0.02); transform: rotate(${rotateDeg}deg); position: relative; min-height: 220px; display: flex; flex-direction: column; gap: 0.75rem; border-radius: 4px; text-align: left;">
                    <h4 style="font-family: var(--font-sans); font-size: 1rem; font-weight: 700; color: var(--ink-primary); display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-family: var(--font-hand); color: var(--ink-accent); font-size: 1.5rem; font-weight: 700;">0${index + 1}</span>
                      ${area.title}
                    </h4>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                      ${area.bullets.map(b => `<li style="position: relative; padding-left: 1rem;"><span style="position: absolute; left: 0; color: var(--ink-accent);">•</span>${b}</li>`).join('')}
                    </ul>
                  </div>
                `;
              }).join('')}
            </div>

            <h3 style="font-family: var(--font-sans); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">[ Craft Proof: Compliance & Brand Voice Snippets ]</h3>
            <div class="before-after-container" style="display: flex; flex-direction: column; gap: 2rem; border: 1px solid rgba(28, 28, 28, 0.08); margin-bottom: 3.5rem;">
              ${proj.before_after.map((ba, idx) => {
                const parseHighlights = (text) => text.replace(/\[(.*?)\]/g, '<span class="marker-highlight">$1</span>');
                const isLast = idx === proj.before_after.length - 1;
                const borderStyle = isLast ? '' : 'border-bottom: 1px dashed rgba(28,28,28,0.1); padding-bottom: 1.5rem; margin-bottom: 0.5rem;';
                return `
                  <div class="before-after-row" style="text-align: left; ${borderStyle}">
                    <div class="ba-card">
                      <span class="ba-label before" style="margin-bottom: 0.5rem;">${ba.label_before}</span>
                      <p class="ba-text italic" style="font-size: 0.95rem;">"${parseHighlights(ba.before)}"</p>
                    </div>
                    <div class="ba-card">
                      <span class="ba-label after" style="margin-bottom: 0.5rem;">After (Written by ${data.personal.name})</span>
                      <p class="ba-text" style="font-size: 0.95rem;">"${parseHighlights(ba.after)}"</p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Supporting Credential block -->
            <div style="background-color: rgba(46, 91, 136, 0.04); border: 2px dashed var(--ink-accent-blue); padding: 2.25rem; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem; text-align: left;">
              <div style="max-width: 650px;">
                <h4 style="font-family: var(--font-sans); font-weight: 700; color: var(--ink-accent-blue); margin-bottom: 0.4rem; font-size: 1.1rem;">Earned Brand Authority Credential</h4>
                <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5;">
                  Placed contributed strategic content for HardyPaw in a leading industry publication: <em>"How Early Socialization Shapes a Dog"</em> — K9 Magazine. This program extended brand authority into earned, industry-adjacent channels beyond their owned properties.
                </p>
              </div>
              <a href="https://www.k9magazine.com/how-early-socialization-shapes-a-dog/" target="_blank" rel="noopener" class="btn btn-primary" style="background-color: var(--ink-accent-blue); border-color: var(--ink-accent-blue); padding: 0.75rem 1.75rem; font-size: 0.85rem; white-space: nowrap;">Read Published Guest Post</a>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="case-study-card fade-in" data-project-id="${proj.id}" data-industries="${proj.filterClass}">
          <div class="case-study-header">
            <div class="case-study-title-row">
              <div class="industry-tags" style="margin-bottom: 0.25rem;">
                <span class="industry-tag accent-tag">${proj.category}</span>
              </div>
              <h2>${proj.brand}</h2>
            </div>
            <p class="case-study-brief">
              ${proj.brief}
            </p>
            <div class="case-study-expand-trigger">
              <span>[ EXPAND STRATEGIC DIAGNOSIS ]</span>
              <span class="arrow-icon">↓</span>
            </div>
          </div>

          <!-- Expanded Detail -->
          <div class="case-study-detail" id="detail-${proj.id}">
            <div class="strategy-section-grid">
              <div class="strategy-block">
                <h3>Client Snapshot</h3>
                <p>${proj.snapshot}</p>
              </div>
              <div class="strategy-block">
                <h3>The Brief / The Problem</h3>
                <p>${proj.problem}</p>
              </div>
              <div class="strategy-block">
                <h3>The Strategic Approach</h3>
                <p>${proj.approach}</p>
              </div>
              <div class="strategy-block">
                <h3>What was delivered</h3>
                <ul>
                  ${proj.deliverables.map(del => `<li>${del}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- Before/After Compare -->
            <div class="before-after-container">
              <div class="ba-card">
                <span class="ba-label before">Before</span>
                <p class="ba-text italic">"${proj.before.replace(/\[(.*?)\]/g, '<span class=\"marker-highlight\">$1</span>')}"</p>
              </div>
              <div class="ba-card">
                <span class="ba-label after">After (Written by ${data.personal.name})</span>
                <p class="ba-text">"${proj.after.replace(/\[(.*?)\]/g, '<span class=\"marker-highlight\">$1</span>')}"</p>
              </div>
            </div>

            <!-- Metrics block -->
            <div class="case-study-outcome">
              <div class="outcome-stat" style="position: relative; display: inline-block;">
                ${proj.metric}
                <svg style="position: absolute; top: -10%; left: -10%; width: 120%; height: 120%; pointer-events: none;" viewBox="0 0 100 100" fill="none"><path d="M50,5 C78,5 95,25 93,50 C91,72 72,92 50,92 C28,92 8,72 6,48 C4,24 25,8 55,9" stroke="var(--ink-accent)" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <div class="outcome-text">
                ${proj.metric_desc}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  // Render Smaller Campaign Cards (Tier 2)
  const cardsContainer = document.getElementById('pow-project-cards-container');
  const cardProjects = data.projects.filter(p => p.type === 'card');
  
  cardsContainer.innerHTML = cardProjects.map(proj => `
    <div class="project-card" data-industries="${proj.filterClass}">
      <div class="project-card-header">
        <div class="project-card-title-row">
          <span class="industry-tag" style="font-size: 0.65rem; margin-bottom: 0.4rem;">${proj.category}</span>
          <h3>${proj.brand}</h3>
        </div>
        <p class="description">
          ${proj.brief}
        </p>
        <ul class="deliverables">
          ${proj.deliverables.map(del => `<li>${del}</li>`).join('')}
        </ul>
      </div>
      ${proj.quote ? `<p class="pull-quote">"${proj.quote}"</p>` : ''}
    </div>
  `).join('');

  // Update total counts
  const totalCount = fullProjects.length + cardProjects.length;
  document.getElementById('project-count-display').textContent = `Showing ${totalCount} projects`;
}

/**
 * 3. Interactive Toggles for Full Case Studies (Tier 1)
 */
function initCaseStudyToggles() {
  const cards = document.querySelectorAll('.case-study-card');
  
  cards.forEach(card => {
    const trigger = card.querySelector('.case-study-expand-trigger');
    const detail = card.querySelector('.case-study-detail');
    const arrow = card.querySelector('.arrow-icon');
    const projectId = card.getAttribute('data-project-id');
    
    // Toggle details on click
    const toggleDetail = (e) => {
      if (e.target.closest('a') || e.target.closest('button')) {
        return;
      }
      
      const isOpen = detail.classList.contains('active');
      
      if (isOpen) {
        detail.classList.remove('active');
        arrow.style.transform = 'rotate(0deg)';
        trigger.querySelector('span').textContent = '[ EXPAND STRATEGIC DIAGNOSIS ]';
        trackAnalyticsEvent('Closed Case Study', projectId);
      } else {
        detail.classList.add('active');
        arrow.style.transform = 'rotate(180deg)';
        trigger.querySelector('span').textContent = '[ COLLAPSE STRATEGIC DIAGNOSIS ]';
        trackAnalyticsEvent('Opened Case Study', projectId);
        
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    };
    
    card.querySelector('.case-study-header').addEventListener('click', toggleDetail);
  });
}

/**
 * 4. Industry Filtering Logic
 */
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const caseStudies = document.querySelectorAll('.case-study-card');
  const projectCards = document.querySelectorAll('.project-card');
  const countDisplay = document.getElementById('project-count-display');
  
  if (!filterBtns.length) return;
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterValue = btn.getAttribute('data-filter');
      
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      let visibleCount = 0;
      
      caseStudies.forEach(card => {
        const industries = card.getAttribute('data-industries');
        if (filterValue === 'all' || industries.includes(filterValue)) {
          card.style.display = 'grid';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
      
      projectCards.forEach(card => {
        const industries = card.getAttribute('data-industries');
        if (filterValue === 'all' || industries.includes(filterValue)) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
      
      if (countDisplay) {
        countDisplay.textContent = `Showing ${visibleCount} project${visibleCount === 1 ? '' : 's'}`;
      }
      
      trackAnalyticsEvent('Filtered Projects', filterValue);
    });
  });
}

/**
 * 5. Client-Side Contact Form Handling & Simulation
 */
function initContactForm(data) {
  const form = document.getElementById('portfolio-contact-form');
  const statusMessage = document.getElementById('form-message-status');
  
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const projectType = document.getElementById('project-type').value;
    const message = document.getElementById('message').value.trim();
    const website = document.getElementById('website').value;
    const submitBtn = form.querySelector('.form-submit-btn');
    
    statusMessage.className = 'form-status';
    statusMessage.textContent = '';
    
    if (!name || !email || !projectType || !message) {
      statusMessage.classList.add('error');
      statusMessage.textContent = 'Please complete all required fields.';
      return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Transmitting Strategy Request...';
    submitBtn.disabled = true;
    
    trackAnalyticsEvent('Form Submission Started', projectType);
    
    fetch('/api/submit-contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        project_type: projectType,
        message,
        website
      })
    })
    .then(async (response) => {
      const result = await response.json();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      if (response.ok && result.success) {
        statusMessage.classList.add('success');
        statusMessage.textContent = result.message;
        trackAnalyticsEvent('Form Submission Success', projectType);
        form.reset();
      } else {
        statusMessage.classList.add('error');
        statusMessage.textContent = result.message || 'An error occurred during submission.';
        trackAnalyticsEvent('Form Submission Failed', result.message);
      }
    })
    .catch((err) => {
      console.error('Submission error:', err);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      statusMessage.classList.add('error');
      statusMessage.textContent = 'We encountered a temporary database connection issue. Please send your details to chawlamanan@outlook.com directly.';
      trackAnalyticsEvent('Form Submission Error', err.message);
    });
  });
}

/**
 * 6. Check Query Parameters for Dynamic Expansion
 */
function checkQueryParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetProject = urlParams.get('project');
  
  if (!targetProject) return;
  
  const targetCard = document.querySelector(`[data-project-id="${targetProject}"]`);
  
  if (targetCard) {
    const detail = targetCard.querySelector('.case-study-detail');
    const trigger = targetCard.querySelector('.case-study-expand-trigger');
    const arrow = targetCard.querySelector('.arrow-icon');
    
    if (detail && trigger && arrow) {
      detail.classList.add('active');
      arrow.style.transform = 'rotate(180deg)';
      trigger.querySelector('span').textContent = '[ COLLAPSE STRATEGIC DIAGNOSIS ]';
      
      setTimeout(() => {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }
}

/**
 * 7. Simple Analytics Event Hook
 */
function trackAnalyticsEvent(eventName, eventDetails) {
  console.log(`[Analytics Engine] event: "${eventName}" | data: "${eventDetails}" | timestamp: ${new Date().toISOString()}`);
}

/**
 * 8. Scroll-Triggered Layout Animators (Trust Stamps & SVG Branching Lines)
 */
function initScrollObservers() {
  const stamps = document.querySelectorAll('.trust-stamp');
  const branchSvgs = document.querySelectorAll('.branching-svg');
  
  if (!stamps.length && !branchSvgs.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve to trigger animation exactly once
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 }); // Trigger when 25% of the target is in view

  stamps.forEach(stamp => observer.observe(stamp));
  branchSvgs.forEach(svg => observer.observe(svg));
}


