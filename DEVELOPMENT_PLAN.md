# RapidAI Website Development Plan & Bug Fixes

## Project Overview
This document outlines the current state, identified issues, and planned improvements for the RapidAI multilingual website with Decap CMS integration.

**Last Updated:** 2025-09-25  
**Repository:** joru10/website_CMS  
**Live Site:** https://comfy-panda-0d488a.netlify.app/

## Current Architecture

### Tech Stack
- **Frontend:** Static HTML/CSS/JS with Tailwind CSS
- **CMS:** Decap CMS with GitHub backend
- **Deployment:** Netlify with auto-deploy from main branch
- **Authentication:** GitHub OAuth with PKCE via Netlify Functions
- **Internationalization:** Manual i18n with JSON files (EN/ES/FR)

### Key Components
- `index.html` - Main homepage with multilingual sections
- `script.js` - Frontend logic, i18n, dynamic content loading
- `admin/index.html` - Primary Decap CMS interface
- `admin/minimal-cms.html` - Lightweight CMS interface with preview templates
- `netlify/functions/oauth.js` - OAuth handler for CMS authentication
- `translations/*.json` - Static translation files
- `content/` - CMS-managed content (JSON/Markdown)

## Current Issues & Bugs

### Priority 1: Critical Issues

#### 1. Translation Key Inconsistencies
**Status:** 🔴 Critical  
**Impact:** Content may display in wrong language or show fallback text

**Problem:**
- Duplicate translation keys between `translations/*.json` and hardcoded `script.js`
- Some CMS content overrides static translations inconsistently
- Missing translation keys for certain UI elements

**Files Affected:**
- `script.js` (lines 140-900)
- `translations/en.json`, `translations/es.json`, `translations/fr.json`

**Solution:**
1. Audit all translation keys across files
2. Establish single source of truth (prefer CMS over static)
3. Add missing keys to translation files
4. Remove duplicate hardcoded translations from `script.js`

#### 2. Spanish Translation Formality Inconsistency
**Status:** 🟡 Medium  
**Impact:** Inconsistent user experience for Spanish users

**Problem:**
- Mix of formal ("su") and informal ("tú") address in Spanish translations
- User preference is for informal "tuteo" style

**Files Affected:**
- `translations/es.json`
- All Spanish content files in `content/*/index.es.json`

**Solution:**
1. Standardize all Spanish content to use "tú" form
2. Update CMS content to match informal tone
3. Create style guide for future Spanish content

### Priority 2: Functional Issues

#### 3. Hard-coded Placeholder Images
**Status:** 🟡 Medium  
**Impact:** Non-professional appearance, potential loading issues

**Problem:**
- Hero and About sections use `picsum.photos` placeholder images
- No brand imagery or proper media management

**Files Affected:**
- `index.html` (hero and about sections)
- CMS media folder configuration

**Solution:**
1. Replace with proper brand imagery
2. Configure CMS media uploads to `static/uploads/`
3. Update image references to use CMS-managed assets

#### 4. Subpage Navigation Dependencies
**Status:** 🟡 Medium  
**Impact:** Potential broken functionality on secondary pages

**Problem:**
- Footer links reference pages (`cases.html`, `education.html`, etc.) that may not exist
- Shared scripts and sections may not be available on all pages

**Files Affected:**
- `index.html` footer section
- Missing subpage files

**Solution:**
1. Create missing subpage templates
2. Ensure shared scripts are included on all pages
3. Implement consistent navigation structure

### Priority 3: Performance & UX Issues

#### 5. Sequential Content Loading
**Status:** 🟢 Low  
**Impact:** Slower page load times

**Problem:**
- `script.js` fetches multiple JSON/MD files sequentially
- No caching for repeated navigation

**Files Affected:**
- `script.js` content loading functions

**Solution:**
1. Implement batched loading with `Promise.all`
2. Add client-side caching for content
3. Optimize manifest loading strategy

#### 6. Accessibility Gaps
**Status:** 🟢 Low  
**Impact:** Poor accessibility compliance

**Problem:**
- Missing ARIA labels on interactive elements
- Language switcher lacks proper accessibility attributes
- Focus states not clearly visible

**Files Affected:**
- `index.html` (navigation, modals, forms)

**Solution:**
1. Add ARIA labels to all interactive elements
2. Improve keyboard navigation
3. Enhance focus indicators

