/**
 * Citation utilities for the legal RAG system.
 *
 * Two distinct citation mechanisms are provided:
 *
 * 1. RAG source citations  — postProcessCitations() / formatMarkdownSourceList()
 *    Converts [Source N] markers to markdown hyperlinks using document URLs
 *    from ChromaDB/web-research metadata.  Deterministic: no LLM URL generation.
 *
 * 2. Legal concept auto-linking — injectLegalConceptLinks()
 *    Scans any generated text for known legal terms (statutes, regulations,
 *    agencies, business structures, etc.) and wraps them in hyperlinks to
 *    authoritative government/legal sources.  Acts as a backstop so every
 *    legal term in EVERY response gets a clickable citation — even when the
 *    text is generated without going through the RAG pipeline.
 */

// ---------------------------------------------------------------------------
// Shared interface
// ---------------------------------------------------------------------------

export interface CitableSource {
  text: string;
  source: string;
  title: string;
  industry: string;
  document_type: string;
  url: string;
  date: string;
  relevance_score: string;
  origin: 'knowledge_base' | 'web_research';
}

// ---------------------------------------------------------------------------
// 1. RAG source citation utilities
// ---------------------------------------------------------------------------

/**
 * Returns the canonical URL for a source document, or null if none is available.
 * Only accepts well-formed HTTP/HTTPS URLs; ignores empty strings and fallbacks.
 */
export function resolveSourceUrl(doc: CitableSource): string | null {
  const u = doc.url?.trim();
  if (u && (u.startsWith('http://') || u.startsWith('https://'))) {
    return u;
  }
  return null;
}

/**
 * Post-processes AI-generated text by replacing [Source N] citation markers
 * with markdown hyperlinks [[Source N]](url) when the referenced source has a URL.
 *
 * Deterministic: uses the sources array index to look up URLs from retrieved
 * document metadata — the AI never generates URLs, so hallucinated links
 * are impossible.
 */
