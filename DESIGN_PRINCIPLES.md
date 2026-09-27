# neumACt Public Design Principles

**Status:** canonical design reference for the public website  
**Scope:** landing page first; principles should be reused across Research, Innovation, Articles, Team and line-detail pages.  
**Institutional naming:** **Área Sanitaria da Coruña e Cee · INIBIC · SERGAS**. Public-facing copy should not use the narrower hospital acronym as the institutional identity.

## 1. The website is an editorial front door, not an internal directory

The homepage must answer four questions quickly:

1. What is neumACt?
2. How does the group think and work?
3. What is happening now?
4. Why and how would someone engage with it?

Detailed taxonomies belong on their destination pages. The homepage should not repeat the full Research navigation simply because the data exists.

## 2. Clinical questions are the organising idea

The recurring neumACt narrative is:

**Observe → Investigate → Design → Evaluate → Transfer**

Clinical need is the starting point. Research, technology and innovation are methods for answering that need. This logic should inform copy, page sequencing and visual hierarchy.

## 3. Multidisciplinary by design

Public copy should reflect the real mix of profiles without turning the page into an org chart: specialised clinicians, nursing, biomedical researchers, technical profiles, scientists and external collaborators.

Disciplines are described in relation to the clinical question, not as isolated professional silos.

## 4. Public projection, not a second CMS

The public site is the governed public projection of internal research system.

`internal research system → review / approval → public API → neumact.org`

Wherever possible, content that has already been approved for public visibility should populate the public site automatically. The public website must not require parallel manual maintenance of the same facts.

## 5. Backend-driven components must be content-safe

A live component must tolerate:

- long and short titles;
- missing media;
- zero, one or many records;
- slow API responses;
- unavailable API responses;
- bilingual content;
- variable metadata.

Long backend content must never be allowed to destroy page proportions. Clamp, prioritise and progressively reveal rather than letting a title become a full-screen wall.

## 6. Earn the space

Every visible element must answer one of these questions:

- Does it orient the visitor?
- Does it communicate identity or evidence?
- Does it enable a useful action?
- Does it create necessary hierarchy?

If not, remove it.

Avoid decorative rules, duplicated CTAs, generic subtitles, pseudo-badges, unexplained metrics and ornamental UI that has no informational role.

## 7. Premium means restraint

The visual language is **clinical research institute + scientific editorial publication + modern health technology**, not SaaS, startup dashboard or generic hospital website.

Premium quality comes from:

- proportion;
- typography;
- image quality;
- alignment;
- whitespace with purpose;
- disciplined contrast;
- carefully limited interaction.

Do not compensate for weak hierarchy with more decoration.

## 8. Density should feel intentional

Whitespace is valuable only when it improves reading or hierarchy. Avoid full-screen sections when the content can communicate clearly in less space.

On a typical laptop viewport, the user should understand the purpose of a section without repeatedly scrolling just to reach its conclusion.

The homepage should contain more useful information per scroll than a marketing landing page, while still feeling calm.

## 9. Hero images are atmospheric evidence, not wallpaper

Scientific or clinical imagery can establish identity strongly, but it must:

- support text legibility;
- crop intelligently across viewports;
- feel credible rather than sci-fi;
- avoid decorative overlays without purpose;
- remain secondary to the page's message.

The lung hero establishes the visual bar for future imagery.

## 10. Typography carries the prestige

Use the display serif for major editorial statements, not for every title.

Use sans-serif for navigation, body content and operational information. Use mono sparingly for metadata, sequence labels, research codes and institutional microcopy.

Large serif typography must be controlled by content length. Dynamic titles use stricter size and line-clamp rules than authored section headings.

## 11. Navigation is shared infrastructure

The header is a site-wide component, not a homepage component.

- Real neumACt logo only.
- Research label navigates to the Research page.
- Its adjacent chevron opens the research mega-menu.
- Search, EN/ES and Contact are the only utility controls.
- The active state is quiet and precise.
- Shared header visual ownership lives in `styles/components.css`.
- Shared header interaction lives in `scripts/site.js`.

Page CSS must not redefine the header.

## 12. Do not duplicate navigation taxonomy in content

Research lines belong in:

- the Research mega-menu for rapid navigation;
- the Research portfolio page for depth;
- individual line pages for detail.

The homepage should explain the group's research mindset and scientific scope instead of listing the same L01–L06 taxonomy again.

## 13. “Now” should be curated and governed

The homepage activity surface can combine approved:

- publications;
- articles;
- study updates;
- project milestones;
- public scientific events;
- announcements.

