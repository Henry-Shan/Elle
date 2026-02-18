import 'dotenv/config';
import { getOrCreateCollection, LEGAL_COLLECTION } from '../lib/rag/chroma';
import { embedTexts } from '../lib/rag/embeddings';
import { chunkText } from '../lib/rag/chunker';

// ---------------------------------------------------------------------------
// Curated foundational legal concepts — answers the questions users actually ask
// Covers: entity formation, contracts, IP, employment, privacy, startup law
// ---------------------------------------------------------------------------

interface LegalDocument {
  id: string;
  title: string;
  industry: string;
  document_type: string;
  jurisdiction: string;
  url: string;
  date: string;
  content: string;
}

const LEGAL_CONCEPTS: LegalDocument[] = [
  // ── BUSINESS ENTITY TYPES ──────────────────────────────────────────────────
  {
    id: 'entity-types-overview',
    title: 'Business Entity Types: C-Corp, LLC, S-Corp, Sole Proprietor, Partnership',
    industry: 'general',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.sba.gov/business-guide/launch-your-business/choose-business-structure',
    date: '2024-01-01',
    content: `
## Business Entity Types: A Comprehensive Comparison

Choosing the right business entity is one of the most important legal decisions an entrepreneur makes. Each entity type has distinct implications for taxes, liability, fundraising, and management.

### C-Corporation (C-Corp)

A C-Corporation is a separate legal entity owned by shareholders. It is the default corporate form recognized under state law and is the preferred structure for venture-backed startups.

**Key characteristics:**
- Separate legal entity from its owners (shareholders)
- Limited liability for shareholders — personal assets are protected from business debts
- Unlimited number of shareholders, including foreign nationals and institutional investors
- Can issue multiple classes of stock (common, preferred, Series A, B, etc.)
- Subject to "double taxation": the corporation pays corporate income tax on profits, and shareholders pay personal income tax on dividends received
- The Tax Cuts and Jobs Act of 2017 set the federal corporate tax rate at 21%
- Can elect S-Corp status with the IRS if it meets eligibility requirements
- Required to hold annual shareholder and board meetings, maintain minutes, and file annual reports
- Delaware is the most common state of incorporation for C-Corps due to well-developed corporate law, the Court of Chancery, and investor familiarity

**Best for:** Startups seeking venture capital or angel investment, companies planning to go public (IPO), businesses with employees who receive stock options (ISOs), and companies expecting to reinvest profits rather than distribute them.

**Disadvantages:** More administrative overhead, double taxation of dividends, cannot use business losses to offset personal income.

### Limited Liability Company (LLC)

An LLC combines the liability protection of a corporation with the tax flexibility of a partnership. It is governed by an Operating Agreement rather than corporate bylaws.

**Key characteristics:**
- Members (owners) have limited liability — personal assets are protected
- Pass-through taxation by default: profits and losses flow through to members' personal tax returns, avoiding double taxation
- Can be taxed as a sole proprietorship (single-member), partnership (multi-member), S-Corp, or C-Corp by making elections with the IRS
- Flexible management structure: can be member-managed or manager-managed
- Operating Agreement governs the LLC — this document controls profit/loss allocation, voting rights, and transfer of membership interests
- No restrictions on number or type of members (unlike S-Corps)
- Members pay self-employment taxes (15.3%) on their share of profits unless they elect S-Corp taxation

**Best for:** Small businesses, professional services firms, real estate investors, businesses owned by non-US persons, and businesses that want flexible profit allocation without strict corporate formalities.

**Disadvantages:** Not ideal for venture capital funding (VCs strongly prefer C-Corps), complex profit/loss allocation in multi-member LLCs, potential self-employment tax burden.

### C-Corp vs LLC: Direct Comparison

| Feature | C-Corp | LLC |
|---------|--------|-----|
| Liability protection | Yes | Yes |
| Taxation | Double tax (corporate + personal) | Pass-through (default) |
| VC fundraising | Preferred | Difficult |
| Stock options (ISOs) | Yes | No |
| Foreign owners | Yes | Yes |
| S-Corp election | Yes (if eligible) | Yes |
| Formalities | High | Low |
| Going public (IPO) | Yes | Must convert first |

**The bottom line on C-Corp vs LLC:** If you plan to raise venture capital, hire employees with stock options, or eventually go public, choose a C-Corp (Delaware). If you are a small business, professional services firm, or real estate investor who wants tax flexibility and minimal formalities, choose an LLC.

### S-Corporation (S-Corp)

An S-Corp is a corporation that has elected special tax status with the IRS under Subchapter S of the Internal Revenue Code. It is not a separate entity type — it is a C-Corp or LLC that has made an IRS election.

**Key characteristics:**
- Pass-through taxation: income, losses, deductions, and credits flow through to shareholders' personal tax returns
- Avoids double taxation of C-Corps
- Shareholders who work in the business must receive "reasonable compensation" (salary), which is subject to payroll taxes; remaining profits distributed as dividends avoid self-employment tax
- Strict IRS eligibility requirements: maximum 100 shareholders, all shareholders must be US citizens or permanent residents, only one class of stock, no partnerships or corporations as shareholders
- S-Corps cannot have venture capital investors (funds are typically LLCs or partnerships)

**Best for:** Profitable small businesses where owners want to reduce self-employment taxes by splitting income between salary and distributions.

### Sole Proprietorship

The simplest and most common business structure. A sole proprietorship is not a separate legal entity — the business and the owner are the same person.

**Key characteristics:**
- No registration required (a DBA/trade name may be filed)
- Complete control by the owner
- All profits taxed as personal income on Schedule C
- No liability protection — the owner is personally liable for all business debts and legal claims
- Cannot bring in partners or investors without changing entity type
- Business ceases to exist when the owner stops operating it

**Best for:** Freelancers, independent contractors, and very small businesses testing a concept before formalizing.

### General Partnership

A partnership is formed when two or more people carry on a business for profit together. Like a sole proprietorship, it offers no liability protection by default.

**Key characteristics:**
- No formal registration required (but a Partnership Agreement is strongly recommended)
- Pass-through taxation
- Each partner is personally liable for the debts and obligations of the partnership, including acts of other partners
- Limited Partnership (LP) and Limited Liability Partnership (LLP) offer partial liability protection

**Best for:** Professional services firms (law, accounting, medicine) using LLP structure.

### Delaware vs. Other States for Incorporation

Delaware is the most popular state for incorporating C-Corps and forming LLCs for the following reasons:
- The Delaware Court of Chancery is a specialized business court with deep expertise in corporate law
- Delaware General Corporation Law (DGCL) is well-established and predictable
- No state corporate income tax for companies incorporated in Delaware but not doing business there
- Most venture capital term sheets require Delaware incorporation
- Most law firms and investors are familiar with Delaware documents

If your business is small and local, incorporating in your home state may be simpler and cheaper (avoiding the need to register as a "foreign entity" in your home state).
    `,
  },

  // ── EQUITY & STARTUP FINANCING ─────────────────────────────────────────────
  {
    id: 'startup-equity-basics',
    title: 'Startup Equity: Stock Options, Vesting, Cap Tables, Term Sheets',
    industry: 'saas',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising',
    date: '2024-01-01',
    content: `
## Startup Equity Fundamentals

### Equity Basics

Equity represents ownership in a company. In a C-Corp, equity is represented by shares of stock. The capitalization table (cap table) tracks who owns what percentage of the company.

**Common Stock:** Issued to founders and employees. Has voting rights. In a liquidation, common stockholders are paid after preferred stockholders.

**Preferred Stock:** Issued to investors in venture capital rounds. Has preferences over common stock in liquidations (liquidation preference), dividends (if any), and sometimes conversion rights and anti-dilution protection.

**Authorized vs. Issued Shares:** The certificate of incorporation authorizes a maximum number of shares. The company then issues some of those shares. Typical startup: authorize 10,000,000 shares, issue 8,000,000 to founders.

### Founder Equity and Vesting

Vesting is the process by which founders and employees earn their equity over time. If a co-founder leaves early, vesting ensures they don't keep unvested shares.

**Standard 4-year vesting with 1-year cliff:**
- The 1-year cliff means zero shares vest until the founder/employee has been with the company for one year
- After the cliff, 25% vests at the one-year mark
- The remaining 75% vests monthly over the following 36 months (1/48 per month)
- If a founder leaves at month 11, they receive no shares (the cliff protects the company)
- If a founder leaves at month 18, they receive 37.5% of their grant (12 months + 6 months = 18/48)

**83(b) Election:** When founders receive stock subject to vesting restrictions, they can file an 83(b) election with the IRS within 30 days of receiving the stock. This election causes the founder to recognize income (usually zero, since founders receive stock at fair market value at founding) at grant date rather than as the stock vests. This starts the capital gains holding period immediately. Missing the 30-day window is an unrecoverable mistake.

### Stock Options

Stock options give employees the right to purchase shares at a predetermined price (the "exercise price" or "strike price") in the future.

**Incentive Stock Options (ISOs):**
- Only available to employees (not contractors or advisors)
- Tax-advantaged: no ordinary income tax at exercise (though AMT may apply)
- Long-term capital gains rates apply if shares are held for 2 years from grant and 1 year from exercise
- Maximum $100,000 in ISOs can become exercisable in any calendar year; excess is treated as NSOs

**Non-Qualified Stock Options (NSOs/NQSOs):**
- Can be granted to anyone (employees, contractors, advisors, board members)
- At exercise, the spread (fair market value minus exercise price) is ordinary income
- Employer must withhold income and payroll taxes

**Option Pool / Employee Stock Option Plan (ESOP):** A reserved portion of the company's equity for employee grants, typically 10-20% of fully-diluted shares. VCs often require that an option pool be established (and often expanded) before investment, which dilutes founders before the investment closes.

**409A Valuation:** Before issuing stock options, a company must obtain an independent appraisal (409A valuation) to set the exercise price at fair market value of the common stock. Options granted below fair market value result in a 20% penalty tax plus interest under IRS Section 409A.

### Venture Capital Financing

**SAFE (Simple Agreement for Future Equity):** A SAFE is not debt — it is an agreement to issue equity at a future priced round. Created by Y Combinator in 2013. SAFEs typically include a valuation cap and/or discount rate.

**Convertible Note:** A loan that converts to equity at a future financing round. Unlike a SAFE, it has an interest rate, maturity date, and is technically debt.

**Priced Equity Round (Series A, B, etc.):** A priced round establishes a pre-money valuation, issues preferred stock, and is governed by a Term Sheet and then definitive documents (Stock Purchase Agreement, Investors' Rights Agreement, Right of First Refusal and Co-Sale Agreement, Voting Agreement).

**Key Term Sheet Terms:**
- Pre-money valuation: Company value before new investment
- Post-money valuation: Pre-money + new investment amount
- Liquidation preference: 1x non-participating is standard; participating preferred gives investors their money back AND a share of remaining proceeds
- Pro-rata rights: The right of existing investors to participate in future rounds to maintain ownership percentage
- Board composition: VCs often require a board seat
- Anti-dilution protection: Broad-based weighted average is standard; full ratchet is founder-unfriendly
    `,
  },

  // ── CONTRACTS ──────────────────────────────────────────────────────────────
  {
    id: 'contracts-fundamentals',
    title: 'Contract Law Fundamentals: NDAs, Service Agreements, Terms of Service',
    industry: 'general',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.law.cornell.edu/wex/contract',
    date: '2024-01-01',
    content: `
## Contract Law Fundamentals

### Elements of a Valid Contract

For a contract to be legally enforceable under US law, it must have:

1. **Offer:** One party proposes terms
2. **Acceptance:** The other party agrees to those exact terms (mirror image rule)
3. **Consideration:** Each party gives something of value (money, services, a promise to act or refrain)
4. **Capacity:** Both parties must have legal capacity (be adults, not be mentally incapacitated)
5. **Legality:** The contract's purpose must be legal

### Non-Disclosure Agreement (NDA) / Confidentiality Agreement

An NDA protects confidential information shared between parties.

**Key provisions:**
- **Definition of confidential information:** Should be broad enough to cover all relevant information but not so broad as to be unenforceable
- **Exceptions:** Information that is already public, independently developed, received from a third party, or required to be disclosed by law
- **Term:** How long the obligation of confidentiality lasts (typically 2-5 years; trade secrets may be indefinite)
- **Mutual vs. one-way:** A mutual NDA protects both parties; a one-way NDA only protects the disclosing party
- **Remedies:** NDAs typically include provisions for injunctive relief (a court order to stop disclosure) because monetary damages may be inadequate

**When to use:** Before discussing a business idea with a potential partner, investor, or employee. Note: Most VCs will NOT sign NDAs for initial pitch meetings.

### Service Agreement / Consulting Agreement

Governs the relationship between a company and an independent contractor or service provider.

**Key provisions:**
- Scope of work and deliverables
- Payment terms (hourly, project-based, milestone-based)
- **Intellectual property assignment:** Critical — must explicitly state that all work product created by the contractor is owned by the company (work-for-hire doctrine does not automatically apply to independent contractors for all categories of work)
- Independent contractor status (vs. employee) — misclassifying employees as contractors has serious tax and legal consequences
- Confidentiality obligations
- Non-solicitation of employees or clients (note: non-competes for contractors are increasingly restricted)
- Term and termination

### Terms of Service (ToS) / Terms and Conditions

The legal agreement between a company and its users governing use of a website, app, or platform.

**Key provisions:**
- Acceptable use policy
- Intellectual property ownership (the company owns the platform; users retain their data)
- Limitation of liability and disclaimer of warranties
- Dispute resolution (arbitration clause, class action waiver)
- Governing law and jurisdiction
- Changes to terms

**Clickwrap vs. Browsewrap:** Clickwrap agreements (user must actively click "I agree") are more enforceable than browsewrap agreements (user is deemed to agree by using the site without explicit acceptance).

### Employment Agreement vs. Offer Letter

Most US employees are at-will and do not have formal employment contracts — they receive an offer letter. Executives and key employees may have employment agreements with:
- Fixed term or termination protections
- Severance provisions
- Non-compete and non-solicitation covenants
- Equity acceleration provisions (single-trigger or double-trigger)

### Governing Law and Jurisdiction

Contracts typically specify which state's law governs disputes. Delaware law governs most corporate matters for Delaware entities. New York and California law govern many commercial contracts.

**Arbitration clauses:** Many contracts require disputes to be resolved through private arbitration rather than court. Arbitration can be faster and more confidential but waives the right to a jury trial and limits appeals.
    `,
  },

  // ── INTELLECTUAL PROPERTY ──────────────────────────────────────────────────
  {
    id: 'intellectual-property-overview',
    title: 'Intellectual Property Law: Trademark, Copyright, Patent, Trade Secrets',
    industry: 'general',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.uspto.gov/learning-and-resources/ip-policy',
    date: '2024-01-01',
    content: `
## Intellectual Property (IP) Law Overview

### Trademark

A trademark protects brand identifiers — names, logos, slogans, and trade dress that distinguish one company's goods or services from another's.

**Protection without registration:** Common law trademark rights arise from actual use of a mark in commerce. These rights are limited to the geographic area of use.

**Federal registration (USPTO):** Provides nationwide protection, the right to use the ® symbol, a legal presumption of ownership and validity, and the ability to sue in federal court. Registration is obtained by filing an application with the USPTO.

**TM vs. ®:** The ™ symbol can be used without registration to claim trademark rights. The ® symbol can only be used after the USPTO grants registration.

**Trademark clearance search:** Before investing in a brand, conduct a trademark search (in the USPTO database at USPTO.gov and common law searches) to confirm the mark is available. Using a confusingly similar mark to an existing trademark exposes you to infringement claims.

**Likelihood of confusion:** The key test in trademark law. Relevant factors include similarity of marks, similarity of goods/services, channels of trade, and sophistication of consumers.

**Trademark classes:** The USPTO uses 45 international classes (Nice Classification). A registration protects the mark in the specific classes for which it is registered.

**Trademark duration:** Federal registrations last 10 years and can be renewed indefinitely, as long as the mark continues to be used in commerce.

### Copyright

Copyright protects original works of authorship fixed in a tangible medium of expression, including software code, website content, books, music, art, and photos.

**Automatic protection:** Copyright arises automatically when an original work is created and fixed. Registration is not required for protection, but it is required before filing a lawsuit and enables recovery of statutory damages ($750–$150,000 per infringement) and attorney's fees.

**Duration:** Works created after 1978 are protected for the author's life plus 70 years. Works made for hire (see below) are protected for 95 years from publication or 120 years from creation, whichever is shorter.

**Work made for hire:** Work created by an employee within the scope of employment is automatically owned by the employer. Work created by an independent contractor is owned by the contractor UNLESS it falls into one of nine statutory categories AND there is a written agreement stating it is work made for hire. This is why IP assignment clauses in contractor agreements are essential.

**Fair use:** A defense to copyright infringement that permits limited use of copyrighted material without permission for purposes such as commentary, criticism, news reporting, teaching, and parody. Fair use is determined case-by-case based on four factors: purpose and character of use, nature of the copyrighted work, amount used, and effect on the market for the original.

**Open source licenses:** Software released under licenses such as MIT, Apache 2.0, BSD (permissive) or GPL/AGPL (copyleft). Copyleft licenses require derivative works to be released under the same license. Incorporating GPL-licensed code into a proprietary product can require the proprietary code to be open-sourced.

### Patent

A patent grants the right to exclude others from making, using, selling, or importing an invention for a limited period.

**Utility patent:** Protects functional inventions. Term: 20 years from the filing date, with maintenance fees required.

**Design patent:** Protects the ornamental design of an object. Term: 15 years from grant.

**Provisional patent application:** A lower-cost, informal application that establishes a filing date and allows the use of "Patent Pending" for 12 months. Does not become a patent without filing a non-provisional application within 12 months.

**Novelty requirement:** An invention must be new — not disclosed publicly (published, sold, publicly used) before the filing date. The US has a one-year grace period for inventor's own disclosures, but most countries have absolute novelty requirements (any public disclosure before filing destroys patent rights internationally).

**Non-obvious requirement:** The invention must not have been obvious to a person of ordinary skill in the relevant field.

**Patent prosecution:** The process of negotiating with the USPTO patent examiner to obtain a patent. Typically takes 2-3 years and costs $10,000-$30,000+ with a patent attorney.

**Software patents:** Software-implemented inventions can be patented if they are tied to a specific technical improvement or process. Abstract mathematical concepts and natural laws are not patentable (Alice Corp. v. CLS Bank, 2014).

### Trade Secrets

A trade secret is any information that derives economic value from not being generally known or ascertainable, and that is subject to reasonable measures to maintain its secrecy.

**Examples:** Customer lists, pricing formulas, manufacturing processes, source code, algorithms, marketing strategies.

**Protection:** Unlike patents, trade secrets are protected without registration and for an indefinite period — as long as secrecy is maintained. Protection is lost if the secret is publicly disclosed or independently discovered.

**Defend Trade Secrets Act (DTSA):** Federal law enacted in 2016 that provides a federal civil cause of action for trade secret misappropriation, including ex parte seizure orders to prevent dissemination.

**Reasonable measures:** Companies must take reasonable measures to protect trade secrets: NDAs with employees and contractors, access controls, confidentiality markings, and security protocols.

**Non-compete agreements:** Often used alongside trade secret protections. Enforceability varies dramatically by state: California completely prohibits employee non-competes; other states enforce them if they are reasonable in scope, duration, and geography.
    `,
  },

  // ── EMPLOYMENT LAW ─────────────────────────────────────────────────────────
  {
    id: 'employment-law-basics',
    title: 'Employment Law: At-Will Employment, Classification, Discrimination, Wage Law',
    industry: 'general',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.dol.gov/general/topic/workhours',
    date: '2024-01-01',
    content: `
## US Employment Law Fundamentals

### At-Will Employment

The United States follows the doctrine of at-will employment: either the employer or the employee may terminate the employment relationship at any time, for any reason (or no reason), with or without notice, as long as the reason is not illegal.

**Exceptions to at-will:**
- **Discrimination:** Cannot fire someone because of race, color, religion, sex, national origin (Title VII), age 40+ (ADEA), disability (ADA), pregnancy (PDA), or other protected characteristics
- **Retaliation:** Cannot fire someone for engaging in protected activity (reporting harassment, filing a workers' comp claim, whistleblowing)
- **Implied contract:** An employee handbook or verbal promise of job security may create an implied contract
- **Public policy:** Cannot fire someone for jury duty, military service, or refusing to commit an illegal act
- **Montana:** The only state that requires good cause for termination after a probationary period

### Employee vs. Independent Contractor Classification

Misclassifying employees as independent contractors is one of the most common (and costly) legal mistakes businesses make.

**IRS common law test factors (not exhaustive):**
- Behavioral control: Does the company control how the work is done, not just the result?
- Financial control: Is the worker paid hourly, provided tools, free to offer services to others?
- Type of relationship: Is there a written contract, benefits, permanency?

**ABC test (California AB5 and other states):** A worker is an employee unless the hiring entity can prove ALL three: (A) the worker is free from control, (B) the worker performs work outside the usual course of the business, and (C) the worker is engaged in an independently established trade or business. The B prong makes it nearly impossible to classify most workers as contractors in California.

**Consequences of misclassification:** Back taxes (employer's share of FICA), penalties, back wages, overtime pay, benefits, and personal liability for corporate officers.

### Anti-Discrimination Laws

**Title VII of the Civil Rights Act (1964):** Prohibits discrimination based on race, color, religion, sex, or national origin. Applies to employers with 15+ employees. Enforced by the EEOC.

**Age Discrimination in Employment Act (ADEA):** Prohibits discrimination against workers 40 and older. Applies to employers with 20+ employees.

**Americans with Disabilities Act (ADA):** Prohibits discrimination against individuals with disabilities and requires reasonable accommodations. Applies to employers with 15+ employees.

**Pregnancy Discrimination Act (PDA):** Prohibits discrimination based on pregnancy, childbirth, or related medical conditions.

**Equal Pay Act (EPA):** Requires equal pay for equal work regardless of sex.

**Harassment:** Employers are liable for workplace harassment (sexual harassment, hostile work environment) by supervisors and, in some cases, by coworkers or customers. All companies should have a written anti-harassment policy and conduct training.

### Wage and Hour Law

**Fair Labor Standards Act (FLSA):** Sets federal minimum wage ($7.25/hour, though most states have higher minimums), overtime pay (1.5x for hours over 40/week), and child labor standards.

**Exempt vs. Non-Exempt Employees:**
- Non-exempt employees are entitled to overtime pay
- Exempt employees (executive, administrative, professional, outside sales) are not entitled to overtime but must receive a salary of at least $684/week (as of 2024 federal threshold; some states higher)
- The exemption is based on job duties AND salary level — job title does not matter

**State wage laws:** Many states (California, New York, Washington) have higher minimum wages, daily overtime rules, mandatory meal and rest breaks, and stricter classification tests.

### Leave Laws

**Family and Medical Leave Act (FMLA):** Employees at companies with 50+ employees who have worked 12+ months and 1,250+ hours are entitled to up to 12 weeks of unpaid, job-protected leave for family and medical reasons.

**State leave laws:** Many states have paid family and medical leave programs (California, New York, Washington, etc.).

**ADA and sick leave:** Employers must consider whether leave is a reasonable accommodation under the ADA.
    `,
  },

  // ── PRIVACY & DATA LAW ────────────────────────────────────────────────────
  {
    id: 'privacy-law-overview',
    title: 'Privacy Law: GDPR, CCPA, Data Protection, Privacy Policies',
    industry: 'saas',
    document_type: 'legal_guide',
    jurisdiction: 'US-EU',
    url: 'https://gdpr.eu/what-is-gdpr/',
    date: '2024-01-01',
    content: `
## Privacy and Data Protection Law

### General Data Protection Regulation (GDPR)

The GDPR is the European Union's comprehensive data protection regulation, effective May 25, 2018. It applies to any organization — regardless of location — that processes personal data of EU residents.

**Key principles:**
- **Lawfulness, fairness, transparency:** Processing must have a legal basis (consent, contract, legal obligation, vital interests, public task, legitimate interests)
- **Purpose limitation:** Data collected for one purpose cannot be used for another incompatible purpose
- **Data minimization:** Only collect what is necessary for the stated purpose
- **Accuracy:** Keep data accurate and up to date
- **Storage limitation:** Do not keep data longer than necessary
- **Integrity and confidentiality:** Implement appropriate security measures
- **Accountability:** Organizations must demonstrate compliance

**Individual rights under GDPR:**
- Right to access (data subject access request / DSAR)
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to restriction of processing
- Right to data portability
- Right to object
- Rights related to automated decision-making and profiling

**Penalties:** Up to €20 million or 4% of global annual turnover, whichever is higher.

**Data Processing Agreement (DPA):** Required when a controller (the business) engages a processor (a vendor processing data on its behalf, such as a cloud provider or SaaS tool).

**Data Protection Officer (DPO):** Required for public authorities, organizations engaged in large-scale systematic monitoring, or large-scale processing of special categories of data.

### California Consumer Privacy Act (CCPA) and CPRA

The CCPA (effective January 1, 2020), amended and strengthened by the CPRA (effective January 1, 2023), is the most comprehensive US state privacy law.

**Who must comply:** For-profit businesses that: (1) have annual gross revenues over $25 million, OR (2) buy, sell, or share personal information of 100,000+ consumers or households, OR (3) derive 50%+ of annual revenue from selling or sharing personal information.

**Consumer rights:**
- Right to know what personal information is collected, used, shared, or sold
- Right to delete personal information
- Right to opt out of sale or sharing of personal information
- Right to non-discrimination for exercising rights
- Right to correct inaccurate information (added by CPRA)
- Right to limit use of sensitive personal information (added by CPRA)

**Privacy policy requirements:** Must disclose what categories of personal information are collected, the purposes, whether it is sold or shared, and how consumers can exercise their rights.

**"Do Not Sell or Share My Personal Information" link:** Required on the website of any business that sells or shares personal information.

### Other US State Privacy Laws

By 2024, over 13 states have enacted comprehensive privacy laws (Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, Indiana, Tennessee, Iowa, Delaware, Florida, New Hampshire). The trend is toward nationwide coverage. Businesses should monitor state privacy law developments closely.

### Privacy Policy Requirements

Every website and app that collects personal information should have a clearly written privacy policy that discloses:
- What personal information is collected
- How it is collected (directly, cookies, third parties)
- Why it is collected and how it is used
- Whether it is shared or sold to third parties
- How long it is retained
- User rights and how to exercise them
- Contact information for privacy inquiries
- Date of last update

### Data Security

**FTC Act Section 5:** The FTC has authority to take action against companies that engage in unfair or deceptive practices, including inadequate data security. This functions as a de facto federal data security law.

**State data breach notification laws:** All 50 states have data breach notification laws requiring companies to notify affected consumers and state regulators when unencrypted personal information is compromised. Timing requirements vary (30-90 days is common).

**HIPAA Security Rule:** Covered entities and business associates must implement administrative, physical, and technical safeguards to protect electronic protected health information (ePHI).

**GLBA Safeguards Rule:** Financial institutions must implement a comprehensive information security program to protect customer financial information.

### Cookies and Tracking

**Third-party cookies:** Being phased out by major browsers. Advertisers are shifting to first-party data and privacy-safe attribution.

**Cookie consent banners:** Required under GDPR and ePrivacy Directive for EU visitors. Users must actively consent to non-essential cookies (analytics, advertising). The "accept all / reject all" standard is enforced by EU regulators.

**CCPA and cookies:** Sharing data with advertising platforms via cookies may constitute "sharing" personal information under the CPRA, requiring an opt-out mechanism.
    `,
  },

  // ── STARTUP / CORPORATE GOVERNANCE ────────────────────────────────────────
  {
    id: 'startup-legal-checklist',
    title: 'Startup Legal Essentials: Incorporation, Equity, Agreements, Compliance',
    industry: 'saas',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.ycombinator.com/documents',
    date: '2024-01-01',
    content: `
## Startup Legal Essentials

### When to Incorporate

Incorporate as early as possible — ideally before building any product or hiring anyone. Incorporating after the fact creates problems:
- IP created before incorporation may belong to founders personally
- Early employees may have contributed work as contractors, raising ownership questions
- Investors cannot invest in an unincorporated entity

### Delaware C-Corp Checklist at Formation

1. **File Certificate of Incorporation** with Delaware Secretary of State (~$140 fee; can use Stripe Atlas, Clerky, or a law firm)
2. **Issue founder shares** at a low price per share (e.g., $0.0001/share) soon after incorporation
3. **Sign founder restricted stock purchase agreements** with vesting schedules
4. **File 83(b) elections** within 30 days of stock issuance — this deadline is absolute and missing it is unrecoverable
5. **Establish an option pool** in the equity plan (typically 10% of fully-diluted shares for seed-stage companies)
6. **Adopt bylaws** governing corporate governance procedures
7. **Hold an organizational board meeting** and document resolutions
8. **Get an EIN** from the IRS (free, instant online)
9. **Open a business bank account** (SVB, Mercury, Brex)
10. **Register as a foreign entity** in any state where the company has a physical presence or employees
11. **Sign an IP assignment agreement** with each founder transferring all prior and future IP to the company
12. **Have all contractors and employees sign IP assignment and confidentiality agreements**

### Intellectual Property Assignment

This is the most commonly overlooked legal risk at startups. Every person who creates anything for the company — founders, employees, contractors — must sign an agreement explicitly assigning all IP to the company.

Without an IP assignment:
- A contractor who wrote your app owns the code (copyright vests automatically in the creator)
- A co-founder who leaves can claim ownership of IP they created
- Investors and acquirers will discover this in due diligence and it can kill a deal

### Section 83(b) Election — Critical Deadline

When stock is subject to vesting, the IRS treats each vesting event as ordinary income (the value of stock that vests minus what you paid). Filing an 83(b) election within 30 days tells the IRS to tax you on the full grant date value (usually zero at founding, since stock is worth almost nothing). Benefits:
- All future appreciation is taxed as capital gains (15-20%), not ordinary income (up to 37%)
- The capital gains holding period starts at grant (2+ years for favorable long-term capital gains treatment)
- If the company fails, the tax loss is realized at grant date when losses are typically small

**The 30-day deadline is absolute.** There are no extensions and no workarounds if you miss it.

### Corporate Governance

**Board of Directors:** Manages the corporation on behalf of shareholders. Makes major decisions (hiring/firing CEO, approving fundraising, authorizing equity grants, M&A).

**Board composition:** Seed stage: typically 3 directors (2 founders, 1 independent). Series A: typically 5 directors (2 founders, 2 investor-appointed, 1 independent).

**Officers:** The CEO, CFO, CTO, and Secretary are officers appointed by the board. They manage day-to-day operations.

**Written consents:** For routine corporate actions, boards and shareholders can act by written consent (signed resolutions) rather than holding a formal meeting.

### Annual Compliance Requirements for Delaware C-Corps

- **Delaware Franchise Tax:** Due March 1 each year. Can be calculated using the Authorized Shares Method (can be very high for companies with many authorized shares) or the Assumed Par Value Capital Method (usually much lower). Most startups should use the Assumed Par Value method.
- **Annual Report:** Filed with Delaware Secretary of State along with the franchise tax
- **Federal income tax return (Form 1120):** Due April 15 (October 15 with extension)
- **Foreign qualification:** Annual reports in states where the company is registered as a foreign entity

### Fundraising Documents

**SAFE:** Y Combinator's Simple Agreement for Future Equity. The standard pre-seed/seed instrument. Key terms: valuation cap, discount rate, MFN provision (most-favored-nation — the SAFE converts on the best terms offered to any other SAFE holder).

**Series A term sheet key terms to negotiate:**
- Pre-money valuation
- Option pool size and whether it is created pre- or post-money (pre-money pool expansion dilutes founders more)
- Liquidation preference (1x non-participating is standard and founder-friendly)
- Participating preferred (avoid if possible — gives investors double-dip in liquidation)
- Anti-dilution (broad-based weighted average is standard; full ratchet is harsh)
- Board composition
- Protective provisions (what actions require investor consent)
- Drag-along rights
- Information rights
    `,
  },

  // ── REAL ESTATE & LEASES ──────────────────────────────────────────────────
  {
    id: 'real-estate-business-leases',
    title: 'Commercial Real Estate: Office Leases, RESPA, Fair Housing, Zoning',
    industry: 'real_estate',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.hud.gov/program_offices/fair_housing_equal_opp',
    date: '2024-01-01',
    content: `
## Commercial Real Estate and Business Leasing

### Commercial Lease Basics

Commercial leases are governed by contract law (not the residential landlord-tenant laws that protect consumers). The terms are largely negotiable between sophisticated parties.

**Types of commercial leases:**

**Gross/Full-Service Lease:** Tenant pays a fixed monthly rent; landlord pays most operating expenses (taxes, insurance, maintenance). Common in multi-tenant office buildings.

**Net Lease (NNN - Triple Net):** Tenant pays base rent PLUS some or all of the property's operating expenses — property taxes, insurance, and maintenance. Common for retail and industrial spaces. Most favorable for landlords; tenants bear operating cost risk.

**Modified Gross Lease:** Hybrid between gross and net lease. Tenant pays base rent plus certain specified expenses.

**Key commercial lease provisions:**

- **Rent escalations:** Most commercial leases include annual rent increases, either fixed percentage (3%) or tied to CPI
- **Tenant Improvement Allowance (TIA):** Landlord contribution to build out the space for the tenant's use; negotiate the amount and whether it covers soft costs (architecture, permits)
- **Personal guarantee:** Landlords often require founders/principals to personally guarantee startup leases; negotiate to limit personal liability (burn-off guarantees, capped amounts)
- **Assignment and subletting:** Right to assign the lease to an acquirer or sublet excess space
- **Letter of credit vs. cash security deposit:** Letters of credit are preferred by tenants
- **Force majeure:** Addresses obligations during unforeseeable events
- **Renewal options:** The right (not obligation) to renew the lease at a predetermined rent or formula

### Real Estate Settlement Procedures Act (RESPA)

RESPA is a federal law that governs residential real estate transactions involving federally-related mortgage loans.

**Key requirements:**
- Lenders must provide a Loan Estimate (LE) within 3 business days of receiving a loan application
- A Closing Disclosure (CD) must be provided at least 3 business days before closing
- Prohibits kickbacks and referral fees among settlement service providers
- Requires escrow account disclosures
- Servicing transfer notices required

### Fair Housing Act

The Fair Housing Act prohibits discrimination in the sale, rental, and financing of housing based on race, color, national origin, religion, sex, familial status, and disability.

**Applies to:** Most housing sales and rentals, including advertising, showing, offering terms, and financing.

**Exemptions:** Small landlords (4 or fewer units, one of which is owner-occupied) and single-family homes sold or rented without a broker may have limited exemptions.

**Disability accommodations:** Landlords must make reasonable accommodations (policy changes) and allow reasonable modifications (physical changes, at tenant's expense) for disabled tenants.

**Familial status:** Cannot refuse to rent to families with children under 18. Exception for qualifying senior housing communities.

### Zoning Law

Zoning laws are local regulations that govern how land can be used. They divide land into zones (residential, commercial, industrial, mixed-use) and regulate building height, density, setbacks, and use.

**Variances:** A property owner can apply for a variance to deviate from zoning requirements. Must demonstrate hardship and that the variance will not harm the public.

**Special use permits:** Certain uses (schools, churches, day cares) require a special use permit even in zones where they might otherwise be permitted.

**Non-conforming uses:** Uses that predate zoning ordinances and were legal when established. Can generally continue but may not be expanded.
    `,
  },

  // ── HEALTHCARE & HIPAA ────────────────────────────────────────────────────
  {
    id: 'healthcare-hipaa-compliance',
    title: 'Healthcare Law: HIPAA, Telemedicine, FDA, Business Associates',
    industry: 'healthcare',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.hhs.gov/hipaa/index.html',
    date: '2024-01-01',
    content: `
## Healthcare Law and HIPAA Compliance

### HIPAA Overview

The Health Insurance Portability and Accountability Act (HIPAA) of 1996, as amended by the HITECH Act of 2009, establishes national standards for protecting protected health information (PHI).

**Who must comply:**

**Covered Entities:** Healthcare providers who transmit health information electronically (hospitals, physicians, pharmacies), health plans (insurance companies, HMOs, Medicare, Medicaid), and healthcare clearinghouses.

**Business Associates:** Any entity that creates, receives, maintains, or transmits PHI on behalf of a covered entity. This includes: EHR vendors, medical billing companies, cloud storage providers storing PHI, data analytics companies working with health data, lawyers, accountants, and consultants who access PHI.

**Business Associate Agreement (BAA):** A HIPAA-required contract between a covered entity and each business associate that specifies permitted uses of PHI, requires appropriate safeguards, and addresses breach notification obligations. Cloud services (AWS, Google Cloud, Azure, Salesforce) offer BAAs to covered entities.

### Protected Health Information (PHI)

PHI is individually identifiable health information relating to:
- Past, present, or future physical or mental health of an individual
- Provision of healthcare to an individual
- Past, present, or future payment for healthcare

The 18 HIPAA identifiers that make health information "individually identifiable" include: name, geographic data smaller than state, dates (other than year), telephone numbers, email addresses, SSN, medical record numbers, IP addresses, biometric identifiers, and others.

**De-identification:** PHI that has been properly de-identified (either by removing all 18 identifiers or through statistical expert determination) is no longer subject to HIPAA.

### HIPAA Rules

**Privacy Rule:** Limits uses and disclosures of PHI. Patients have the right to access their records, request amendments, and receive an accounting of disclosures. Minimum necessary standard: only access or disclose the minimum PHI necessary for the purpose.

**Security Rule:** Requires covered entities and business associates to implement administrative, physical, and technical safeguards to protect electronic PHI (ePHI). Requires risk analysis and risk management.

**Breach Notification Rule:** Covered entities must notify affected individuals, HHS, and (for large breaches) the media within 60 days of discovering a breach of unsecured PHI. Business associates must notify the covered entity without unreasonable delay.

**Penalties:** Tiered civil penalties from $100 to $50,000 per violation, up to $1.9 million per violation category per year. Criminal penalties for willful violations: up to 10 years imprisonment.

### Health Tech and Digital Health

**HIPAA and mobile apps:** Mobile health apps are subject to HIPAA if developed by or for a covered entity or business associate. Consumer health apps not connected to covered entities (e.g., fitness trackers used by individuals) are generally not covered by HIPAA.

**FTC Health Breach Notification Rule:** Applies to health apps and connected devices not covered by HIPAA. Requires notification to consumers, the FTC, and media for breaches of personal health records.

**FDA regulation of digital health:** The FDA regulates software as a medical device (SaMD) when it is intended to treat, diagnose, cure, or prevent disease. Clinical decision support software, AI-powered diagnostic tools, and software controlling medical devices may be regulated medical devices.

**Telemedicine:** State laws govern who may provide telemedicine and under what conditions. Most states require a prior patient-provider relationship or a physical examination before prescribing. The COVID-19 Public Health Emergency relaxed many restrictions; some have been made permanent.

### HIPAA and Cloud Services

Healthcare companies frequently use cloud services that store or process ePHI. Requirements:
- Execute a BAA with each cloud provider before storing ePHI
- Ensure the cloud environment is configured securely (encryption at rest and in transit)
- Conduct and document a risk analysis
- Train workforce members on HIPAA requirements
- Establish policies and procedures for access control, audit controls, and breach notification
    `,
  },

  // ── E-COMMERCE & FTC ──────────────────────────────────────────────────────
  {
    id: 'ecommerce-ftc-consumer-law',
    title: 'E-Commerce Law: FTC Rules, Consumer Protection, Returns, Subscription Law',
    industry: 'ecommerce',
    document_type: 'legal_guide',
    jurisdiction: 'US',
    url: 'https://www.ftc.gov/business-guidance/topics/truth-advertising',
    date: '2024-01-01',
    content: `
## E-Commerce and Consumer Protection Law

### FTC Act and Truth in Advertising

Section 5 of the Federal Trade Commission Act prohibits "unfair or deceptive acts or practices in or affecting commerce." This is the basis for the FTC's broad authority over advertising and marketing.

**Advertising must be:**
- **Truthful:** Cannot contain false statements of fact
- **Non-deceptive:** Cannot mislead consumers through omissions, misleading images, or technically true but deceptive statements
- **Substantiated:** Objective claims (health, performance, savings) must be backed by competent and reliable evidence before they are made

**Endorsements and testimonials (FTC Endorsement Guides):**
- Material connections between endorsers and brands must be clearly disclosed ("Paid partnership," "#ad," "#sponsored")
- Celebrity and influencer endorsements must reflect honest opinions
- Disclosures must be clear and conspicuous — not buried in hashtags or below the fold

**"Made in USA" claims:** Products must be "all or virtually all" made in the US if making an unqualified claim. Qualified claims ("Assembled in USA from imported components") are permissible if accurate.

### FTC Mail/Telephone Order Rule (30-Day Rule)

Applies to orders placed by mail, telephone, fax, or internet. Unless a specific shipping period is advertised, merchants must ship within 30 days of receiving a completed order. If shipping is delayed:
- Notify the buyer and offer cancellation and refund
- Refund must be issued within 7 business days for credit card orders

### FTC Negative Option and Subscription Rules

The FTC's updated Negative Option Rule (effective 2023) covers all negative option programs (free trials, automatic renewal, continuity plans). Requirements:
- Clear and conspicuous disclosure of all material terms before obtaining billing information
- Express informed consent to the recurring charges
- Simple cancellation mechanism (as easy as signing up — cannot require calling a phone number if sign-up was online)
- Immediate cancellation honored

**State automatic renewal laws:** California, New York, and other states have their own auto-renewal disclosure requirements with specific formatting requirements (bold, above signature line).

### CAN-SPAM Act

Governs commercial email (promotional messages, advertisements). Requirements:
- Accurate header information (From, To, Reply-To)
- Non-deceptive subject lines
- Identify the message as an advertisement
- Include the sender's valid physical postal address
- Honor opt-out requests within 10 business days
- Third-party senders are also liable

Note: CAN-SPAM applies to commercial messages; it does not cover transactional emails (order confirmations, account notifications).

### Payment Card Industry (PCI DSS)

Any business that stores, processes, or transmits credit card data must comply with PCI DSS (Payment Card Industry Data Security Standard). Requirements include network security, encryption, access controls, and regular security testing. Non-compliance can result in fines from card networks and loss of ability to accept credit cards.

**Best practice:** Use a PCI-compliant payment processor (Stripe, Square, Braintree) that handles card data on your behalf, minimizing the scope of PCI compliance obligations.

### State Sales Tax (Post-Wayfair)

The Supreme Court's 2018 Wayfair decision allows states to require out-of-state businesses to collect and remit sales tax based on economic nexus (typically $100,000 in sales or 200 transactions in a state per year). Most states have enacted economic nexus laws. E-commerce businesses must monitor their nexus and collect sales tax accordingly or face liability for uncollected taxes.

### Return and Refund Policies

There is no federal law requiring merchants to accept returns or offer refunds. However:
- Advertised return policies must be honored
- FTC rules require disclosure of any material limitations before purchase
- Some states require disclosure of no-refund policies at the point of sale
- Credit card chargeback rights give consumers leverage regardless of merchant policy
    `,
  },
];