export function postProcessCitations(
  text: string,
  sources: CitableSource[],
): string {
  return text.replace(/\[Source\s+(\d+)\]/gi, (_match, numStr: string) => {
    const n = parseInt(numStr, 10);
    const idx = n - 1;

    if (idx < 0 || idx >= sources.length) return `[Source ${n}]`;

    const doc = sources[idx];
    const url = resolveSourceUrl(doc);

    if (url) {
      const safeTitle = doc.title.replace(/"/g, "'");
      return `[[Source ${n}]](${url} "${safeTitle}")`;
    }

    return `[Source ${n}]`;
  });
}

/**
 * Post-processes AI-generated text by replacing [Source N] citation markers
 * with APA-style inline citations: ([Title](url), Year).
 *
 * Deterministic: URL and date come from DB metadata — the model never generates
 * URLs, so hallucinated links are impossible.
 */
export function postProcessToAPA(
  text: string,
  sources: CitableSource[],
): string {
  return text.replace(/\[Source\s+(\d+)\]/gi, (_match, numStr: string) => {
    const n = parseInt(numStr, 10);
    const idx = n - 1;

    if (idx < 0 || idx >= sources.length) return '';

    const doc = sources[idx];
    const url = resolveSourceUrl(doc);

    // Extract year from date metadata
    let year = '';
    if (doc.date) {
      const parsedYear = new Date(doc.date).getFullYear();
      if (!Number.isNaN(parsedYear) && parsedYear > 1900) {
        year = String(parsedYear);
      }
    }

    // Truncate very long titles for readability
    const title = doc.title.length > 60
      ? `${doc.title.slice(0, 57)}...`
      : doc.title;

    const yearPart = year ? `, ${year}` : '';

    if (url) {
      return `([${title}](${url})${yearPart})`;
    }

    return `(${title}${yearPart})`;
  });
}

/**
 * Formats the complete sources section as rich markdown with hyperlinked titles,
 * metadata, relevance scores, and brief excerpts from the retrieved text.
 */
export function formatMarkdownSourceList(docs: CitableSource[]): string {
  if (docs.length === 0) {
    return '*No sources were retrieved for this query.*';
  }

  return docs
    .map((s, i) => {
      const url = resolveSourceUrl(s);
      const titleLink = url ? `[${s.title}](${url})` : s.title;
      const originLabel =
        s.origin === 'knowledge_base' ? 'Knowledge Base' : 'Web Research';

      const metaParts: string[] = [
        `**Origin:** ${originLabel}`,
        `**Type:** ${s.document_type}`,
        `**Industry:** ${s.industry}`,
      ];
      if (s.date) metaParts.push(`**Date:** ${s.date}`);
      if (s.relevance_score !== 'N/A') {
        metaParts.push(`**Relevance:** ${s.relevance_score}`);
      }

      const lines: string[] = [
        `#### [Source ${i + 1}] ${titleLink}`,
        '',
        metaParts.join(' · '),
      ];

      if (url) lines.push(`**Full document:** <${url}>`);

      const raw = s.text.trim();
      const excerpt = raw.length > 500 ? `${raw.slice(0, 500)}...` : raw;
      if (excerpt) {
        lines.push('', `> ${excerpt.replace(/\n/g, '\n> ')}`);
      }

      return lines.join('\n');
    })
    .join('\n\n---\n\n');
}

// ---------------------------------------------------------------------------
// 2. Legal concept auto-linking
// ---------------------------------------------------------------------------

/**
 * Comprehensive map of legal terms → authoritative source URLs.
 *
 * Organised by category.  Longer / more specific phrases are intentionally
 * listed first (they are sorted by length before regex application so the
 * most specific match wins).
 */
export const LEGAL_CONCEPT_URLS: Record<string, string> = {
  // ── Business Structures ──────────────────────────────────────────────────
  'C-Corporation': 'https://www.irs.gov/businesses/small-businesses-self-employed/c-corporations',
  'C Corporation': 'https://www.irs.gov/businesses/small-businesses-self-employed/c-corporations',
  'C-Corp': 'https://www.irs.gov/businesses/small-businesses-self-employed/c-corporations',
  'S-Corporation': 'https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations',
  'S Corporation': 'https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations',
  'S-Corp': 'https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations',
  'Limited Liability Company': 'https://www.irs.gov/businesses/small-businesses-self-employed/limited-liability-company-llc',
  'sole proprietorship': 'https://www.irs.gov/businesses/small-businesses-self-employed/sole-proprietorships',
  'general partnership': 'https://www.law.cornell.edu/wex/general_partnership',
  'limited partnership': 'https://www.law.cornell.edu/wex/limited_partnership',
  'benefit corporation': 'https://www.law.cornell.edu/wex/benefit_corporation',
  'nonprofit corporation': 'https://www.irs.gov/charities-non-profits',
  'public benefit corporation': 'https://www.law.cornell.edu/wex/benefit_corporation',

  // ── Corporate Law ────────────────────────────────────────────────────────
  'Delaware General Corporation Law': 'https://delcode.delaware.gov/title8/c001/index.html',
  'Model Business Corporation Act': 'https://www.americanbar.org/groups/business_law/resources/business_law_deskbook/model-business-corporation-act/',
  'fiduciary duty': 'https://www.law.cornell.edu/wex/fiduciary_duty',
  'duty of care': 'https://www.law.cornell.edu/wex/duty_of_care',
  'duty of loyalty': 'https://www.law.cornell.edu/wex/duty_of_loyalty',
  'business judgment rule': 'https://www.law.cornell.edu/wex/business_judgment_rule',
  'piercing the corporate veil': 'https://www.law.cornell.edu/wex/piercing_the_corporate_veil',
  'articles of incorporation': 'https://www.law.cornell.edu/wex/articles_of_incorporation',
  'operating agreement': 'https://www.law.cornell.edu/wex/operating_agreement',
  'shareholder agreement': 'https://www.law.cornell.edu/wex/shareholder_agreement',
  'bylaws': 'https://www.law.cornell.edu/wex/bylaws',
  'DGCL': 'https://delcode.delaware.gov/title8/c001/index.html',

  // ── Tax Law ──────────────────────────────────────────────────────────────
  'double taxation': 'https://www.irs.gov/businesses/small-businesses-self-employed/c-corporations',
  'pass-through taxation': 'https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations',
  'pass-through entity': 'https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations',
  'self-employment tax': 'https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes',
  'qualified business income': 'https://www.irs.gov/newsroom/tax-cuts-and-jobs-act-provision-11011-section-199a-qualified-business-income-deduction-faqs',
  'Section 199A': 'https://www.irs.gov/newsroom/tax-cuts-and-jobs-act-provision-11011-section-199a-qualified-business-income-deduction-faqs',
  'Section 1202': 'https://www.irs.gov/pub/irs-drop/n-23-02.pdf',
  'QSBS': 'https://www.irs.gov/pub/irs-drop/n-23-02.pdf',
  'Section 83(b)': 'https://www.irs.gov/pub/irs-pdf/f83b.pdf',
  'Form 1120': 'https://www.irs.gov/forms-pubs/about-form-1120',
  'Form 1120-S': 'https://www.irs.gov/forms-pubs/about-form-1120-s',
  'Form 1065': 'https://www.irs.gov/forms-pubs/about-form-1065',
  'Schedule K-1': 'https://www.irs.gov/forms-pubs/about-schedule-k-1-form-1065',
  'Schedule C': 'https://www.irs.gov/forms-pubs/about-schedule-c-form-1040',
  'Internal Revenue Code': 'https://www.irs.gov/tax-professionals/tax-code-regulations-and-official-guidance',
  'IRC': 'https://www.irs.gov/tax-professionals/tax-code-regulations-and-official-guidance',
  '501(c)(3)': 'https://www.irs.gov/charities-non-profits/charitable-organizations/exemption-requirements-501c3-organizations',
  '501(c)': 'https://www.irs.gov/charities-non-profits/charitable-organizations',

  // ── Healthcare & Privacy ─────────────────────────────────────────────────
  'Health Insurance Portability and Accountability Act': 'https://www.hhs.gov/hipaa/index.html',
  'Health Information Technology for Economic and Clinical Health Act': 'https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html',
  'protected health information': 'https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html',
  'covered entity': 'https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html',
  'business associate': 'https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html',
  'breach notification': 'https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html',
  'Notice of Privacy Practices': 'https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/privacy-practices-for-protected-health-information/index.html',
  'minimum necessary standard': 'https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/minimum-necessary-requirement/index.html',
  'HIPAA Privacy Rule': 'https://www.hhs.gov/hipaa/for-professionals/privacy/index.html',
  'HIPAA Security Rule': 'https://www.hhs.gov/hipaa/for-professionals/security/index.html',
  'HIPAA Breach Notification Rule': 'https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html',
  'HITECH Act': 'https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html',
  'HIPAA': 'https://www.hhs.gov/hipaa/index.html',
  'HITECH': 'https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html',
  'PHI': 'https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html',

  // ── Data Privacy ─────────────────────────────────────────────────────────
  'General Data Protection Regulation': 'https://gdpr.eu/',
  'California Consumer Privacy Act': 'https://oag.ca.gov/privacy/ccpa',
  'California Privacy Rights Act': 'https://cppa.ca.gov/regulations/consumer_privacy_act.html',
  "Children's Online Privacy Protection Act": 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa',
  'Family Educational Rights and Privacy Act': 'https://www.ed.gov/ferpa',
  'Gramm-Leach-Bliley Act': 'https://www.ftc.gov/legal-library/browse/statutes/gramm-leach-bliley-act',
  'Electronic Communications Privacy Act': 'https://www.justice.gov/jm/criminal-resource-manual-1038-electronic-communications-privacy-act-1986',
  'Video Privacy Protection Act': 'https://www.law.cornell.edu/uscode/text/18/2710',
  'Illinois Biometric Information Privacy Act': 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57',
  'GDPR': 'https://gdpr.eu/',
  'CCPA': 'https://oag.ca.gov/privacy/ccpa',
  'CPRA': 'https://cppa.ca.gov/regulations/consumer_privacy_act.html',
  'COPPA': 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa',
  'FERPA': 'https://www.ed.gov/ferpa',
  'GLBA': 'https://www.ftc.gov/legal-library/browse/statutes/gramm-leach-bliley-act',
  'ECPA': 'https://www.justice.gov/jm/criminal-resource-manual-1038-electronic-communications-privacy-act-1986',
  'VPPA': 'https://www.law.cornell.edu/uscode/text/18/2710',
  'BIPA': 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57',
  'data breach': 'https://www.ftc.gov/business-guidance/resources/data-breach-response-guide-business',
  'right to erasure': 'https://gdpr.eu/right-to-be-forgotten/',
  'right to be forgotten': 'https://gdpr.eu/right-to-be-forgotten/',
  'data protection officer': 'https://gdpr.eu/data-protection-officer/',
  'DPO': 'https://gdpr.eu/data-protection-officer/',
  'privacy by design': 'https://www.ftc.gov/system/files/documents/reports/federal-trade-commission-report-protecting-consumer-privacy-era-rapid-change-recommendations/120326privacyreport.pdf',

  // ── Financial & Securities ────────────────────────────────────────────────
  'Securities Act of 1933': 'https://www.sec.gov/acts/sa33.pdf',
  'Securities Exchange Act of 1934': 'https://www.sec.gov/acts/sea34.pdf',
  'Investment Company Act of 1940': 'https://www.sec.gov/about/laws/ica40.pdf',
  'Investment Advisers Act of 1940': 'https://www.sec.gov/about/laws/iaa40.pdf',
  'Dodd-Frank Wall Street Reform and Consumer Protection Act': 'https://www.cftc.gov/LawRegulation/DoddFrankAct/index.htm',
  'Sarbanes-Oxley Act': 'https://www.sec.gov/spotlight/sarbanes-oxley.htm',
  'Bank Secrecy Act': 'https://www.fincen.gov/resources/statutes-regulations/bank-secrecy-act',
  'Fair Credit Reporting Act': 'https://www.ftc.gov/legal-library/browse/statutes/fair-credit-reporting-act',
  'Fair Debt Collection Practices Act': 'https://www.ftc.gov/legal-library/browse/statutes/fair-debt-collection-practices-act',
  'Equal Credit Opportunity Act': 'https://www.consumerfinance.gov/compliance/compliance-resources/other-applicable-requirements/equal-credit-opportunity-act/',
  'Truth in Lending Act': 'https://www.consumerfinance.gov/rules-policy/regulations/1026/',
  'Uniform Commercial Code': 'https://www.law.cornell.edu/ucc',
  'Dodd-Frank': 'https://www.cftc.gov/LawRegulation/DoddFrankAct/index.htm',
  'Sarbanes-Oxley': 'https://www.sec.gov/spotlight/sarbanes-oxley.htm',
  'SOX': 'https://www.sec.gov/spotlight/sarbanes-oxley.htm',
  'BSA': 'https://www.fincen.gov/resources/statutes-regulations/bank-secrecy-act',
  'AML': 'https://www.fincen.gov/resources/statutes-and-regulations',
  'KYC': 'https://www.fincen.gov/resources/statutes-regulations',
  'FCRA': 'https://www.ftc.gov/legal-library/browse/statutes/fair-credit-reporting-act',
  'FDCPA': 'https://www.ftc.gov/legal-library/browse/statutes/fair-debt-collection-practices-act',
  'TILA': 'https://www.consumerfinance.gov/rules-policy/regulations/1026/',
  'UCC': 'https://www.law.cornell.edu/ucc',
  'SEC': 'https://www.sec.gov/',
  'CFTC': 'https://www.cftc.gov/',
  'FinCEN': 'https://www.fincen.gov/',
  'FINRA': 'https://www.finra.org/',
  'accredited investor': 'https://www.sec.gov/resources-for-investors/investor-alerts-bulletins/ib_accreditedinvestors',
  'Regulation D': 'https://www.sec.gov/education/smallbusiness/exemptofferings/regd',
  'Regulation A': 'https://www.sec.gov/education/smallbusiness/exemptofferings/rega',
  'Regulation CF': 'https://www.sec.gov/education/smallbusiness/exemptofferings/regcrowdfunding',
  'Rule 144': 'https://www.sec.gov/resources-for-investors/investor-alerts-bulletins/investoralertsia_rule144',
  'Rule 10b-5': 'https://www.law.cornell.edu/cfr/text/17/240.10b-5',

  // ── Employment Law ────────────────────────────────────────────────────────
  'Fair Labor Standards Act': 'https://www.dol.gov/agencies/whd/flsa',
  'Family and Medical Leave Act': 'https://www.dol.gov/agencies/whd/fmla',
  'Americans with Disabilities Act': 'https://www.ada.gov/',
  'Age Discrimination in Employment Act': 'https://www.eeoc.gov/statutes/age-discrimination-employment-act-1967',
  'National Labor Relations Act': 'https://www.nlrb.gov/guidance/key-reference-materials/national-labor-relations-act',
  'Worker Adjustment and Retraining Notification Act': 'https://www.dol.gov/agencies/eta/layoffs/warn',
  'Employee Retirement Income Security Act': 'https://www.dol.gov/general/topic/retirement/erisa',
  'Title VII of the Civil Rights Act': 'https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964',
  'Equal Pay Act': 'https://www.eeoc.gov/statutes/equal-pay-act-1963',
  'Immigration Reform and Control Act': 'https://www.uscis.gov/i-9-central/form-i-9-resources/handbook-for-employers-m-274/10-irca-and-other-anti-discrimination-provisions',
  'FLSA': 'https://www.dol.gov/agencies/whd/flsa',
  'FMLA': 'https://www.dol.gov/agencies/whd/fmla',
  'ADA': 'https://www.ada.gov/',
  'ADEA': 'https://www.eeoc.gov/statutes/age-discrimination-employment-act-1967',
  'NLRA': 'https://www.nlrb.gov/guidance/key-reference-materials/national-labor-relations-act',
  'WARN Act': 'https://www.dol.gov/agencies/eta/layoffs/warn',
  'ERISA': 'https://www.dol.gov/general/topic/retirement/erisa',
  'Title VII': 'https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964',
  'EEOC': 'https://www.eeoc.gov/',
  'OSHA': 'https://www.osha.gov/',
  'NLRB': 'https://www.nlrb.gov/',
  'DOL': 'https://www.dol.gov/',
  'at-will employment': 'https://www.dol.gov/general/topic/termination',
  'non-compete agreement': 'https://www.ftc.gov/legal-library/browse/rules/non-compete-clause-rule',
  'non-disclosure agreement': 'https://www.law.cornell.edu/wex/nondisclosure_agreement',
  'independent contractor': 'https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee',
  'employee classification': 'https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee',
  'Form I-9': 'https://www.uscis.gov/i-9',
  'W-2': 'https://www.irs.gov/forms-pubs/about-form-w-2',
  '1099': 'https://www.irs.gov/forms-pubs/about-form-1099',

  // ── Consumer Protection & Advertising ────────────────────────────────────
  'Federal Trade Commission Act': 'https://www.ftc.gov/legal-library/browse/statutes/federal-trade-commission-act',
  'Magnuson-Moss Warranty Act': 'https://www.ftc.gov/legal-library/browse/statutes/magnuson-moss-warranty-federal-trade-commission-improvements-act',
  'Telephone Consumer Protection Act': 'https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts',
  'CAN-SPAM Act': 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business',
  'FTC Act': 'https://www.ftc.gov/legal-library/browse/statutes/federal-trade-commission-act',
  'FTC': 'https://www.ftc.gov/',
  'TCPA': 'https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts',
  'CAN-SPAM': 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business',
  'deceptive advertising': 'https://www.ftc.gov/business-guidance/advertising-marketing',
  'unfair business practices': 'https://www.ftc.gov/business-guidance/advertising-marketing',
  'endorsement guidelines': 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',

  // ── Intellectual Property ─────────────────────────────────────────────────
  'Digital Millennium Copyright Act': 'https://www.copyright.gov/dmca/',
  'Defend Trade Secrets Act': 'https://www.justice.gov/archives/jm/criminal-resource-manual-1090-trade-secret-protection',
  'Lanham Act': 'https://www.uspto.gov/ip-policy/trademark-policy',
  'Bayh-Dole Act': 'https://www.nist.gov/tpo/bayh-dole-act-and-related-executive-order',
  'DMCA': 'https://www.copyright.gov/dmca/',
  'DTSA': 'https://www.justice.gov/archives/jm/criminal-resource-manual-1090-trade-secret-protection',
  'copyright infringement': 'https://www.copyright.gov/help/faq/faq-infringement.html',
  'fair use': 'https://www.copyright.gov/fair-use/',
  'patent application': 'https://www.uspto.gov/patents/apply',
  'trademark registration': 'https://www.uspto.gov/trademarks/apply',
  'trade secret': 'https://www.wipo.int/tradesecrets/en/',
  'USPTO': 'https://www.uspto.gov/',

  // ── Real Estate ───────────────────────────────────────────────────────────
  'Real Estate Settlement Procedures Act': 'https://www.consumerfinance.gov/rules-policy/regulations/1024/',
  'Fair Housing Act': 'https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview',
  'Home Mortgage Disclosure Act': 'https://www.consumerfinance.gov/data-research/hmda/',
  'RESPA': 'https://www.consumerfinance.gov/rules-policy/regulations/1024/',
  'HMDA': 'https://www.consumerfinance.gov/data-research/hmda/',
  'HUD': 'https://www.hud.gov/',
  'CFPB': 'https://www.consumerfinance.gov/',

  // ── Food, Drug & Healthcare Regulation ───────────────────────────────────
  'Federal Food, Drug, and Cosmetic Act': 'https://www.fda.gov/regulatory-information/laws-enforced-by-fda/federal-food-drug-and-cosmetic-act-fdc-act',
  'Affordable Care Act': 'https://www.healthcare.gov/glossary/affordable-care-act/',
  'FD&C Act': 'https://www.fda.gov/regulatory-information/laws-enforced-by-fda/federal-food-drug-and-cosmetic-act-fdc-act',
  'ACA': 'https://www.healthcare.gov/glossary/affordable-care-act/',
  'FDA': 'https://www.fda.gov/',
  'CMS': 'https://www.cms.gov/',
  'DEA': 'https://www.dea.gov/',
  'premarket approval': 'https://www.fda.gov/medical-devices/premarket-submissions-selecting-and-preparing-correct-submission/premarket-approval-pma',
  '510(k)': 'https://www.fda.gov/medical-devices/premarket-submissions-selecting-and-preparing-correct-submission/premarket-notification-510k',

  // ── Aviation & Transportation ─────────────────────────────────────────────
  'Federal Aviation Act': 'https://www.faa.gov/regulations_policies',
  'FAA': 'https://www.faa.gov/',
  'DOT': 'https://www.transportation.gov/',
  'TSA': 'https://www.tsa.gov/',

  // ── Antitrust ─────────────────────────────────────────────────────────────
  'Sherman Antitrust Act': 'https://www.law.cornell.edu/uscode/text/15/1',
  'Clayton Act': 'https://www.law.cornell.edu/uscode/text/15/12',
  'Hart-Scott-Rodino Act': 'https://www.ftc.gov/enforcement/premerger-notification-program',
  'HSR Act': 'https://www.ftc.gov/enforcement/premerger-notification-program',
  'antitrust': 'https://www.justice.gov/atr',
  'price-fixing': 'https://www.justice.gov/atr/price-fixing-bid-rigging-and-market-allocation-schemes',
  'monopolization': 'https://www.law.cornell.edu/uscode/text/15/2',

  // ── Contracts ────────────────────────────────────────────────────────────
  'Uniform Electronic Transactions Act': 'https://www.uniformlaws.org/committees/community-home?CommunityKey=2c04b76c-2b7d-4399-977e-d5876ba7e034',
  'Electronic Signatures in Global and National Commerce Act': 'https://www.ftc.gov/business-guidance/resources/electronic-signatures-global-national-commerce-act',
  'UETA': 'https://www.uniformlaws.org/committees/community-home?CommunityKey=2c04b76c-2b7d-4399-977e-d5876ba7e034',
  'E-SIGN Act': 'https://www.ftc.gov/business-guidance/resources/electronic-signatures-global-national-commerce-act',
  'force majeure': 'https://www.law.cornell.edu/wex/force_majeure',
  'indemnification': 'https://www.law.cornell.edu/wex/indemnification',
  'liquidated damages': 'https://www.law.cornell.edu/wex/liquidated_damages',
  'statute of limitations': 'https://www.law.cornell.edu/wex/statute_of_limitations',
  'choice of law': 'https://www.law.cornell.edu/wex/choice_of_law',
  'arbitration': 'https://www.adr.org/',
  'Federal Arbitration Act': 'https://www.law.cornell.edu/uscode/text/9',

  // ── CFR Titles ────────────────────────────────────────────────────────────
  '45 CFR Part 164': 'https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164',
  '45 CFR Part 160': 'https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-160',
  '45 CFR': 'https://www.ecfr.gov/current/title-45',
  '21 CFR': 'https://www.ecfr.gov/current/title-21',
  '16 CFR': 'https://www.ecfr.gov/current/title-16',
  '47 CFR': 'https://www.ecfr.gov/current/title-47',
  '34 CFR': 'https://www.ecfr.gov/current/title-34',
  '12 CFR': 'https://www.ecfr.gov/current/title-12',
  '24 CFR': 'https://www.ecfr.gov/current/title-24',
  '29 CFR': 'https://www.ecfr.gov/current/title-29',
  '14 CFR': 'https://www.ecfr.gov/current/title-14',
  '31 CFR': 'https://www.ecfr.gov/current/title-31',

  // ── Key Agencies (standalone) ────────────────────────────────────────────
  'IRS': 'https://www.irs.gov/',
  'HHS': 'https://www.hhs.gov/',
  'FCC': 'https://www.fcc.gov/',
  'NIST': 'https://www.nist.gov/',
  'DOJ': 'https://www.justice.gov/',
  'SBA': 'https://www.sba.gov/',
};

/**
 * Scans generated text for known legal terms and wraps unlinked occurrences
 * in markdown hyperlinks pointing to authoritative sources.
 *
 * Rules:
 * - Longer/more-specific phrases are matched before shorter ones (e.g.
 *   "Fair Labor Standards Act" before "FLSA") to avoid partial matches.
 * - Terms already inside a markdown link `[text](url)` are skipped.
 * - Code blocks (``` ... ```) and inline code (` ... `) are never modified.
 * - Each unique term is linked once per paragraph to avoid visual clutter
 *   (matches the Wikipedia / Anthropic docs convention).
 *
 * @param text Raw markdown text to process.
 * @returns    Markdown text with legal terms converted to hyperlinks.
 */
export function injectLegalConceptLinks(text: string): string {
  // Preserve code blocks so we never alter code samples
  const codeBlocks: string[] = [];
  let processed = text.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
    codeBlocks.push(match);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  // Sort entries: longest phrase first so specific matches win over short ones
  const entries = Object.entries(LEGAL_CONCEPT_URLS).sort(
    ([a], [b]) => b.length - a.length,
  );

  // Track which terms have already been linked so we link each term only once
  // per paragraph block (split on blank lines)
  const paragraphs = processed.split(/\n\n+/);
  const linkedParagraphs = paragraphs.map((para) => {
    const linked = new Set<string>();

    for (const [term, url] of entries) {
      // Skip if already linked (term key already processed for this paragraph)
      if (linked.has(term.toLowerCase())) continue;

      // Escape special regex characters in the term string
      const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Match term:
      //  - At a word boundary (\b) — prevents partial matches inside other words
      //  - NOT preceded by [ (already inside a markdown link label)
      //  - NOT followed by ] (already inside a markdown link label)
      //  - NOT preceded by ](  (already the URL portion of a link)
      const regex = new RegExp(`(?<!\\[)(?<!\\]\\()\\b(${esc})\\b(?!\\])`, 'i');

      if (regex.test(para)) {
        // Replace only the FIRST occurrence in this paragraph (link-once convention)
        para = para.replace(regex, (match) => `[${match}](${url})`);
        linked.add(term.toLowerCase());
      }
    }

    return para;
  });

  processed = linkedParagraphs.join('\n\n');

  // Restore code blocks
  processed = processed.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[Number(i)]);

  return processed;
}