The page presents only what deserves current attention. The backend remains the source of truth.

Agenda placeholders must never invent factual dates or events. Until an event is governed from internal research system, placeholders remain clearly non-factual.

## 14. Innovation is a clinical mindset, not a project carousel

Innovation copy should explain *why* innovation belongs in a respiratory clinical environment.

A clinical problem may require a better way to measure, visualise, monitor, transport, decide or work—not only a new treatment.

Homepage innovation should show one strong governed example. Portfolio depth belongs on the Innovation page.

## 15. Collaboration must explain purpose

Institutional affiliation and external collaboration are related but different.

**Our environment:** Área Sanitaria da Coruña e Cee, INIBIC, SERGAS.  
**Our collaborators can include:** technology companies, pharmaceutical industry, universities, research centres and healthcare organisations.

The reason for collaboration should always be explicit: better evidence, better tools and better care for patient cohorts and the public service.

Do not display partner logos merely to fill space. Logos appear only when the relationship is real, public and approved.

## 16. Ask for commitment progressively

Forms should not dominate the page before the visitor has decided to engage.

Homepage contact begins as an editorial invitation and expands the form only after explicit intent. Progressive disclosure reduces visual noise and makes the interaction feel deliberate.

## 17. Footer is orientation, not a dumping ground

The footer should contain only:

- neumACt identity;
- concise institutional context;
- primary navigation;
- a contact path;
- legal links.

Do not use decorative landmarks, floating compliance acronyms, duplicated accreditation claims or oversized empty regions unless they have a clear user-facing purpose.

## 18. Shared chrome should remain shared

Common header and footer decisions should live in shared CSS/JS. Homepage-specific storytelling belongs in `styles/pages/home.css` and homepage markup.

When a page establishes a reusable design pattern, document it here before copying it elsewhere. Reuse the principle and component logic, not accidental page-specific dimensions.

## 19. Responsive design is editorial re-composition

Mobile is not the desktop page squeezed smaller.

At narrower widths:

- reduce simultaneous columns;
- preserve reading order;
- keep primary actions visible;
- simplify secondary metadata;
- maintain minimum touch targets;
- avoid horizontal overflow;
- preserve the hierarchy established on desktop.

## 20. Accessibility is part of the visual system

All interactive elements require keyboard access, focus visibility and meaningful state semantics.

Use native controls where they provide better accessibility. Examples: `<details>/<summary>` for progressive disclosure, real links for navigation, buttons for state changes.

Respect reduced-motion preferences. Never depend on hover alone for essential content.

## 21. Failure states are designed states

A loading, empty or failed API state must never look like a broken blank area.

Every live surface needs a deliberate:

- loading state;
- empty state;
- error state;
- stable fallback layout.

## 22. Page review checklist

Before calling a page finished, ask:

- Is the page explaining something, or merely listing data?
- Are important actions obvious without being loud?
- Has every decorative element earned its place?
- Does the page remain coherent with long backend content?
- Does the section use more height than its information deserves?
- Is any content duplicated elsewhere in navigation?
- Is the institutional naming correct?
- Does the page still work if media or API content is missing?
- Is the mobile reading order intentional?
- Does the page feel like the same neumACt system as the landing page?

## 23. Portfolio pages should orient before they enumerate

A destination page such as Research may contain more data than the homepage, but it should still begin with a clear editorial proposition. The visitor should understand the programme before being asked to scan records.

Research taxonomy belongs on the Research page, but it should be presented as a compact index that points to deeper line pages rather than as six oversized standalone cards.

## 24. A line overview must explain enough to support a choice

The Research overview is a doorway to each line, but it still needs enough editorial substance to help a visitor understand the difference between areas. A concise backend-provided description is therefore first-class content alongside the line title, coordinator when public and useful study metadata.

Capabilities, exhaustive keyword sets, complete track records and deeper evidence belong on the individual line page. Avoid accordions that reproduce the detail page inside the overview.

## 25. Data-heavy sections need progressive disclosure

A public research portfolio should not resemble an internal administration table.

Filters remain available because they are useful, but they should stay visually secondary until requested. The initial view should prioritise readable study titles and the metadata needed to understand them.

Long result sets should show a meaningful first group and progressively reveal the remainder. Do not force the user through a full database dump before they reach the next section.

## 26. Compliance is evidence, not decoration

GCP, regulatory frameworks, accreditation and institutional infrastructure should only appear when they answer a concrete user question or support a documented claim.

Do not use compliance acronyms, regulatory labels, site-initiation claims or accreditation language as decorative hero statistics or footer ornaments.