const BATCH_SIZE = 50;

export async function seedLegalConcepts(): Promise<number> {
  console.log('\n=== Seeding Foundational Legal Concepts ===\n');
  const collection = await getOrCreateCollection(LEGAL_COLLECTION);
  let totalChunks = 0;

  for (const doc of LEGAL_CONCEPTS) {
    console.log(`  Processing: ${doc.title}`);

    const baseMetadata: Record<string, string> = {
      source: 'elle-legal-seed',
      title: doc.title,
      industry: doc.industry,
      document_type: doc.document_type,
      jurisdiction: doc.jurisdiction,
      url: doc.url,
      date: doc.date,
      relevance_score: '0.95',
    };

    const chunks = chunkText(doc.content.trim(), baseMetadata);

    const ids: string[] = chunks.map((_, i) => `seed-${doc.id}-chunk-${i}`);
    const texts = chunks.map((c) => c.text);
    const metas = chunks.map((c) => c.metadata);

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      const batchMetas = metas.slice(i, i + BATCH_SIZE);
      const embeddings = await embedTexts(batchTexts);

      await collection.upsert({
        ids: batchIds,
        embeddings,
        metadatas: batchMetas,
        documents: batchTexts,
      });
    }

    totalChunks += chunks.length;
    console.log(`    → ${chunks.length} chunks indexed`);
  }

  console.log(`\n=== Seed Complete: ${totalChunks} chunks ===`);
  return totalChunks;
}

// Run directly
const isDirectRun =
  process.argv[1]?.endsWith('seed-legal-concepts.ts') ||
  process.argv[1]?.endsWith('seed-legal-concepts.js');

if (isDirectRun) {
  seedLegalConcepts()
    .then((count) => {
      console.log(`\nDone. Total chunks indexed: ${count}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