## Planned Improvements

### Phase 1: Content Management Enhancement

#### 1. CMS Preview Templates
**Status:** 🟡 In Progress  
**Files:** `admin/minimal-cms.html`

**Implementation:**
- ✅ Added preview templates for blog/news/education
- 🔄 Test in production environment
- ⏳ Commit and deploy changes

#### 2. Queue-based Content Generation
**Status:** 🟡 In Progress  
**Files:** `scripts/generate-content.js`

**Implementation:**
- ✅ Added `--from` parameter for YAML/JSON queues
- ⏳ Create sample queue files
- ⏳ Document workflow in README

### Phase 2: Content Governance

#### 1. Translation Audit System
**Status:** ⏳ Planned

**Implementation:**
1. Create script to validate translation completeness
2. Check all content has required locales (EN/ES/FR)
3. Identify missing or inconsistent translations
4. Generate reports for content gaps

#### 2. Content Validation
**Status:** ⏳ Planned

**Implementation:**
1. Validate manifest entries have all required locales
2. Check for broken internal links
3. Verify image references are valid
4. Ensure CMS schema compliance

### Phase 3: Performance Optimization

#### 1. Lazy Loading Implementation
**Status:** ⏳ Planned

**Implementation:**
1. Implement intersection observer for content sections
2. Load content only when sections become visible
3. Add loading states and skeleton screens
4. Cache loaded content in sessionStorage

#### 2. Bundle Optimization
**Status:** ⏳ Planned

**Implementation:**
1. Minimize JavaScript payload
2. Optimize CSS delivery
3. Implement resource hints (preload, prefetch)
4. Add service worker for offline functionality

### Phase 4: Developer Experience

#### 1. Documentation Enhancement
**Status:** ⏳ Planned

**Files to Create:**
- `docs/CMS_SETUP.md` - OAuth configuration guide
- `docs/CONTENT_WORKFLOW.md` - Editor guidelines
- `docs/DEPLOYMENT.md` - Build and deploy process
- `README.md` - Enhanced project overview

#### 2. Development Tools
**Status:** ⏳ Planned

**Implementation:**
1. Add linting for translation files
2. Create pre-commit hooks for content validation
3. Implement automated testing for critical paths
4. Add development server with hot reload

## Implementation Roadmap

### Week 1: Critical Fixes
- [ ] Fix translation key inconsistencies
- [ ] Standardize Spanish translations to tuteo
- [ ] Deploy CMS preview templates
- [ ] Test OAuth flow in production

### Week 2: Content & Media
- [ ] Replace placeholder images with brand assets
- [ ] Create missing subpage templates
- [ ] Implement content validation scripts
- [ ] Document CMS workflow

### Week 3: Performance & UX
- [ ] Optimize content loading strategy
- [ ] Improve accessibility compliance
- [ ] Add loading states and error handling
- [ ] Implement caching strategy

### Week 4: Documentation & Tools
- [ ] Complete documentation suite
- [ ] Add development tools and scripts
- [ ] Create content governance workflows
- [ ] Plan future enhancements

## Testing Strategy

### Manual Testing Checklist
- [ ] Language switching works on all sections
- [ ] CMS login and content editing functions
- [ ] All forms submit successfully
- [ ] Images load correctly across devices
- [ ] Navigation works on all pages
- [ ] Responsive design on mobile/tablet

### Automated Testing
- [ ] Translation key completeness
- [ ] Content manifest validation
- [ ] Link checking (internal/external)
- [ ] Image reference validation
- [ ] Performance benchmarks

## Monitoring & Maintenance

### Regular Tasks
- [ ] Weekly translation completeness check
- [ ] Monthly performance audit
- [ ] Quarterly dependency updates
- [ ] Content backup verification

### Key Metrics
- Page load time (target: <3s)
- CMS login success rate (target: >95%)
- Translation coverage (target: 100%)
- Accessibility score (target: >90)

## Contact & Resources

**Primary Developer:** Cascade AI Assistant  
**Repository:** https://github.com/joru10/website_CMS  
**CMS Admin:** https://comfy-panda-0d488a.netlify.app/admin/  
**OAuth Diagnostics:** https://comfy-panda-0d488a.netlify.app/oauth/version

---

*This document is maintained alongside the codebase and should be updated with each significant change or deployment.*