## 27. One global footer system

The editorial footer established on the landing page is the canonical public footer. Destination pages should reuse its hierarchy and restraint rather than introducing page-specific certification strips, affiliation walls or decorative institutional blocks.

## 28. Context should be concise and relational

Institutional context should explain how the programme is connected to clinical practice and research infrastructure. It should not become a logo wall.

Use concise relational copy and only the institutions that clarify the operating environment: Área Sanitaria da Coruña e Cee, INIBIC and SERGAS.

## 29. Research areas are editorial chapters, not numbered cards

A research area should be understood before it is categorised. The Research overview therefore leads with the title, a concise description, people and live activity. Internal codes may support filtering and data relations, but they are not the visual identity of the public programme.

Avoid repeated numbered tiles, oversized ghost numerals and identical card anatomy when the content deserves a more editorial reading experience.

## 30. Descriptions outrank taxonomy

On a research portfolio page, a useful two- or three-line description is more valuable than another tag, code or keyword list. Backend-provided descriptions should be treated as first-class public content and given stable, content-safe space.

Keywords remain supporting metadata. They should never substitute for an explanation of what the research area actually investigates.

## 31. Public pages never expose internal-platform vocabulary

Visitors should never need to understand the internal software, publishing workflow or operational system used to maintain content. Public copy speaks only about the research programme, current studies, approved activity and collaboration.

Internal architecture belongs in internal documentation, not in public-facing labels, notes, placeholders or error messages.

## 32. Editorial asymmetry can create hierarchy without ranking science

Magazine-level composition may use unequal columns, staggered rhythm, scientific motifs and varied whitespace to avoid a mechanical card grid. This asymmetry is compositional, not evaluative: it must not imply that one research line is more important than another.

Repeated content should share a design grammar without being forced into identical boxes.

## 33. Do not decorate scientific content to make it feel scientific

Scientific authority should come from the research itself: precise copy, real data, approved media, publications, people and evidence. Decorative circles, waveforms, abstract networks or pseudo-diagrams should not be added merely to signal “science”.

If a visual is used, it should be real, attributable and relevant: an approved clinical image, a genuine chart, a documented study figure or another source that has earned its place.

## 34. Interaction labels must state the action

A bare plus sign, chevron or ambiguous expansion control is not enough for important interactions. Progressive-disclosure controls should say what will happen: for example, “Open inquiry form”, “Filter studies” or “Show more studies”.

Icons may reinforce the label but must not carry the meaning alone.

## 35. Vogue-level editorial quality means confidence, not ornament

Borrow the confidence of high-end editorial design: strong typography, disciplined crops, controlled asymmetry, sharp hierarchy and selective moments of surprise. Do not borrow fashion styling literally.

The scientific institution remains the subject. The design should make complex work feel considered, current and worth reading.

## 36. Never publish design commentary as content

Internal design reasoning must never appear as public copy. Sentences such as “the description matters as much as the title” explain a design choice to the team; they do not explain the research to a visitor.

Public copy should answer a visitor question, describe the programme, provide evidence or support an action.

## 37. Literal copy beats campaign copy on institutional pages

Editorial confidence does not require slogans. Research destination pages should prefer durable, descriptive headings such as “Research areas”, “Clinical studies” or “Research collaboration” when a more expressive sentence does not add concrete meaning.

Use memorable language selectively, especially on the landing page. Deeper programme pages should become more precise as the visitor moves closer to the evidence.

## 38. Tightening is a design phase

Once the information architecture is correct, improve quality by removing rather than adding. Review vertical rhythm, repeated metadata, decorative treatment, duplicated keywords and interaction chrome before introducing another visual device.

A premium page should feel edited.

## 39. Use the page width as editorial composition, not empty space

When a content block spans the page, both sides must have a job. Do not place all meaningful content in one narrow column and leave the rest as decorative whitespace. On research-area overviews, use a clear split between scientific narrative and practical orientation such as coordination, current activity and the route to the detail page.

Whitespace remains important, but it should separate ideas rather than compensate for missing composition.

## 40. Titles and explicit CTAs may both lead to detail pages

For editorial overviews, the title can be a conventional text link and the section can also provide an explicit action such as “View research line”. Avoid making the entire large surface clickable: it turns an editorial spread back into a card and makes interaction less predictable.

## 41. Public identity must also be enforced on backend-derived copy

Static HTML checks are not enough when public descriptions come from a shared data source. Legacy acronyms or naming can re-enter the website through live content. The public rendering layer should normalise known legacy institutional naming to the approved public identity before display.

