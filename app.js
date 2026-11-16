document.addEventListener('DOMContentLoaded', () => {
  // Fetch central data registry directly from static content.json
  fetch('content.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load content.json (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      // Initialize layout rendering
      if (document.getElementById('hero-headline')) {
        renderHomePage(data);
      }
      if (document.getElementById('cs-case-studies-container') || document.getElementById('pow-case-studies-container')) {
        renderCaseStudiesPage(data);
      }
      if (document.getElementById('work-samples-panel')) {
        renderWorkSamplesPage(data);
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
        <a href="case-studies.html?project=${item.id}" class="proof-item">
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
 * 2. Render Case Studies Page Dynamically (case-studies.html)
 */
function renderCaseStudiesPage(data) {
  const pageData = data.case_studies_page || data.proof_of_work_page;
  if (pageData) {
    const subtextEl = document.getElementById('cs-subtext') || document.getElementById('pow-subtext');
    if (subtextEl) {
      subtextEl.textContent = pageData.subtext;
    }
    
    // Render Campaign Cards Header
    if (pageData.campaign_cards_header) {
      const tagEl = document.getElementById('cs-cards-tag') || document.getElementById('pow-cards-tag');
      const titleEl = document.getElementById('cs-cards-title') || document.getElementById('pow-cards-title');
      const subEl = document.getElementById('cs-cards-subtitle') || document.getElementById('pow-cards-subtitle');
      if (tagEl) tagEl.textContent = pageData.campaign_cards_header.tag;
      if (titleEl) titleEl.textContent = pageData.campaign_cards_header.title;
      if (subEl) subEl.textContent = pageData.campaign_cards_header.subtitle;
    }

    // Render Bottom CTA
    if (pageData.cta) {
      const headlineEl = document.getElementById('cs-cta-headline') || document.getElementById('pow-cta-headline');
      const subheadEl = document.getElementById('cs-cta-subhead') || document.getElementById('pow-cta-subhead');
      const btnEl = document.getElementById('cs-cta-btn') || document.getElementById('pow-cta-btn');
      if (headlineEl) headlineEl.textContent = pageData.cta.headline;
      if (subheadEl) subheadEl.textContent = pageData.cta.subhead;
      if (btnEl) btnEl.textContent = pageData.cta.btn_text;
    }
  }

  // Render Footer Elements
  if (data.personal) {
    if (document.getElementById('footer-logo')) document.getElementById('footer-logo').textContent = data.personal.footer_logo || 'MANAN | CONTENT STRATEGIST';
    if (document.getElementById('footer-subtext')) document.getElementById('footer-subtext').textContent = data.personal.footer_subtext || '© 2026 Gurgaon, India. Built with structured logic.';
  }

  // Render Full Case Studies (Tier 1)
  const caseStudiesContainer = document.getElementById('cs-case-studies-container') || document.getElementById('pow-case-studies-container');
  if (!caseStudiesContainer) return;

  const fullProjects = (data.projects || []).filter(p => p.type === 'full');
  
  caseStudiesContainer.innerHTML = fullProjects.map(proj => {
    if (proj.layout === 'route') {
      return `
        <div class="case-study-card route-case-study fade-in" data-project-id="${proj.id}" data-industries="${proj.filterClass}">
          <div class="case-study-header" style="text-align: left;">
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 1.5px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
              ${proj.category}
            </div>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; color: var(--text); margin: 0 0 0.5rem 0; font-weight: 700;">
               ${proj.brand}
            </h2>
            <p class="case-study-brief" style="color: var(--text-muted); margin: 0 0 1.5rem 0;">
              ${proj.brief}
            </p>
            <div class="case-study-expand-trigger" style="justify-content: flex-start; gap: 0.5rem; padding: 0.5rem 0 0 0;">
              <span>[ EXPAND ROUTE DIAGNOSIS ]</span>
              <span class="arrow-icon" style="color: var(--accent); transform: rotate(0deg); transition: transform 0.2s ease;">↓</span>
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
                  <h3>About the Brand</h3>
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
                  <h3>Objective</h3>
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
                  <h3>Strategy</h3>
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
                  <h3>Outcome</h3>
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
                const noteColors = ['var(--surface)', '#FAFAFA', '#F0F0F0'];
                const color = noteColors[index % noteColors.length];
                const rotateDeg = (index % 2 === 0 ? -0.8 : 0.8);
                return `
                  <div style="background-color: ${color}; border: 1px solid var(--border); padding: 1.75rem; box-shadow: 2px 4px 10px rgba(0,0,0,0.02); transform: rotate(${rotateDeg}deg); position: relative; min-height: 220px; display: flex; flex-direction: column; gap: 0.75rem; border-radius: 6px; text-align: left;">
                    <h4 style="font-family: var(--font-sans); font-size: 1rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-family: var(--font-hand); color: var(--accent); font-size: 1.5rem; font-weight: 700;">0${index + 1}</span>
                      ${area.title}
                    </h4>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                      ${area.bullets.map(b => `<li style="position: relative; padding-left: 1rem;"><span style="position: absolute; left: 0; color: var(--accent);">•</span>${b}</li>`).join('')}
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
    }
  }).join('');

  // Render Smaller Campaign Cards (Tier 2)
  const cardsContainer = document.getElementById('cs-project-cards-container') || document.getElementById('pow-project-cards-container');
  const cardProjects = (data.projects || []).filter(p => p.type === 'card');
  
  if (cardsContainer) {
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
  }

  // Update total counts
  const countDisplay = document.getElementById('project-count-display');
  if (countDisplay) {
    const totalCount = fullProjects.length + cardProjects.length;
    countDisplay.textContent = `Showing ${totalCount} projects`;
  }
}

/**
 * 2b. Render Work Samples Page Dynamically (proof-of-work.html)
 */
function renderWorkSamplesPage(data) {
  const pageData = data.work_samples_page || {};
  const samples = data.work_samples || [];

  // Render Hero Subtext
  const subtextEl = document.getElementById('ws-subtext');
  if (subtextEl && pageData.subtext) {
    subtextEl.innerHTML = pageData.subtext;
  }

  // Render CTA
  if (pageData.cta) {
    const headlineEl = document.getElementById('ws-cta-headline');
    const subheadEl = document.getElementById('ws-cta-subhead');
    const btnEl = document.getElementById('ws-cta-btn');
    if (headlineEl && pageData.cta.headline) headlineEl.textContent = pageData.cta.headline;
    if (subheadEl && pageData.cta.subhead) subheadEl.textContent = pageData.cta.subhead;
    if (btnEl && pageData.cta.btn_text) btnEl.textContent = pageData.cta.btn_text;
  }

  // Render Footer Elements
  if (data.personal) {
    if (document.getElementById('footer-logo')) document.getElementById('footer-logo').textContent = data.personal.footer_logo || 'MANAN | CONTENT STRATEGIST';
    if (document.getElementById('footer-subtext')) document.getElementById('footer-subtext').textContent = data.personal.footer_subtext || '© 2026 Gurgaon, India. Built with structured logic.';
  }

  // Categories & Tabs
  const rawCategories = pageData.categories || [
    { id: 'blogs', label: 'Blogs', order: 1 },
    { id: 'reels', label: 'Reels', order: 2 },
    { id: 'social', label: 'Social Posts', order: 3 },
    { id: 'emails', label: 'Emails', order: 4 }
  ];
  const sortedCategories = [...rawCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Hide any tab that has zero items
  const availableCategories = sortedCategories.filter(cat => {
    return samples.some(s => s.type === cat.id);
  });

  if (availableCategories.length === 0) return;

  // Determine active tab from URL query param ?type=<id>
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  let activeCategoryId = availableCategories[0].id;
  if (typeParam && availableCategories.some(cat => cat.id === typeParam)) {
    activeCategoryId = typeParam;
  }

  const tablist = document.getElementById('work-samples-tablist');
  const panel = document.getElementById('work-samples-panel');

  if (tablist) {
    tablist.innerHTML = availableCategories.map(cat => {
      const isActive = cat.id === activeCategoryId;
      return `
        <button 
          class="filter-btn ${isActive ? 'active' : ''}" 
          role="tab" 
          id="tab-${cat.id}" 
          aria-selected="${isActive ? 'true' : 'false'}" 
          aria-controls="work-samples-panel" 
          tabindex="${isActive ? '0' : '-1'}" 
          data-type="${cat.id}">
          ${cat.label}
        </button>
      `;
    }).join('');

    const tabButtons = tablist.querySelectorAll('[role="tab"]');

    function setActiveTab(newTypeId, moveFocus = false) {
      if (!availableCategories.some(c => c.id === newTypeId)) return;
      activeCategoryId = newTypeId;

      // Update URL query parameter without page reload
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('type', newTypeId);
      window.history.replaceState({ type: newTypeId }, '', newUrl.toString());

      tabButtons.forEach(btn => {
        const isMatch = btn.getAttribute('data-type') === newTypeId;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        btn.setAttribute('tabindex', isMatch ? '0' : '-1');
        if (isMatch && moveFocus) {
          btn.focus();
        }
      });

      if (panel) {
        panel.setAttribute('aria-labelledby', `tab-${newTypeId}`);
        renderTabContent(newTypeId, samples, panel);
      }
    }

    tabButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const typeId = btn.getAttribute('data-type');
        setActiveTab(typeId);
      });

      // Arrow-key keyboard navigation for accessibility
      btn.addEventListener('keydown', (e) => {
        let targetIndex = null;
        if (e.key === 'ArrowRight') {
          targetIndex = (index + 1) % tabButtons.length;
        } else if (e.key === 'ArrowLeft') {
          targetIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = tabButtons.length - 1;
        }

        if (targetIndex !== null) {
          e.preventDefault();
          const targetBtn = tabButtons[targetIndex];
          const newTypeId = targetBtn.getAttribute('data-type');
          setActiveTab(newTypeId, true);
        }
      });
    });
  }

  // Render initial tab content
  if (panel) {
    panel.setAttribute('aria-labelledby', `tab-${activeCategoryId}`);
    renderTabContent(activeCategoryId, samples, panel);
  }
}

/**
 * 2c. Render Work Sample Items by Type
 */
function renderTabContent(typeId, samples, container) {
  const items = samples.filter(s => s.type === typeId);

  if (items.length === 0) {
    container.innerHTML = `
      <div style="padding: 3rem 1.5rem; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;">
        <p style="margin: 0; color: var(--text-muted);">No samples currently listed under this category.</p>
      </div>
    `;
    return;
  }

  if (typeId === 'blogs') {
    container.innerHTML = `
      <div class="work-samples-grid-blogs">
        ${items.map(item => `
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="blog-sample-card">
            <div class="blog-card-content">
              <span class="sample-brand-tag">${item.brand}</span>
              <h2 class="blog-card-title">${item.title}</h2>
            </div>
            <div class="sample-card-footer">
              <span class="sample-action-text">Read article</span>
              <span class="sample-arrow">→</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  } else if (typeId === 'emails') {
    container.innerHTML = `
      <div class="work-samples-grid-emails">
        ${items.map(item => `
          <div class="email-sample-card">
            <div>
              <h2 class="email-sample-brand">${item.brand}</h2>
              <div class="email-meta-list">
                <div class="email-meta-row">
                  <span class="email-meta-label">Challenge</span>
                  <p class="email-meta-value">${item.challenge}</p>
                </div>
                <div class="email-meta-row">
                  <span class="email-meta-label">ICP</span>
                  <p class="email-meta-value">${item.icp}</p>
                </div>
                <div class="email-meta-row">
                  <span class="email-meta-label">Resolution</span>
                  <p class="email-meta-value">${item.resolution}</p>
                </div>
              </div>
            </div>
            <a href="${item.draft_url}" target="_blank" rel="noopener noreferrer" class="email-draft-link">
              View email draft <span class="arrow">→</span>
            </a>
          </div>
        `).join('')}
      </div>
    `;
  } else if (typeId === 'reels') {
    container.innerHTML = `
      <div class="work-samples-grid-reels">
        ${items.map(item => `
          <div class="reel-sample-card">
            <a href="${item.live_url}" target="_blank" rel="noopener noreferrer" class="reel-screenshot-link" aria-label="Watch live reel for ${item.brand}">
              <img src="${item.screenshot}" alt="Instagram reel for ${item.brand}" class="reel-screenshot" loading="lazy" width="450" height="800">
            </a>
            <div class="reel-info-row">
              <h2 class="reel-brand-name">${item.brand}</h2>
              <a href="${item.live_url}" target="_blank" rel="noopener noreferrer" class="reel-watch-link">
                Watch live →
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (typeId === 'social') {
    container.innerHTML = `
      <div class="work-samples-masonry-social">
        ${items.map(item => `
          <div class="social-sample-card">
            <a href="${item.live_url}" target="_blank" rel="noopener noreferrer" class="social-screenshot-link" aria-label="View social post for ${item.brand}">
              <img src="${item.screenshot}" alt="Social post for ${item.brand} on ${item.platform || 'Social'}" class="social-screenshot" loading="lazy">
            </a>
            <div class="social-meta-row">
              <div class="social-header-row">
                <h2 class="social-brand-name">${item.brand}</h2>
                ${item.platform ? `<span class="social-platform-pill">${item.platform}</span>` : ''}
              </div>
              <a href="${item.live_url}" target="_blank" rel="noopener noreferrer" class="social-view-link">
                View post →
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
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
  const filterBtns = document.querySelectorAll('.filter-buttons .filter-btn');
  const caseStudies = document.querySelectorAll('.case-study-card');
  const projectCards = document.querySelectorAll('.project-card');
  const countDisplay = document.getElementById('project-count-display');
  
  if (!filterBtns.length) return;
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterValue = btn.getAttribute('data-filter');
      if (!filterValue) return;
      
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
 * 5. Client-Side Contact Form Handling & Multi-Tier Transmission
 */
function initContactForm(data) {
  const form = document.getElementById('portfolio-contact-form');
  const statusMessage = document.getElementById('form-message-status');
  
  if (!form) return;
  
  const recipientEmail = (data && data.personal && data.personal.email) ? data.personal.email : 'chawlamanan@outlook.com';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const projectTypeEl = document.getElementById('project-type');
    const messageEl = document.getElementById('message');
    const websiteEl = document.getElementById('website');
    const submitBtn = form.querySelector('.form-submit-btn');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const projectType = projectTypeEl ? projectTypeEl.value : '';
    const message = messageEl ? messageEl.value.trim() : '';
    const website = websiteEl ? websiteEl.value : '';
    
    statusMessage.className = 'form-status';
    statusMessage.textContent = '';
    statusMessage.style.display = 'none';
    
    if (!name || !email || !projectType || !message) {
      statusMessage.className = 'form-status error';
      statusMessage.textContent = 'Please complete all required fields.';
      statusMessage.style.display = 'block';
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      statusMessage.className = 'form-status error';
      statusMessage.textContent = 'Please enter a valid work email address.';
      statusMessage.style.display = 'block';
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Transmitting Strategy Request...';
    submitBtn.disabled = true;
    
    trackAnalyticsEvent('Form Submission Started', projectType);
    
    const payload = {
      name,
      email,
      project_type: projectType,
      message,
      website
    };

    let delivered = false;
    let isActivationNotice = false;
    let confirmationMsg = 'Inquiry delivered. Manan will review your requirements and reply in under 24 business hours.';

    // 1. Primary Channel: Local Serverless API Route (/api/submit-contact)
    try {
      const response = await fetch('/api/submit-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result && result.success) {
          delivered = true;
          if (result.message) confirmationMsg = result.message;
          if (result.requiresActivation) isActivationNotice = true;
        }
      }
    } catch (apiErr) {
      console.warn('[Contact Form] Primary API endpoint offline or local development, attempting direct fallback...', apiErr);
    }

    // 2. Secondary Channel: Direct FormSubmit fallback if API route failed or returned error
    if (!delivered) {
      try {
        const backupResponse = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            _replyto: email,
            _subject: `New Strategy Inquiry: ${name} (${projectType})`,
            'Client Name': name,
            'Work Email': email,
            'Project Requirement': projectType,
            'Project Description': message,
            _template: 'table',
            _captcha: 'false'
          })
        });

        if (backupResponse.ok) {
          const backupResult = await backupResponse.json();
          if (backupResult && (backupResult.success === 'true' || backupResult.success === true)) {
            delivered = true;
          } else if (backupResult && backupResult.message && (backupResult.message.toLowerCase().includes('confirm') || backupResult.message.toLowerCase().includes('activat'))) {
            delivered = true;
            isActivationNotice = true;
            confirmationMsg = 'Action Required: FormSubmit sent a verification email to ' + recipientEmail + '. Please check your Outlook Junk/Spam folder and click "Activate Form" once to complete setup.';
          }
        }
      } catch (backupErr) {
        console.warn('[Contact Form] Direct delivery backup failed:', backupErr);
      }
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (delivered) {
      // Save local backup so inquiries are immediately visible in the CMS
      try {
        const localList = JSON.parse(localStorage.getItem('portfolio_inquiries_local') || '[]');
        localList.unshift({
          name,
          email,
          project_type: projectType,
          message,
          created_at: new Date().toISOString()
        });
        if (localList.length > 50) localList.length = 50;
        localStorage.setItem('portfolio_inquiries_local', JSON.stringify(localList));
      } catch (storageErr) {
        // ignore
      }

      statusMessage.style.display = 'block';
      if (isActivationNotice) {
        statusMessage.className = 'form-status';
        statusMessage.style.backgroundColor = '#FEF9E7';
        statusMessage.style.borderColor = '#F1C40F';
        statusMessage.style.color = '#7D6608';
        statusMessage.innerHTML = `<strong>One-Time Setup Required:</strong> ${confirmationMsg}`;
      } else {
        statusMessage.className = 'form-status success';
        statusMessage.style.backgroundColor = '';
        statusMessage.style.borderColor = '';
        statusMessage.style.color = '';
        statusMessage.textContent = confirmationMsg;
      }
      trackAnalyticsEvent('Form Submission Success', projectType);
      form.reset();
    } else {
      const subject = encodeURIComponent(`Strategy Inquiry: ${name} (${projectType})`);
      const bodyText = encodeURIComponent(`Hi Manan,\n\nName: ${name}\nEmail: ${email}\nRequirement: ${projectType}\n\nProject Scope & Metrics:\n${message}\n`);
      const mailtoUrl = `mailto:${recipientEmail}?subject=${subject}&body=${bodyText}`;

      statusMessage.className = 'form-status error';
      statusMessage.innerHTML = `
        Unable to transmit automatically. 
        <a href="${mailtoUrl}" style="display: block; margin-top: 6px; font-weight: 600; text-decoration: underline; color: #1c1c1c;">
          Click here to send directly via email (${recipientEmail}) →
        </a>
      `;
      statusMessage.style.display = 'block';
      trackAnalyticsEvent('Form Submission Fallback Triggered', projectType);
    }
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


