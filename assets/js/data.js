/*
 * Site content.
 *
 * Copy here comes from the approved Milestone 3/4 prototypes. Reels, jobs and
 * packages below are the built-in defaults: once the Google Sheet is connected,
 * the "Reels", "Jobs" and "Packages" tabs replace them live, so the team can
 * update the site without touching code.
 */
window.SS_DATA = (function () {
  const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  /* ---------- Marketing Labs ---------- */
  const services = [
    ['Brand Identity', 'Shape a coherent brand customers can recognise and trust.', 'Inconsistent positioning and visuals create confusion.', 'Brand strategy, identity systems, messaging, guidelines and creative rollout.'],
    ['Social Media', 'Turn social channels into a consistent brand experience.', 'Irregular content and disconnected campaigns reduce trust.', 'Content strategy, calendars, design, video and channel management.'],
    ['Websites', 'Help people discover, understand and contact your business.', 'A dated or unclear website creates friction.', 'UX, web design, development coordination and conversion pathways.'],
    ['Performance Marketing', 'Build measurable campaigns around business goals.', 'Spend without clear targeting or tracking is difficult to improve.', 'Campaign planning, creative testing, landing pages and reporting.'],
    ['Lead Generation & Calling', 'Reduce the gap between enquiry and response.', 'Potential customers can be lost through slow follow-up.', 'Lead handling processes, calling workflows, CRM and reporting.'],
    ['Content Production', 'Create stories and visuals built for their distribution channels.', 'Beautiful assets alone do not guarantee useful marketing.', 'Photo, video, reels, campaigns and production plans.'],
    ['E-commerce Onboarding', 'Prepare products and catalogues for digital commerce.', 'Listings, images and product content can reduce buying confidence.', 'Product shoots, product listings, catalogues and launch preparation.'],
    ['Print & Brochures', 'Make offline collateral part of the brand system.', 'Inconsistent print assets weaken professional presentation.', 'Brochures, corporate profiles and print-ready creative.'],
    ['Growth Strategy', 'Identify practical opportunities for repeatable growth.', 'Activity without measurement makes planning difficult.', 'Growth audits, positioning, channel planning and measurement frameworks.']
  ].map(([name, intro, problem, output]) => ({ name, slug: slug(name), intro, problem, output }));

  const labWork = [
    { service: 'Brand Identity', client: 'Example · Premium brand launch', title: 'BUILT TO\nSTAND OUT.', work: 'Brand positioning & identity exploration', tags: ['Brand strategy', 'Visual identity', 'Design'], group: 'strategy' },
    { service: 'Social Media', client: 'Example · Healthcare brand', title: 'STORIES\nTHAT STICK.', work: 'Social content for a healthcare audience', tags: ['Social media', 'Content planning', 'Creative'], group: 'content' },
    { service: 'Websites', client: 'Example · Hospitality business', title: 'A BETTER\nFIRST CLICK.', work: 'Website UX and digital presence', tags: ['Website', 'UI/UX', 'Content'], group: 'content' },
    { service: 'Performance Marketing', client: 'Example · Consumer business', title: 'TURN\nATTENTION.', work: 'Performance-led campaign concept', tags: ['Performance', 'Ads', 'Analytics'], group: 'growth' },
    { service: 'Lead Generation & Calling', client: 'Example · Clinic enquiry journey', title: 'DON’T MISS\nTHE LEAD.', work: 'Lead follow-up and enquiry management', tags: ['Lead generation', 'Calling', 'CRM'], group: 'growth' },
    { service: 'Growth Strategy', client: 'Example · Emerging retail brand', title: 'NEXT\nMOVE.', work: 'Business growth and go-to-market planning', tags: ['Strategy', 'Research', 'Growth'], group: 'strategy' }
  ];

  const process = [
    ['01 · DISCOVER', 'Tell us the challenge', 'Are customers finding you? Do they trust you? Are enquiries converting?'],
    ['02 · PLAN', 'Scope the right mix', 'Identify channels, content, production and sales support based on the business.'],
    ['03 · EXECUTE', 'Make the work happen', 'The campaign team and in-house production work from a shared brief.'],
    ['04 · IMPROVE', 'Track & learn', 'Review agreed deliverables, lead quality and measured business signals.']
  ];

  const challenges = [
    { title: 'Visibility & trust', lead: 'People need to discover and believe in your brand', body: 'Brand identity, website, photography, storytelling, social media, brochures and reputation assets.', cta: 'Discuss brand visibility ↗', service: 'Brand Identity' },
    { title: 'Demand & conversion', lead: 'Enquiries need to become measurable opportunities', body: 'Paid campaigns, landing pages, marketing operations, lead handling and growth planning.', cta: 'Discuss lead generation ↗', service: 'Performance Marketing' }
  ];

  const industries = [
    ['Healthcare', 'Build trust through clearer communication, physician visibility and responsible patient acquisition.'],
    ['Retail & Consumer', 'Connect store experiences, product stories and campaigns to purchase interest.'],
    ['Hospitality & Travel', 'Increase discovery, communicate experience and create enquiry pathways.'],
    ['Education', 'Communicate differentiation, build parent/student confidence and support admissions.'],
    ['Manufacturing & B2B', 'Build credibility, show capabilities and support longer B2B purchase cycles.'],
    ['E-commerce & D2C', 'Improve product storytelling, discovery, conversion and retention.'],
    ['Startups & Emerging Businesses', 'From idea validation and MVP to early launch, traction and growth.']
  ].map(([name, intro]) => ({ name, slug: slug(name), intro }));

  const startupStages = [
    ['Idea & Validation', 'Research, positioning, landing pages and early demand experiments.'],
    ['MVP', 'MVP messaging, demonstrations, beta-user acquisition and learning loops.'],
    ['Initial Launch', 'Go-to-market planning, launch creative, website, video and initial acquisition.'],
    ['Growth', 'Performance campaigns, conversion measurement, retention and growth experiments.']
  ];

  const projects = [
    { title: 'Healthcare brand presence', type: 'labs', industry: 'Healthcare', desc: 'Illustrative trust and visibility programme', tags: ['Social Media', 'Content Production', 'Growth Strategy'] },
    { title: 'Retail store launch', type: 'films', industry: 'Retail & Consumer', desc: 'Illustrative launch reel and store coverage', tags: ['Instant — iPhone', 'Store Launch'] },
    { title: 'Consumer product campaign', type: 'both', industry: 'Retail & Consumer', desc: 'Illustrative integrated campaign and creative production', tags: ['Brand Identity', 'Content Production', 'Performance Marketing'] },
    { title: 'Sports league coverage', type: 'films', industry: 'Sports', desc: 'Illustrative pickleball or cricket league reels and match-day content', tags: ['Instant — iPhone', 'Sports Leagues'] },
    { title: 'B2B brand storytelling', type: 'both', industry: 'Manufacturing & B2B', desc: 'Illustrative brand film and digital communication', tags: ['Content Production', 'Growth Strategy', 'Professional'] },
    { title: 'MVP product launch', type: 'labs', industry: 'Startups & Emerging Businesses', desc: 'Illustrative positioning, landing page and launch content', tags: ['Websites', 'Brand Identity', 'Performance Marketing'] }
  ].map((p) => ({ ...p, slug: slug(p.title) }));

  /* ---------- Films ---------- */
  // reelCategory links each occasion to the reels shown on its page.
  const occasions = [
    { name: 'Store Launch', title: 'OPEN\nBIG.', work: 'Store opening reels & event highlights', reelCategory: 'store', form: 'Store / Product Launch' },
    { name: 'Brand & Product', title: 'SHOW\nTHE DETAIL.', work: 'Brand film and product photography', reelCategory: 'brand', form: 'Brand & Product Shoot' },
    { name: 'Weddings & Functions', title: 'ALL THE\nFEELS.', work: 'Celebration highlights and candid moments', reelCategory: 'weddings', form: 'Wedding / Function' },
    { name: 'Sports Leagues', title: 'GAME\nON.', work: 'Pickleball, cricket and multi-day sports coverage', reelCategory: 'sports', form: 'Sports League — Other' },
    { name: 'Real Estate', title: 'EVERY\nANGLE.', work: 'Walkthrough video and property stills', reelCategory: 'realestate', form: 'Real Estate' },
    { name: 'Corporate Events', title: 'MAKE IT\nCOUNT.', work: 'Corporate event production and reels', reelCategory: 'corporate', form: 'Corporate / Concert' },
    { name: 'Movie Promotions', title: 'NOW\nSHOWING.', work: 'Promotional reels for film releases and events', reelCategory: 'movies', form: 'Other / Not Sure' },
    { name: 'Birthday & Parties', title: 'KEEP THE\nMOMENT.', work: 'Birthday and party highlights', reelCategory: 'celebrations', form: 'Birthday / House Party' }
  ].map((o) => ({ ...o, slug: slug(o.name) }));

  const shootIntro = {
    'sports-leagues': 'Pickleball, cricket and multi-day sports coverage: match-day reels, event photography, team stories, highlights and quick updates, scoped to your event.',
    _default: 'Coverage and content made for your occasion, audience, platforms, turnaround and chosen production setup.'
  };

  const packages = {
    instant: {
      'Instant Packages': [
        { tag: 'SOCIAL-FIRST', title: 'Quick Shoot', price: '₹1,699', suffix: 'onwards + GST', desc: 'A compact coverage option for a reel, a launch moment or a quick celebration.', features: ['Short-duration coverage', 'Social-first mobile workflow', 'Reel or edited clips as scoped', 'Delivery timeline confirmed in quote'], popular: false },
        { tag: 'FLEXIBLE COVERAGE', title: 'Half Day', price: '₹3,999', suffix: 'onwards + GST', desc: 'More time to capture important moments with a flexible coverage plan.', features: ['Half-day coverage window', 'Highlights / reels as required', 'Multiple formats on request', 'Crew and output confirmed in quote'], popular: true },
        { tag: 'EVENTS & ACTIVATIONS', title: 'Event Highlights', price: 'Custom quote', suffix: '', desc: 'Store openings, business gatherings, birthdays and community events.', features: ['Event coverage', 'Reels, interviews or highlights', 'On-site selections on request', 'Location and hours scoped'], popular: false }
      ],
      'Business Packages': [
        { tag: 'BRAND EVENTS', title: 'Launch & Event Coverage', price: 'Custom quote', suffix: '', desc: 'Social-first coverage for launches, exhibitions and business activations.', features: ['Brand-specific shot list', 'Event reels and highlights', 'Interview clips if requested', 'Deliverables agreed upfront'], popular: true },
        { tag: 'PRODUCT CONTENT', title: 'Product Reel', price: 'Custom quote', suffix: '', desc: 'Short-form product content for e-commerce, social and campaigns.', features: ['Product visual capture', 'Vertical / square edits', 'Creative direction if needed', 'Per-product scope quoted'], popular: false }
      ],
      'Wedding & Celebrations': [
        { tag: 'ONE EVENT', title: 'Wedding Essential', price: 'Custom quote', suffix: '', desc: 'Instant reels and moments from a key wedding event.', features: ['Coverage for an agreed event', 'Social-ready reels', 'Family moments and highlights', 'Timelines finalised in quote'], popular: false },
        { tag: 'MULTI-EVENT', title: 'Wedding Silver', price: 'Custom quote', suffix: '', desc: 'More moments across celebrations with a flexible reel plan.', features: ['Multi-function coverage', 'Edited reels as scoped', 'Highlights and short clips', 'Travel and timing quoted'], popular: false },
        { tag: 'EXTENDED COVERAGE', title: 'Wedding Gold', price: 'Custom quote', suffix: '', desc: 'Broader coverage for families who want more moments preserved.', features: ['Multiple events', 'Greater shot coverage', 'Highlights and social edits', 'Crew and turnaround customised'], popular: true },
        { tag: 'COMPLETE EXPERIENCE', title: 'Wedding Platinum', price: 'Custom quote', suffix: '', desc: 'A tailored full-celebration content experience.', features: ['Extended / multi-day coverage', 'Custom reel and highlight mix', 'Additional creators on request', 'Full scope on quotation'], popular: false }
      ],
      'Sports Leagues': [
        { tag: 'SINGLE MATCH', title: 'Match Highlights', price: 'Custom quote', suffix: '', desc: 'Quick-turn social content for pickleball, cricket and other matches.', features: ['Match and player action', 'Key moments and highlights', 'Social reels / clips', 'One-match coverage scoped'], popular: false },
        { tag: 'TOURNAMENT', title: 'League Coverage', price: 'Custom quote', suffix: '', desc: 'Consistent content across league fixtures or tournament days.', features: ['Fixture-wise content plan', 'Matchday highlights', 'Players, sponsors and winners', 'Multi-day / multi-venue quotes'], popular: true },
        { tag: 'SOCIAL ENGAGEMENT', title: 'Player & Team Reels', price: 'Custom quote', suffix: '', desc: 'Short-form player, team and sponsor stories from the event.', features: ['Player-focused content', 'Interviews if requested', 'Vertical social edits', 'Output customised per league'], popular: false }
      ]
    },
    professional: {
      'Brand & Business': [
        { tag: 'CAMPAIGN READY', title: 'Brand Shoot', price: 'Custom quote', suffix: '', desc: 'A high-end camera-led shoot built around your campaign and brand aesthetic.', features: ['Creative brief and shot planning', 'Professional camera setup', 'Crew based on scope', 'Custom editing & grading'], popular: true },
        { tag: 'PRODUCT & COMMERCE', title: 'Product Commercial', price: 'Custom quote', suffix: '', desc: 'Premium imagery and videos to present products with intent.', features: ['Studio / location options', 'Lighting and production design', 'Campaign / commerce formats', 'Editing and deliverables quoted'], popular: false },
        { tag: 'EVENT FILM', title: 'Corporate Film', price: 'Custom quote', suffix: '', desc: 'Professional coverage and narrative edits for corporate milestones.', features: ['Professional camera production', 'Interviews / event coverage', 'Highlight or long-form film', 'Sound and post-production scoped'], popular: false }
      ],
      'Wedding & Luxe': [
        { tag: 'CINEMATIC WEDDING', title: 'Signature Wedding Film', price: 'Custom quote', suffix: '', desc: 'Story-led wedding cinematography with a personalised production plan.', features: ['High-end camera production', 'Cinematic storytelling', 'Multi-event crew options', 'Film length and edits quoted'], popular: true },
        { tag: 'PRE-WEDDING', title: 'Pre-Wedding Film', price: 'Custom quote', suffix: '', desc: 'Concept-based couple films captured with cinematic equipment.', features: ['Creative concept', 'Location and lighting plan', 'Music / edit treatment', 'Deliverables agreed in quote'], popular: false }
      ],
      'Sports & Events': [
        { tag: 'LEAGUE FILM', title: 'Sports Documentary', price: 'Custom quote', suffix: '', desc: 'Professional matchday storytelling, player features and league recaps.', features: ['High-end camera coverage', 'Multi-camera on request', 'Interviews and sponsor stories', 'Narrative post-production'], popular: true },
        { tag: 'LIVE EVENTS', title: 'Event Highlight Film', price: 'Custom quote', suffix: '', desc: 'Premium highlight films for concerts, business events and ceremonies.', features: ['Production crew by scale', 'Professional audio if required', 'Cinematic highlight editing', 'Custom turnaround'], popular: false }
      ]
    }
  };

  /* ---------- Reels (live from Instagram) ----------
   * id        the code in the Instagram link: instagram.com/reel/<id>/
   * kind      'reel' or 'p' (photo post)
   * category  one of the keys in reelCategories
   * chapter   for weddings: the ceremony, used by the wedding constellation
   */
  const reelCategories = {
    latest: 'Latest',
    featured: 'Featured',
    weddings: 'Weddings',
    sports: 'Sports',
    store: 'Store launches',
    brand: 'Model & brand shoots',
    automotive: 'Automotive',
    movies: 'Movie promotions',
    photography: 'Photography',
    celebrations: 'Celebrations',
    realestate: 'Real estate',
    corporate: 'Corporate'
  };

  const reels = [
    { id: 'DeefV69P6ei', kind: 'reel', category: 'featured', title: 'Featured reel', featured: true },
    { id: 'Dc6VVI4JGmp', kind: 'reel', category: 'weddings', chapter: 'Engagement', title: 'Engagement', featured: true },
    { id: 'Dc7pyMAJFdG', kind: 'reel', category: 'weddings', chapter: 'Bride to be', title: 'Bride to be' },
    { id: 'Dc6WiDMpMnn', kind: 'reel', category: 'weddings', chapter: 'Pasupu', title: 'Pasupu' },
    { id: 'DdEelL3pEOE', kind: 'reel', category: 'weddings', chapter: 'Haldi', title: 'Haldi', featured: true },
    { id: 'DVU5kgLid40', kind: 'reel', category: 'weddings', chapter: 'Haldi', title: 'Haldi' },
    { id: 'DdG7Y3rJE0S', kind: 'reel', category: 'weddings', chapter: 'Mehendi', title: 'Mehendi', featured: true },
    { id: 'DdBMfjGpCKf', kind: 'reel', category: 'weddings', chapter: 'Sangeeth', title: 'Sangeeth', featured: true },
    { id: 'Dc-h4-kJ2fp', kind: 'reel', category: 'weddings', chapter: 'Sangeeth', title: 'Sangeeth' },
    { id: 'DdLTdmYJFEd', kind: 'reel', category: 'weddings', chapter: 'Pellikoduku', title: 'Pellikoduku', featured: true },
    { id: 'DaUmKTFylJp', kind: 'reel', category: 'sports', title: 'Sporting event', featured: true },
    { id: 'DetXGpUvQKu', kind: 'reel', category: 'sports', title: 'Sporting event' },
    { id: 'DSCLLhLkyjB', kind: 'reel', category: 'sports', title: 'Sporting event' },
    { id: 'DUznJNIjxK5', kind: 'reel', category: 'store', title: 'Store launch', featured: true },
    { id: 'DUupmqJE8yE', kind: 'reel', category: 'store', title: 'Store launch' },
    { id: 'DWWQ69ykytz', kind: 'reel', category: 'brand', title: 'Model shoot', featured: true },
    { id: 'DUaqGPkk5_a', kind: 'reel', category: 'automotive', title: 'Car shoot', featured: true },
    { id: 'DaXpjSng9n4', kind: 'reel', category: 'movies', title: 'Movie promotion', featured: true },
    { id: 'DerXr-dgfj-', kind: 'p', category: 'photography', title: 'Photography', featured: true }
  ].map((r, i) => ({ order: i + 1, visible: true, featured: false, ...r }));

  // The order the wedding constellation is drawn in.
  const weddingChapters = ['Engagement', 'Bride to be', 'Pasupu', 'Haldi', 'Mehendi', 'Sangeeth', 'Pellikoduku'];

  const jobs = [
    { title: 'Graphic Designer', location: '', type: '', description: 'Role requirements, location and application deadline to be supplied by the hiring team.', active: false },
    { title: 'Content Writer', location: '', type: '', description: 'Role requirements, location and application deadline to be supplied by the hiring team.', active: false },
    { title: 'Video Editor', location: '', type: '', description: 'Role requirements, location and application deadline to be supplied by the hiring team.', active: false },
    { title: 'Marketing Operations', location: '', type: '', description: 'Role requirements, location and application deadline to be supplied by the hiring team.', active: false },
    { title: 'Internship & Trainee', location: '', type: '', description: 'Role requirements, location and application deadline to be supplied by the hiring team.', active: false }
  ];

  const faqs = [
    ['Does sending a request confirm my shoot?', 'No. Your request is reviewed for schedule, crew, location, scope and final pricing.'],
    ['Are Instant prices final?', 'No. Starting-from amounts are indicative; output, editing and logistics are quoted to the brief.'],
    ['Can I choose multiple marketing services?', 'Yes. The Marketing Labs enquiry allows several areas of interest.'],
    ['Can currently employed professionals register as freelancers?', 'Yes, when permitted by their employment terms and subject to clear project-by-project acceptance.']
  ];

  // Films priority defaults; the Sheet's Settings tab overrides these.
  const settings = { superUrgentMaxDays: 2, priorityMaxDays: 5 };

  return { slug, services, labWork, process, challenges, industries, startupStages, projects, occasions, shootIntro, packages, reelCategories, reels, weddingChapters, jobs, faqs, settings };
})();
