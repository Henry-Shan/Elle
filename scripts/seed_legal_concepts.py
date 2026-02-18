#!/usr/bin/env python3
"""
Seed foundational legal concepts into ChromaDB using the native Python client.
Generates embeddings via OpenAI text-embedding-3-small (same model as the TS code).
Run: python3 scripts/seed_legal_concepts.py

This script:
  1. Deletes and recreates the legal-documents collection (to ensure clean EF config)
  2. Seeds 25+ foundational legal topic documents
"""

import os, sys
from pathlib import Path

# Load .env from project root
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

import chromadb
from openai import OpenAI
from chromadb.utils.embedding_functions.openai_embedding_function import OpenAIEmbeddingFunction

COLLECTION_NAME = "legal-documents"
EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 400
BATCH_SIZE = 50

openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
chroma = chromadb.HttpClient(
    host=os.environ.get("CHROMA_HOST", "localhost"),
    port=int(os.environ.get("CHROMA_PORT", "8000")),
)

# Configure OpenAI embedding function so collection metadata is properly stored
# (suppresses "No embedding function configuration found" warning)
openai_ef = OpenAIEmbeddingFunction(
    api_key=os.environ["OPENAI_API_KEY"],
    model_name=EMBEDDING_MODEL,
)

# ---------------------------------------------------------------------------
# Chunker
# ---------------------------------------------------------------------------

def chunk_text(text: str, metadata: dict, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    separators = ["\n\n", "\n", ". ", " "]

    def split_recursive(t, seps):
        if len(t) <= chunk_size:
            return [t.strip()] if t.strip() else []
        sep = seps[0]
        rest = seps[1:]
        parts = t.split(sep)
        chunks, current = [], ""
        for part in parts:
            candidate = current + sep + part if current else part
            if len(candidate) > chunk_size and current:
                chunks.append(current.strip())
                overlap_text = current[-overlap:] if len(current) > overlap else current
                current = (overlap_text + sep + part) if overlap_text else part
            else:
                current = candidate
        if current.strip():
            chunks.append(current.strip())
        if rest:
            refined = []
            for c in chunks:
                if len(c) > chunk_size:
                    refined.extend(split_recursive(c, rest))
                else:
                    refined.append(c)
            return refined
        return chunks

    raw = split_recursive(text, separators)
    result = []
    for i, t in enumerate(raw):
        if len(t) > 50:
            result.append({"text": t, "metadata": {**metadata, "chunk_index": str(i)}})
    return result


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------

def embed_texts(texts: list) -> list:
    all_embeddings = []
    for i in range(0, len(texts), 2048):
        batch = texts[i:i + 2048]
        resp = openai_client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        all_embeddings.extend([item.embedding for item in resp.data])
    return all_embeddings


# ---------------------------------------------------------------------------
# Legal documents — 25 comprehensive topics
# ---------------------------------------------------------------------------

LEGAL_CONCEPTS = [
    {
        "id": "entity-types-overview",
        "title": "Business Entity Types: C-Corp, LLC, S-Corp, Sole Proprietor, Partnership",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Business Entity Types: A Comprehensive Comparison

Choosing the right business entity is one of the most important legal decisions an entrepreneur makes. Each entity type has distinct implications for taxes, liability, fundraising, and management.

### C-Corporation (C-Corp)

A C-Corporation is a separate legal entity owned by shareholders. It is the default corporate form recognized under state law and is the preferred structure for venture-backed startups.

Key characteristics:
- Separate legal entity from its owners (shareholders)
- Limited liability for shareholders — personal assets are protected from business debts
- Unlimited number of shareholders, including foreign nationals and institutional investors
- Can issue multiple classes of stock (common, preferred, Series A, B, etc.)
- Subject to double taxation: the corporation pays corporate income tax on profits, and shareholders pay personal income tax on dividends received
- The Tax Cuts and Jobs Act of 2017 set the federal corporate tax rate at 21%
- Required to hold annual shareholder and board meetings, maintain minutes, and file annual reports
- Delaware is the most common state of incorporation for C-Corps due to well-developed corporate law and investor familiarity

Best for: Startups seeking venture capital or angel investment, companies planning to go public (IPO), businesses with employees who receive stock options (ISOs), and companies expecting to reinvest profits rather than distribute them.

Disadvantages: More administrative overhead, double taxation of dividends, cannot use business losses to offset personal income.

### Limited Liability Company (LLC)

An LLC combines the liability protection of a corporation with the tax flexibility of a partnership. It is governed by an Operating Agreement rather than corporate bylaws.

Key characteristics:
- Members (owners) have limited liability — personal assets are protected
- Pass-through taxation by default: profits and losses flow through to members' personal tax returns, avoiding double taxation
- Can be taxed as a sole proprietorship (single-member), partnership (multi-member), S-Corp, or C-Corp by making elections with the IRS
- Flexible management structure: can be member-managed or manager-managed
- Operating Agreement governs the LLC — this document controls profit/loss allocation, voting rights, and transfer of membership interests
- No restrictions on number or type of members (unlike S-Corps)
- Members pay self-employment taxes (15.3%) on their share of profits unless they elect S-Corp taxation

Best for: Small businesses, professional services firms, real estate investors, businesses owned by non-US persons, and businesses that want flexible profit allocation without strict corporate formalities.

Disadvantages: Not ideal for venture capital funding (VCs strongly prefer C-Corps), complex profit/loss allocation in multi-member LLCs, potential self-employment tax burden.

### C-Corp vs LLC: Direct Comparison

The main differences between a C-Corp and an LLC are:
- Taxation: C-Corps face double taxation (corporate tax + personal tax on dividends); LLCs have pass-through taxation by default
- Fundraising: C-Corps are strongly preferred by venture capital investors; LLCs make VC investment difficult
- Stock options: C-Corps can grant Incentive Stock Options (ISOs) to employees; LLCs cannot
- Formalities: C-Corps require annual meetings, board minutes, and more compliance; LLCs have minimal formalities
- Going public (IPO): C-Corps can go public directly; LLCs must first convert to a corporation
- Foreign owners: Both can have foreign owners

The bottom line on C-Corp vs LLC: If you plan to raise venture capital, hire employees with stock options, or eventually go public, choose a Delaware C-Corp. If you are a small business, professional services firm, or real estate investor who wants tax flexibility and minimal formalities, choose an LLC.

### S-Corporation (S-Corp)

An S-Corp is a corporation that has elected special tax status with the IRS under Subchapter S of the Internal Revenue Code.

Key characteristics:
- Pass-through taxation: income, losses, deductions, and credits flow through to shareholders' personal tax returns
- Avoids double taxation of C-Corps
- Shareholders who work in the business must receive reasonable compensation (salary) subject to payroll taxes; remaining profits distributed as dividends avoid self-employment tax
- Strict IRS eligibility requirements: maximum 100 shareholders, all shareholders must be US citizens or permanent residents, only one class of stock
- S-Corps cannot have venture capital investors (funds are typically LLCs or partnerships)

Best for: Profitable small businesses where owners want to reduce self-employment taxes by splitting income between salary and distributions.

### Sole Proprietorship

The simplest and most common business structure. Not a separate legal entity — the business and the owner are the same person. No registration required. All profits taxed as personal income on Schedule C. No liability protection — the owner is personally liable for all business debts and legal claims.

### General Partnership

A partnership is formed when two or more people carry on a business for profit together. No formal registration required (but a Partnership Agreement is strongly recommended). Pass-through taxation. Each partner is personally liable for the debts and obligations of the partnership.

### Delaware vs. Other States for Incorporation

Delaware is the most popular state for incorporating C-Corps and forming LLCs:
- The Delaware Court of Chancery is a specialized business court with deep expertise in corporate law
- Delaware General Corporation Law (DGCL) is well-established and predictable
- No state corporate income tax for companies incorporated in Delaware but not doing business there
- Most venture capital term sheets require Delaware incorporation
""",
    },
    {
        "id": "startup-equity-basics",
        "title": "Startup Equity: Stock Options, Vesting, Cap Tables, SAFEs, Term Sheets",
        "industry": "saas",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Startup Equity Fundamentals

### Equity Basics

Equity represents ownership in a company. In a C-Corp, equity is represented by shares of stock. The capitalization table (cap table) tracks who owns what percentage of the company.

Common Stock: Issued to founders and employees. Has voting rights. In a liquidation, common stockholders are paid after preferred stockholders.

Preferred Stock: Issued to investors in venture capital rounds. Has preferences over common stock in liquidations (liquidation preference), dividends, and conversion rights.

Authorized vs. Issued Shares: The certificate of incorporation authorizes a maximum number of shares. Typical startup: authorize 10,000,000 shares, issue 8,000,000 to founders.

### Founder Equity and Vesting

Standard 4-year vesting with 1-year cliff:
- The 1-year cliff means zero shares vest until the founder has been with the company for one year
- After the cliff, 25% vests at the one-year mark
- The remaining 75% vests monthly over the following 36 months (1/48 per month)
- If a founder leaves at month 11, they receive no shares
- If a founder leaves at month 18, they receive 37.5% of their grant

83(b) Election: When founders receive stock subject to vesting restrictions, they can file an 83(b) election with the IRS within 30 days of receiving the stock. This election causes the founder to recognize income at grant date (usually zero at founding). Benefits: all future appreciation is taxed as capital gains, not ordinary income. The 30-day deadline is absolute — there are no extensions.

### Stock Options

Incentive Stock Options (ISOs):
- Only available to employees (not contractors or advisors)
- Tax-advantaged: no ordinary income tax at exercise (though AMT may apply)
- Long-term capital gains rates apply if shares are held for 2 years from grant and 1 year from exercise
- Maximum $100,000 in ISOs can become exercisable in any calendar year

Non-Qualified Stock Options (NSOs/NQSOs):
- Can be granted to anyone (employees, contractors, advisors, board members)
- At exercise, the spread (fair market value minus exercise price) is ordinary income

Option Pool / Employee Stock Option Plan (ESOP): A reserved portion of the company's equity for employee grants, typically 10-20% of fully-diluted shares.

409A Valuation: Before issuing stock options, a company must obtain an independent appraisal (409A valuation) to set the exercise price at fair market value. Options granted below fair market value result in a 20% penalty tax under IRS Section 409A.

### SAFE (Simple Agreement for Future Equity)

A SAFE is not debt — it is an agreement to issue equity at a future priced round. Created by Y Combinator in 2013. SAFEs typically include:
- Valuation cap: The maximum valuation at which the SAFE converts to equity
- Discount rate: The SAFE holder gets shares at a discount to the price paid by new investors (typically 10-20%)
- MFN (Most Favored Nation): If the company issues future SAFEs on better terms, the MFN holder gets those better terms

Post-Money SAFE (YC standard since 2018): The valuation cap is calculated on a post-money basis, making dilution more transparent for founders.

### Convertible Note

A loan that converts to equity at a future financing round. Unlike a SAFE, it has an interest rate, maturity date, and is technically debt. Carries more overhead than a SAFE and creates balance sheet liability.

### Priced Equity Round (Series A, B, etc.)

A priced round establishes a pre-money valuation and issues preferred stock.

Key Term Sheet Terms:
- Pre-money valuation: Company value before new investment
- Post-money valuation: Pre-money plus new investment amount
- Liquidation preference: 1x non-participating is standard and founder-friendly
- Participating preferred gives investors their money back AND a share of remaining proceeds
- Anti-dilution protection: Broad-based weighted average is standard; full ratchet is founder-unfriendly
- Board composition: VCs often require a board seat
- Pro-rata rights: Right to invest in future rounds to maintain ownership percentage
""",
    },
    {
        "id": "contracts-fundamentals",
        "title": "Contract Law: NDAs, Service Agreements, Terms of Service",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Contract Law Fundamentals

### Elements of a Valid Contract

For a contract to be legally enforceable under US law, it must have:
1. Offer: One party proposes terms
2. Acceptance: The other party agrees to those exact terms
3. Consideration: Each party gives something of value (money, services, a promise)
4. Capacity: Both parties must have legal capacity (be adults, not mentally incapacitated)
5. Legality: The contract's purpose must be legal

### Non-Disclosure Agreement (NDA)

An NDA protects confidential information shared between parties.

Key provisions:
- Definition of confidential information: Should be broad but not so broad as to be unenforceable
- Exceptions: Information that is already public, independently developed, received from a third party, or required by law to be disclosed
- Term: How long the obligation lasts (typically 2-5 years; trade secrets may be indefinite)
- Mutual vs. one-way: A mutual NDA protects both parties; a one-way NDA only protects the disclosing party
- Remedies: NDAs typically include provisions for injunctive relief

When to use: Before discussing a business idea with a potential partner, investor, or employee. Note: Most VCs will NOT sign NDAs for initial pitch meetings.

### Service Agreement / Consulting Agreement

Governs the relationship between a company and an independent contractor.

Key provisions:
- Scope of work and deliverables
- Payment terms (hourly, project-based, milestone-based)
- Intellectual property assignment: Critical — must explicitly state that all work product is owned by the company
- Independent contractor status vs. employee: Misclassifying employees as contractors has serious tax and legal consequences
- Confidentiality obligations
- Non-solicitation of employees or clients

### Terms of Service (ToS)

The legal agreement between a company and its users governing use of a website, app, or platform.

Key provisions:
- Acceptable use policy
- Intellectual property ownership
- Limitation of liability and disclaimer of warranties
- Dispute resolution (arbitration clause, class action waiver)
- Governing law and jurisdiction

Clickwrap vs. Browsewrap: Clickwrap agreements (user must actively click "I agree") are more enforceable than browsewrap agreements (user is deemed to agree by using the site).

### Employment Agreements

Most US employees are at-will and receive an offer letter rather than a formal employment contract. Executives may have employment agreements with:
- Fixed term or termination protections
- Severance provisions
- Non-compete and non-solicitation covenants
- Equity acceleration provisions (single-trigger or double-trigger)

### Governing Law and Dispute Resolution

Contracts specify which state's law governs disputes. Delaware law governs corporate matters for Delaware entities.

Arbitration clauses: Many contracts require disputes to be resolved through private arbitration rather than court. Arbitration can be faster and more confidential but waives the right to a jury trial.
""",
    },
    {
        "id": "intellectual-property-overview",
        "title": "Intellectual Property: Trademark, Copyright, Patent, Trade Secrets",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Intellectual Property Law

### Trademark

A trademark protects brand identifiers — names, logos, slogans, and trade dress that distinguish one company's goods or services from another's.

Common law trademark rights arise from actual use of a mark in commerce, limited to the geographic area of use.

Federal registration (USPTO): Provides nationwide protection, right to use the (R) symbol, legal presumption of ownership, and ability to sue in federal court.

TM vs. (R): The TM symbol can be used without registration. The (R) symbol can only be used after USPTO grants registration.

Trademark clearance search: Before investing in a brand, conduct a USPTO search to confirm the mark is available. Using a confusingly similar mark exposes you to infringement claims.

Likelihood of confusion: The key test in trademark law. Relevant factors include similarity of marks, similarity of goods/services, and channels of trade.

Trademark duration: Federal registrations last 10 years and can be renewed indefinitely, as long as the mark continues to be used in commerce.

### Copyright

Copyright protects original works of authorship including software code, website content, books, music, art, and photos.

Automatic protection: Copyright arises automatically when an original work is created and fixed. Registration is not required for protection but enables recovery of statutory damages ($750-$150,000 per infringement) and attorney's fees.

Duration: Works created after 1978 are protected for the author's life plus 70 years.

Work made for hire: Work created by an employee within the scope of employment is automatically owned by the employer. Work created by an independent contractor is owned by the contractor UNLESS there is a written work-for-hire agreement. This is why IP assignment clauses in contractor agreements are essential.

Fair use: Permits limited use of copyrighted material without permission for purposes such as commentary, criticism, news reporting, teaching, and parody.

Open source licenses: MIT, Apache 2.0, BSD (permissive) or GPL/AGPL (copyleft). Copyleft licenses require derivative works to be released under the same license.

### Patent

A patent grants the right to exclude others from making, using, selling, or importing an invention.

Utility patent: Protects functional inventions. Term: 20 years from the filing date.

Provisional patent application: A lower-cost application that establishes a filing date and allows use of "Patent Pending" for 12 months. Must file non-provisional within 12 months.

Novelty requirement: An invention must be new — not publicly disclosed before the filing date. The US has a one-year grace period for inventor's own disclosures.

Software patents: Software is generally patentable in the US if it produces a technical effect beyond merely implementing an abstract idea (post-Alice Corp. v. CLS Bank).

### Trade Secrets

A trade secret is information that derives economic value from not being generally known and is subject to reasonable measures to maintain secrecy.

Examples: Customer lists, pricing formulas, manufacturing processes, source code, algorithms.

Protection: Trade secrets are protected without registration and for an indefinite period — as long as secrecy is maintained.

Defend Trade Secrets Act (DTSA): Federal law enacted in 2016 that provides a federal civil cause of action for trade secret misappropriation.

Non-compete agreements: Often used alongside trade secret protections. Enforceability varies by state: California completely prohibits employee non-competes; other states enforce them if reasonable in scope, duration, and geography.
""",
    },
    {
        "id": "employment-law-basics",
        "title": "Employment Law: At-Will, Classification, Discrimination, Wage Law",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## US Employment Law Fundamentals

### At-Will Employment

The United States follows the doctrine of at-will employment: either the employer or the employee may terminate the employment relationship at any time, for any reason (or no reason), as long as the reason is not illegal.

Exceptions to at-will:
- Discrimination: Cannot fire someone because of race, color, religion, sex, national origin (Title VII), age 40+ (ADEA), disability (ADA), or pregnancy (PDA)
- Retaliation: Cannot fire someone for reporting harassment, filing a workers' comp claim, or whistleblowing
- Implied contract: An employee handbook or verbal promise of job security may create an implied contract

### Employee vs. Independent Contractor Classification

Misclassifying employees as independent contractors is one of the most common and costly legal mistakes businesses make.

IRS common law test factors:
- Behavioral control: Does the company control how the work is done, not just the result?
- Financial control: Is the worker paid hourly, provided tools, free to offer services to others?
- Type of relationship: Is there a written contract, benefits, permanency?

ABC test (California AB5 and other states): A worker is an employee unless the hiring entity proves ALL three: (A) the worker is free from control, (B) the worker performs work outside the usual course of the business, and (C) the worker is engaged in an independently established trade or business.

Consequences of misclassification: Back taxes, penalties, back wages, overtime pay, benefits, and personal liability for corporate officers.

### Anti-Discrimination Laws

Title VII of the Civil Rights Act (1964): Prohibits discrimination based on race, color, religion, sex, or national origin. Applies to employers with 15+ employees.

Age Discrimination in Employment Act (ADEA): Prohibits discrimination against workers 40 and older. Applies to employers with 20+ employees.

Americans with Disabilities Act (ADA): Prohibits discrimination against individuals with disabilities and requires reasonable accommodations. Applies to employers with 15+ employees.

All companies should have a written anti-harassment policy and conduct training.

### Wage and Hour Law

Fair Labor Standards Act (FLSA): Sets federal minimum wage ($7.25/hour), overtime pay (1.5x for hours over 40/week), and child labor standards.

Exempt vs. Non-Exempt Employees:
- Non-exempt employees are entitled to overtime pay
- Exempt employees (executive, administrative, professional) are not entitled to overtime but must receive a salary of at least $684/week
- The exemption is based on job duties AND salary level — job title does not matter

State wage laws: Many states (California, New York, Washington) have higher minimum wages, daily overtime rules, and mandatory meal and rest breaks.

### Leave Laws

Family and Medical Leave Act (FMLA): Employees at companies with 50+ employees who have worked 12+ months are entitled to up to 12 weeks of unpaid, job-protected leave for family and medical reasons.

Many states have paid family and medical leave programs (California, New York, Washington, Colorado).

### Non-Compete and Non-Solicitation Agreements

Non-compete agreements restrict employees from working for competitors after leaving. Enforceability varies dramatically by state:
- California: Complete ban on employee non-competes under Bus. & Prof. Code § 16600 (as of 2024 FTC rule efforts, nationwide ban is pending litigation)
- Most other states: Enforce if reasonable in scope, geography, and duration (typically 6-24 months)

Non-solicitation agreements restrict employees from poaching clients or colleagues. More consistently enforceable than non-competes.
""",
    },
    {
        "id": "privacy-law-overview",
        "title": "Privacy Law: GDPR, CCPA, Data Protection, Privacy Policies",
        "industry": "saas",
        "document_type": "legal_guide",
        "jurisdiction": "US-EU",
        "content": """
## Privacy and Data Protection Law

### General Data Protection Regulation (GDPR)

The GDPR is the EU's comprehensive data protection regulation effective May 25, 2018. It applies to any organization that processes personal data of EU residents.

Key principles:
- Lawfulness, fairness, transparency: Processing must have a legal basis (consent, contract, legal obligation, legitimate interests)
- Purpose limitation: Data cannot be used for incompatible purposes
- Data minimization: Only collect what is necessary
- Storage limitation: Do not keep data longer than necessary
- Accountability: Organizations must demonstrate compliance

Individual rights under GDPR:
- Right to access (data subject access request / DSAR)
- Right to rectification
- Right to erasure (right to be forgotten)
- Right to data portability
- Right to object

Penalties: Up to 20 million euros or 4% of global annual turnover, whichever is higher.

Data Processing Agreement (DPA): Required when a controller engages a processor to handle data on its behalf.

### California Consumer Privacy Act (CCPA) and CPRA

The CCPA (effective January 1, 2020), amended by the CPRA (effective January 1, 2023), is the most comprehensive US state privacy law.

Who must comply: For-profit businesses that: (1) have annual revenues over $25 million, OR (2) process data of 100,000+ consumers or households, OR (3) derive 50%+ of annual revenue from selling personal information.

Consumer rights:
- Right to know what personal information is collected
- Right to delete personal information
- Right to opt out of sale or sharing of personal information
- Right to correct inaccurate information (CPRA)
- Right to limit use of sensitive personal information (CPRA)

### Other US State Privacy Laws

By 2024, over 18 states have enacted comprehensive privacy laws including Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, Indiana, Tennessee, Iowa, Delaware, New Jersey, New Hampshire, and Maryland.

### Privacy Policy Requirements

Every website and app that collects personal information should disclose:
- What personal information is collected and how
- Why it is collected and how it is used
- Whether it is shared or sold to third parties
- How long it is retained
- User rights and how to exercise them

### Data Security

FTC Act Section 5: The FTC has authority over inadequate data security as an unfair or deceptive practice.

State data breach notification laws: All 50 states require companies to notify affected consumers and regulators when personal information is compromised (typically within 30-90 days).

Cookie consent: GDPR and ePrivacy Directive require active consent for non-essential cookies (analytics, advertising) for EU visitors.
""",
    },
    {
        "id": "startup-legal-checklist",
        "title": "Startup Legal Essentials: Incorporation, Equity, Agreements, Compliance",
        "industry": "saas",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Startup Legal Essentials

### When to Incorporate

Incorporate as early as possible — before building any product or hiring anyone. Incorporating after the fact creates problems:
- IP created before incorporation may belong to founders personally
- Early employees may have contributed work as contractors, raising ownership questions
- Investors cannot invest in an unincorporated entity

### Delaware C-Corp Checklist at Formation

1. File Certificate of Incorporation with Delaware Secretary of State
2. Issue founder shares at a low price per share soon after incorporation
3. Sign founder restricted stock purchase agreements with vesting schedules
4. File 83(b) elections within 30 days of stock issuance — this deadline is absolute
5. Establish an option pool (typically 10% of fully-diluted shares)
6. Adopt bylaws governing corporate governance procedures
7. Hold an organizational board meeting and document resolutions
8. Get an EIN from the IRS (free, instant online)
9. Open a business bank account
10. Register as a foreign entity in any state where the company has employees
11. Sign an IP assignment agreement with each founder
12. Have all contractors and employees sign IP assignment and confidentiality agreements

### Intellectual Property Assignment

Every person who creates anything for the company — founders, employees, contractors — must sign an agreement explicitly assigning all IP to the company.

Without an IP assignment:
- A contractor who wrote your app owns the code
- A co-founder who leaves can claim ownership of IP they created
- Investors and acquirers will discover this in due diligence and it can kill a deal

### Section 83(b) Election — Critical 30-Day Deadline

When stock is subject to vesting, filing an 83(b) election within 30 days tells the IRS to tax you on the full grant date value (usually zero at founding). Benefits:
- All future appreciation is taxed as capital gains (15-20%), not ordinary income (up to 37%)
- The capital gains holding period starts at grant date
- If the company fails, the tax loss is realized at grant date when losses are typically small

The 30-day deadline is absolute. There are no extensions and no workarounds if you miss it.

### Corporate Governance

Board of Directors: Manages the corporation on behalf of shareholders. Seed stage: typically 3 directors (2 founders, 1 independent). Series A: typically 5 directors (2 founders, 2 investor-appointed, 1 independent).

Annual Compliance for Delaware C-Corps:
- Delaware Franchise Tax: Due March 1 each year (use Assumed Par Value Capital Method for lower taxes)
- Annual Report: Filed with Delaware Secretary of State
- Federal income tax return (Form 1120): Due April 15 (October 15 with extension)

### Fundraising Documents

SAFE: Y Combinator's Simple Agreement for Future Equity. The standard pre-seed/seed instrument. Key terms: valuation cap, discount rate, MFN provision.

Series A term sheet key terms to negotiate:
- Pre-money valuation
- Option pool size (pre-money pool expansion dilutes founders more)
- Liquidation preference (1x non-participating is standard and founder-friendly)
- Participating preferred gives investors double-dip in liquidation — avoid if possible
- Anti-dilution (broad-based weighted average is standard)
- Board composition and protective provisions
""",
    },
    {
        "id": "real-estate-business-leases",
        "title": "Commercial Real Estate: Office Leases, RESPA, Fair Housing, Zoning",
        "industry": "real_estate",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Commercial Real Estate and Business Leasing

### Commercial Lease Basics

Commercial leases are governed by contract law (not residential landlord-tenant laws). The terms are largely negotiable.

Types of commercial leases:
- Gross/Full-Service Lease: Tenant pays fixed monthly rent; landlord pays most operating expenses. Common in multi-tenant office buildings.
- Net Lease (NNN - Triple Net): Tenant pays base rent PLUS property taxes, insurance, and maintenance. Common for retail and industrial spaces.
- Modified Gross Lease: Hybrid between gross and net lease.

Key commercial lease provisions:
- Rent escalations: Most commercial leases include annual rent increases (fixed percentage or tied to CPI)
- Tenant Improvement Allowance (TIA): Landlord contribution to build out the space
- Personal guarantee: Landlords often require founders to personally guarantee startup leases
- Assignment and subletting: Right to assign the lease to an acquirer or sublet excess space
- Letter of credit vs. cash security deposit
- Renewal options: The right (not obligation) to renew at a predetermined rent

### Real Estate Settlement Procedures Act (RESPA)

RESPA governs residential real estate transactions involving federally-related mortgage loans.

Key requirements:
- Lenders must provide a Loan Estimate within 3 business days of receiving a loan application
- A Closing Disclosure must be provided at least 3 business days before closing
- Prohibits kickbacks and referral fees among settlement service providers

### Fair Housing Act

The Fair Housing Act prohibits discrimination in housing based on race, color, national origin, religion, sex, familial status, and disability.

Disability accommodations: Landlords must make reasonable accommodations and allow reasonable modifications for disabled tenants.

Familial status: Cannot refuse to rent to families with children under 18. Exception for qualifying senior housing communities.

### Zoning Law

Zoning laws are local regulations governing land use. They divide land into zones (residential, commercial, industrial, mixed-use).

Variances: A property owner can apply for a variance to deviate from zoning requirements.

Non-conforming uses: Uses that predate zoning ordinances and were legal when established can generally continue but may not be expanded.

### 1031 Like-Kind Exchange

Section 1031 of the Internal Revenue Code allows real estate investors to defer capital gains taxes when selling investment property by reinvesting the proceeds into a "like-kind" replacement property within 180 days. A qualified intermediary must hold the proceeds during the exchange.
""",
    },
    {
        "id": "healthcare-hipaa-compliance",
        "title": "Healthcare Law: HIPAA, Telemedicine, FDA, Business Associates",
        "industry": "healthcare",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Healthcare Law and HIPAA Compliance

### HIPAA Overview

The Health Insurance Portability and Accountability Act (HIPAA) of 1996 establishes national standards for protecting protected health information (PHI).

Who must comply:
- Covered Entities: Healthcare providers who transmit health information electronically, health plans, and healthcare clearinghouses.
- Business Associates: Any entity that creates, receives, maintains, or transmits PHI on behalf of a covered entity. This includes EHR vendors, medical billing companies, cloud storage providers storing PHI, data analytics companies, lawyers, and accountants who access PHI.

Business Associate Agreement (BAA): A HIPAA-required contract between a covered entity and each business associate. Cloud services (AWS, Google Cloud, Azure) offer BAAs to covered entities.

### Protected Health Information (PHI)

PHI is individually identifiable health information relating to past, present, or future physical or mental health of an individual, provision of healthcare, or payment for healthcare.

The 18 HIPAA identifiers include: name, geographic data smaller than state, dates (other than year), telephone numbers, email addresses, SSN, medical record numbers, IP addresses, and biometric identifiers.

### HIPAA Rules

Privacy Rule: Limits uses and disclosures of PHI. Patients have rights to access their records and request amendments.

Security Rule: Requires administrative, physical, and technical safeguards to protect electronic PHI (ePHI). Requires risk analysis and risk management.

Breach Notification Rule: Covered entities must notify affected individuals, HHS, and media within 60 days of discovering a breach of unsecured PHI.

Penalties: Tiered civil penalties from $100 to $50,000 per violation, up to $1.9 million per violation category per year. Criminal penalties for willful violations: up to 10 years imprisonment.

### Health Tech and Digital Health

HIPAA and mobile apps: Mobile health apps are subject to HIPAA if developed by or for a covered entity or business associate. Consumer health apps not connected to covered entities are generally not covered.

FDA regulation of digital health: The FDA regulates software as a medical device (SaMD) when intended to treat, diagnose, cure, or prevent disease. AI-powered diagnostic tools may be regulated medical devices.

Telemedicine: State laws govern who may provide telemedicine. Most states require a prior patient-provider relationship or a physical examination before prescribing controlled substances.
""",
    },
    {
        "id": "ecommerce-ftc-consumer-law",
        "title": "E-Commerce Law: FTC Rules, Consumer Protection, Returns, Subscriptions",
        "industry": "ecommerce",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## E-Commerce and Consumer Protection Law

### FTC Act and Truth in Advertising

Section 5 of the Federal Trade Commission Act prohibits unfair or deceptive acts or practices in commerce.

Advertising must be:
- Truthful: Cannot contain false statements of fact
- Non-deceptive: Cannot mislead consumers through omissions or technically true but deceptive statements
- Substantiated: Objective claims must be backed by competent and reliable evidence

Endorsements and testimonials (FTC Endorsement Guides):
- Material connections between endorsers and brands must be clearly disclosed (#ad, #sponsored, Paid partnership)
- Disclosures must be clear and conspicuous — not buried in hashtags

### FTC Mail/Telephone Order Rule (30-Day Rule)

Unless a specific shipping period is advertised, merchants must ship within 30 days of receiving a completed order. If delayed, notify the buyer and offer cancellation and refund within 7 business days for credit card orders.

### FTC Negative Option and Subscription Rules

The FTC's Negative Option Rule (2023) requirements:
- Clear and conspicuous disclosure of all material terms before obtaining billing information
- Express informed consent to recurring charges
- Simple cancellation mechanism (as easy as signing up)
- Immediate cancellation honored

### CAN-SPAM Act

Governs commercial email. Requirements:
- Accurate header information (From, To, Reply-To)
- Non-deceptive subject lines
- Include the sender's valid physical postal address
- Honor opt-out requests within 10 business days

### PCI DSS

Any business that stores, processes, or transmits credit card data must comply with PCI DSS. Best practice: Use a PCI-compliant payment processor (Stripe, Square, Braintree) to minimize PCI compliance obligations.

### State Sales Tax (Post-Wayfair)

The Supreme Court's 2018 Wayfair decision allows states to require out-of-state businesses to collect sales tax based on economic nexus (typically $100,000 in sales or 200 transactions in a state per year). E-commerce businesses must monitor nexus across states.

### Return and Refund Policies

There is no federal law requiring merchants to accept returns or offer refunds. However, advertised return policies must be honored, and FTC rules require disclosure of material limitations before purchase. Credit card chargeback rights give consumers leverage regardless of merchant policy.
""",
    },
    {
        "id": "securities-law-fundraising",
        "title": "Securities Law: Regulation D, Reg CF, Accredited Investors, SEC Exemptions",
        "industry": "saas",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Securities Law and Startup Fundraising

### What Is a Security?

Under the Securities Act of 1933 and Securities Exchange Act of 1934, a "security" includes stocks, bonds, investment contracts, and SAFEs. The Howey Test determines if an arrangement is an investment contract (and therefore a security): (1) investment of money, (2) in a common enterprise, (3) with expectation of profits, (4) from the efforts of others.

The issuance of securities must either be registered with the SEC (expensive, time-consuming) or qualify for an exemption. Startups virtually always rely on exemptions.

### Regulation D Exemptions (Private Placements)

Regulation D provides the most commonly used exemptions for startup fundraising:

Rule 506(b) — the standard private placement:
- Unlimited dollar amount
- Up to 35 non-accredited but sophisticated investors; unlimited accredited investors
- No general solicitation or advertising permitted
- Form D must be filed with the SEC within 15 days of the first sale

Rule 506(c) — general solicitation allowed:
- Unlimited dollar amount
- Only accredited investors; must verify their accredited status
- General solicitation and advertising permitted (useful for AngelList syndications)

### Accredited Investor Definition

An accredited investor is an individual with:
- Annual income over $200,000 ($300,000 with spouse) in each of the prior two years and expected to continue, OR
- Net worth over $1 million (excluding primary residence), OR
- SEC/FINRA-licensed professionals (Series 7, Series 65, Series 82 holders as of 2020 rule update)

Entities (corporations, partnerships, LLCs, trusts) with assets over $5 million also qualify.

### Regulation Crowdfunding (Reg CF / Title III JOBS Act)

Allows companies to raise up to $5 million per year from the general public (not just accredited investors) via SEC-registered crowdfunding portals (Wefunder, Republic, StartEngine).

Requirements:
- Must use an SEC-registered intermediary
- Financial statements required (CPA-reviewed for raises over $124,000; audited for raises over $618,000 after first time)
- Annual report (Form C-AR) required

Investment limits for non-accredited investors: Based on income and net worth (typically $2,500 to $107,000 per year across all CF investments).

### Regulation A+ (Mini-IPO)

Allows companies to raise up to $75 million per year from the general public without a full SEC registration. Two tiers: Tier 1 ($20M max) and Tier 2 ($75M max). Requires an SEC qualification process.

### Blue Sky Laws

State securities laws (called "blue sky laws") require registration or exemption at the state level in addition to federal compliance. Most states have coordinated exemptions that mirror Regulation D, but notice filings and fees may be required in each state where securities are sold.

### Section 4(a)(2) — Founder-to-Founder Transactions

Sales of securities to a small number of sophisticated investors without public offering. Less structured than Rule 506(b) but also less certain. Startups typically prefer Rule 506(b) for clarity.

### Form D Filing

After any Regulation D offering, a Form D must be filed electronically with the SEC within 15 days of the first sale of securities. It discloses basic information about the offering and the company. States may also require blue sky notice filings.

### Key Securities Law Violations to Avoid

- Selling unregistered securities to the public without an exemption
- General solicitation in a 506(b) offering
- Making material misstatements or omissions in connection with a securities offering (Section 10(b), Rule 10b-5 — federal securities fraud)
- Failing to file Form D
- Paying finder's fees to unregistered broker-dealers (requires FINRA registration)
""",
    },
    {
        "id": "tax-law-startup-basics",
        "title": "Tax Law for Startups: QSBS 1202, Capital Gains, R&D Credits, Entity Taxation",
        "industry": "saas",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Tax Law for Startups and Businesses

### Federal Income Tax Overview

Individual federal income tax rates (2024): 10%, 12%, 22%, 24%, 32%, 35%, 37% on ordinary income (wages, business profits flowing through pass-through entities).

Corporate tax rate: Flat 21% on C-Corp taxable income (Tax Cuts and Jobs Act 2017).

### Capital Gains Tax

Short-term capital gains (assets held ≤1 year): Taxed at ordinary income rates (up to 37%).

Long-term capital gains (assets held >1 year): 0%, 15%, or 20% depending on taxable income. For 2024: 0% up to ~$47K single / $94K married; 15% up to ~$518K single; 20% above that.

Net Investment Income Tax (NIIT): Additional 3.8% on investment income for high earners (MAGI over $200K single / $250K married).

Qualified Opportunity Zones: Deferral and potential exclusion of capital gains by investing in Qualified Opportunity Funds (QOFs) in designated low-income census tracts.

### Qualified Small Business Stock (QSBS) — IRC Section 1202

Section 1202 is one of the most valuable tax benefits available to startup founders and early investors.

Requirements:
- Must be a C-Corporation (not S-Corp, LLC, or partnership)
- Must be a "qualified small business" — aggregate gross assets ≤ $50 million at time of issuance
- Stock must be acquired at original issuance (not on the secondary market)
- Must be held for more than 5 years
- Must be an active business (not a service business in certain excluded categories)

Benefit: Up to $10 million (or 10x the taxpayer's basis, whichever is greater) of gain from the sale of QSBS may be excluded from federal income tax. 100% exclusion for stock acquired after September 27, 2010.

Excluded business types: Service businesses in health, law, engineering, architecture, accounting, actuarial science, performing arts, consulting, athletics, financial services, brokerage services, and any business where the principal asset is the reputation or skill of one or more employees.

State conformity: California does NOT conform to Section 1202 — QSBS gain is fully taxable in California.

### R&D Tax Credit (Section 41)

The Research and Experimentation (R&E) tax credit allows companies to claim a credit (not just deduction) for qualifying research expenses.

Qualifying Research Expenses (QREs):
- Wages for employees doing qualified research
- Contractor costs (65% of payments to contractors doing qualifying research)
- Supplies used in conducting qualified research
- Cloud computing costs for R&D (after 2021 IRS guidance)

Credit amount: Generally 20% of QREs above a base amount (or 14% of QREs above 50% of the average QREs for the prior 3 years under the Alternative Simplified Credit method).

Startup benefit (Section 41(h)): Qualified small businesses (gross receipts ≤ $5M) can apply up to $500,000 per year of R&D credits against payroll taxes (not income taxes) for up to 5 years. This is extremely valuable for pre-revenue startups.

### Deductibility of Business Expenses

IRC Section 162 allows deduction of ordinary and necessary business expenses. Key deductible expenses:
- Salaries and wages
- Rent
- Business travel and meals (50% for meals; 0% for entertainment since 2018 TCJA)
- Startup costs: Up to $5,000 deductible in year 1; remainder amortized over 180 months

### Delaware Franchise Tax

Delaware C-Corps owe annual franchise tax. Two calculation methods:
- Authorized Shares Method: $175-$200,000 per year based on authorized shares
- Assumed Par Value Capital Method (APVCM): Often dramatically lower for startups — uses issued shares and total assets

Most startups with large numbers of authorized shares should use the APVCM method. The difference can be tens of thousands of dollars.

### Self-Employment Tax

Self-employment (SE) tax: 15.3% on first $160,200 of net self-employment income (2023); 2.9% above that. This covers Social Security and Medicare.

Pass-through business owners (LLC members, partners, S-Corp shareholders) may be able to reduce SE tax by:
- S-Corp election: Taking a "reasonable salary" and distributing remaining profits (which avoid SE tax)
- Guaranteed payments vs. distributive shares in partnerships
""",
    },
    {
        "id": "mergers-acquisitions",
        "title": "Mergers & Acquisitions: Asset Purchase, Stock Purchase, Due Diligence, Deal Terms",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Mergers & Acquisitions (M&A) Law

### Deal Structures

Asset Purchase:
- Buyer acquires specific assets (IP, customer contracts, equipment) and may assume specific liabilities
- Buyer can step up basis in acquired assets for depreciation purposes (tax advantage)
- Liabilities can be left behind (e.g., unknown litigation, environmental claims)
- Typically preferred by buyers
- Sellers often prefer stock purchase for tax reasons (capital gains vs. ordinary income on certain assets)
- More complex to transfer contracts (may require third-party consents)

Stock Purchase:
- Buyer acquires ownership of the legal entity (the corporation)
- All assets and liabilities (including unknown ones) transfer to buyer automatically
- No need to transfer individual contracts (continuity of the entity)
- Preferred by sellers (usually capital gains treatment)
- QSBS (Section 1202) benefits continue to run through the combined entity

Merger:
- Statutory merger: One entity absorbs another under state law
- Forward merger: Target merges into buyer; target ceases to exist
- Reverse merger (reverse triangular merger): A wholly-owned subsidiary of buyer merges into target; target survives as a subsidiary of buyer — preserves entity continuity and contracts

### Due Diligence

Buyers conduct legal, financial, and technical due diligence before closing. Key areas:
- Corporate records: Cap table, board minutes, stockholder agreements, voting agreements
- IP ownership: All IP properly assigned; no open source contamination; no third-party claims
- Material contracts: Change of control provisions, assignment restrictions, customer concentration
- Employment: Option plan, employee agreements, non-competes, pending HR issues
- Litigation: Active and threatened claims
- Tax compliance: Federal, state, and local tax returns; tax liens; transfer pricing
- Regulatory: Licenses, permits, environmental, FDA approvals
- Data room: Virtual data room (Datasite, Intralinks) contains all diligence materials

### Key M&A Terms

Letter of Intent (LOI): Non-binding letter outlining key deal terms before drafting definitive agreements. Typically binding on exclusivity (no-shop) and confidentiality.

Representations and Warranties: Seller makes factual statements about the company (no undisclosed liabilities, IP ownership, compliance with law). Breach of reps and warranties is the most common source of post-closing disputes.

Indemnification: Seller agrees to compensate buyer for losses arising from breaches of reps and warranties. Typically subject to a deductible (basket) and cap.

Representations and Warranties Insurance (RWI): Insurance that covers breaches of reps and warranties, increasingly common in deals over $50M. Allows sellers to receive clean exits.

Earnout: Part of the purchase price is contingent on the company achieving future milestones (revenue, product launches). Creates uncertainty and potential disputes post-closing.

Escrow: A portion of the purchase price (typically 10-15%) is held in escrow for 12-18 months to secure indemnification obligations.

No-Shop Provision: LOI typically includes an exclusivity period (30-60 days) during which the seller cannot solicit or negotiate with other buyers.

### Change of Control Provisions

Many contracts have change of control provisions that either (a) terminate the contract upon a change of control or (b) require consent from the counterparty. These must be identified in diligence.

Double-Trigger Acceleration: Employee equity vesting accelerates only if there is BOTH a change of control AND the employee is terminated (the "double trigger"). This is the standard and most founder-friendly approach. Single-trigger acceleration (vesting on change of control alone) is rare and dilutive.
""",
    },
    {
        "id": "saas-software-licensing",
        "title": "SaaS Agreements, Software Licensing, Subscription Terms, SLAs",
        "industry": "saas",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## SaaS and Software Licensing Law

### SaaS Agreement Structure

A SaaS agreement governs the relationship between a cloud software vendor and its customers. Key sections:

1. License Grant: "Non-exclusive, non-transferable, limited license to access and use the Service during the Subscription Term." Unlike on-premise software, customers do not own a copy — they have a license to use the hosted service.

2. Subscription Term and Auto-Renewal: Typically 12 months, auto-renewing unless notice of non-renewal is provided 30-90 days before renewal.

3. Fees and Payment: Billing cycle, payment terms (Net 30 is common for enterprise), late fees, price increase provisions.

4. Acceptable Use Policy (AUP): Prohibited uses of the service.

5. Data Ownership: Customer owns its data. Vendor has limited rights to use data to operate and improve the service. Critical provision for enterprise customers.

6. Data Security and Privacy: Vendor's security obligations, compliance with applicable privacy laws (GDPR, CCPA), incident notification timelines.

7. Uptime SLA and Service Credits: Uptime commitment (typically 99.9% = ~8.7 hours downtime/year or 99.95% = ~4.4 hours). Service credits (not actual damages) for downtime. Exclusions for scheduled maintenance.

8. Intellectual Property: Vendor retains all IP in the service. Customer retains all IP in customer data. Vendor may use aggregated, anonymized data.

9. Confidentiality: Both parties agree to protect confidential information.

10. Limitation of Liability: Cap on vendor's total liability (typically 12 months of fees paid). Exclusion of consequential, indirect, and punitive damages.

11. Indemnification: Vendor indemnifies customer for IP infringement claims against the service. Customer indemnifies vendor for misuse of the service.

12. Termination: For convenience (usually with 30-day notice), for cause (uncured material breach), for insolvency. Effect of termination: data export window, cessation of access.

### Enterprise SaaS Negotiations

Enterprise customers typically push for:
- Uncapped liability (reject standard 12-month cap)
- Audit rights for security and compliance
- Source code escrow (right to access code if vendor goes out of business)
- BAA for HIPAA-covered data
- DPA for GDPR/CCPA compliance
- Higher SLA uptime percentages and cash credits (not just service credits)
- Custom data retention and deletion schedules

### On-Premise Software License

For traditional on-premise software:
- Perpetual license: One-time fee for perpetual use of a specific version
- Annual maintenance and support: Ongoing fees for updates and technical support
- Per-seat, site, or enterprise licensing
- Source code escrow: Common for mission-critical software

### Open Source Software Considerations

Before incorporating open source software, evaluate the license:
- Permissive (MIT, Apache 2.0, BSD): Use in commercial software with minimal restrictions (attribution required)
- Weak copyleft (LGPL, MPL): May allow linking without triggering copyleft
- Strong copyleft (GPL, AGPL): If you distribute software incorporating GPL code, you must release your source code under GPL. AGPL extends this to network use (important for SaaS)

Due diligence tip: Open source usage must be disclosed in M&A due diligence. Undisclosed GPL/AGPL in commercial code can kill a deal.

### API Terms of Service

APIs (Application Programming Interfaces) are governed by API Terms of Service or Developer Agreements:
- Rate limits and quota restrictions
- Permitted use cases and prohibited uses
- Attribution requirements
- No reverse engineering or competitive use
- API keys are non-transferable
""",
    },
    {
        "id": "corporate-governance-fiduciary",
        "title": "Corporate Governance: Fiduciary Duties, Board Meetings, Shareholder Rights",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Corporate Governance and Fiduciary Duties

### Fiduciary Duties of Directors

Directors of a corporation owe fiduciary duties to the corporation and its shareholders. Under Delaware law, the primary duties are:

Duty of Care:
- Directors must act with the care that a person in a like position would reasonably believe appropriate under similar circumstances
- Directors must be informed — they must review relevant materials and ask questions before voting
- Business Judgment Rule: Courts presume directors act in good faith and in the best interests of the corporation. A director who follows the BJR is protected from personal liability even if the decision turns out poorly.

Duty of Loyalty:
- Directors must act in the best interests of the corporation, not their own personal interests
- Requires disclosure and often shareholder approval for transactions in which a director has a personal interest (interested director transactions)
- Corporate opportunities doctrine: Directors cannot usurp opportunities that belong to the corporation

Duty of Confidentiality: Directors must maintain the confidentiality of board deliberations.

### Business Judgment Rule (BJR)

The BJR protects directors from personal liability for business decisions if they:
1. Act in good faith
2. Are reasonably informed about the decision
3. Have no personal financial interest in the outcome (if interested, special procedures apply)

The BJR is a cornerstone of Delaware corporate law and the reason Delaware is the preferred state of incorporation.

### Board Meetings and Consent Actions

Formal board meetings require:
- Proper notice (typically 24-72 hours unless waived)
- Quorum (typically a majority of directors)
- Minutes documenting resolutions

In lieu of a formal meeting, boards can take action by Unanimous Written Consent (UWC) — all directors sign a written consent approving a resolution. UWCs are common for routine actions (option grants, officer appointments).

### Protective Provisions (Preferred Stock Rights)

Venture-backed preferred stockholders typically have the right to approve (veto) certain major corporate actions:
- Amendments to the certificate of incorporation
- Issuance of new securities senior to or pari passu with preferred
- Changes to the number of directors
- Liquidation, dissolution, or winding up
- Merger or acquisition
- Incurrence of debt above a threshold

### Shareholder Rights

Inspection rights: Under Delaware law (§220), stockholders may inspect books and records for a proper purpose. Used by activist investors to investigate potential wrongdoing.

Appraisal rights: In certain mergers, stockholders who vote against a merger may seek judicial appraisal of the "fair value" of their shares instead of accepting the merger consideration.

Tag-along rights: Minority shareholders have the right to participate in a sale of shares by a majority shareholder on the same terms.

Drag-along rights: Majority shareholders (or preferred stockholders) can require minority shareholders to approve and participate in a sale of the company.

### Indemnification of Directors and Officers

Corporations can (and typically must under their bylaws) indemnify directors and officers for legal expenses and judgments arising from their service to the corporation.

D&O Insurance (Directors & Officers Insurance): Insurance policy that covers defense costs and damages for claims against directors and officers. Should be obtained before any Series A financing. VCs typically require D&O coverage as a condition to investment.

### Special Committee

When a board has conflicted directors (e.g., in a going-private transaction or acquisition by a controlling shareholder), a special committee of independent directors may be formed to negotiate the transaction at arm's length. The use of a special committee and independent legal counsel is critical to maintaining the BJR protection.
""",
    },
    {
        "id": "fintech-financial-regulation",
        "title": "FinTech & Financial Regulation: Money Transmitters, Banking, AML, Payments",
        "industry": "fintech",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## FinTech and Financial Services Regulation

### Money Transmission

A Money Transmitter (or Money Services Business — MSB) is any entity that transmits money or monetary value on behalf of others. If your FinTech product holds, transfers, or pays out money, you may be a money transmitter.

Federal registration: Money transmitters must register with FinCEN (Financial Crimes Enforcement Network) as an MSB.

State licensing: Money transmitters must obtain a Money Transmitter License (MTL) in each state where they operate. As of 2024, most states require MTLs (California, New York, Texas, etc.). New York's BitLicense specifically covers virtual currency businesses.

MTL applications require: Surety bonds, proof of capital adequacy, background checks on principals, compliance program documentation, and fees. The process takes 6-18 months per state.

Exemptions: Banks, bank subsidiaries, and certain agent relationships may be exempt from MTL requirements. Payment processors (card networks) operating under a bank's license may also avoid MTLs.

### Bank Secrecy Act (BSA) and Anti-Money Laundering (AML)

The BSA (31 USC § 5311 et seq.) requires financial institutions and MSBs to:
- Maintain an AML program with written policies, procedures, and controls
- Designate a compliance officer (BSO — Bank Secrecy Act Officer)
- Conduct ongoing employee training
- File Currency Transaction Reports (CTRs) for cash transactions over $10,000
- File Suspicious Activity Reports (SARs) for suspicious transactions over $5,000

Know Your Customer (KYC): Financial institutions must verify customer identity, beneficial ownership, and assess money laundering risk. FinCEN's Customer Due Diligence (CDD) rule (2018) requires beneficial ownership information for legal entity customers.

### Payment Card Industry (PCI DSS)

Any business that stores, processes, or transmits credit card data must comply with PCI Data Security Standards:
- Encrypt cardholder data in transit and at rest
- Maintain secure networks and systems
- Restrict physical and logical access to cardholder data
- Regularly test security systems

Best approach for startups: Use Stripe, Square, or Braintree to minimize PCI scope by never handling raw card data.

### Banking as a Service (BaaS) and Bank Charters

FinTechs can offer banking-like products without a bank charter by partnering with an FDIC-insured bank (BaaS model). The bank is the regulated entity; the FinTech is the technology and distribution layer. Key partners: Sutton Bank, Evolve Bank, Cross River Bank, Blue Ridge Bank.

Advantages: No charter required, faster to market.
Risks: Regulatory pressure on bank partners; if the bank exits, the FinTech loses its license to operate.

National bank charters: Some FinTechs (Square, Varo) have obtained Industrial Loan Company (ILC) charters or de novo bank charters. Provides direct FDIC insurance and preemption of state money transmitter laws but requires substantial capital and ongoing regulatory supervision.

### Securities and Investment Regulations

Registered Investment Adviser (RIA): Any FinTech providing investment advice for compensation must register as an RIA with the SEC (for AUM > $100M) or state securities regulators. Robo-advisors are typically RIAs.

Broker-Dealer Registration (FINRA): Any entity that buys and sells securities as a business for the account of customers must register as a broker-dealer with FINRA. Equity crowdfunding portals operating under Reg CF must register as funding portals with FINRA.

### Cryptocurrency and Digital Assets

The regulatory status of cryptocurrencies in the US is uncertain:
- The SEC views many tokens as securities (subject to registration or Reg D exemptions) under the Howey Test
- The CFTC views Bitcoin and Ether as commodities
- FinCEN treats crypto exchanges as MSBs

Key compliance: Crypto exchanges and wallet providers operating in the US must register with FinCEN as MSBs, implement AML/KYC programs, and comply with state MTL requirements.
""",
    },
    {
        "id": "immigration-law-startups",
        "title": "Immigration Law for Businesses: H-1B, O-1A, E-2, L-1, Startup Founders",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## US Immigration Law for Businesses and Startups

### H-1B Visa (Specialty Occupation)

The H-1B is the most common work visa for tech companies. It allows employers to sponsor foreign workers in "specialty occupations" (typically requiring a bachelor's degree or higher in a specific field).

Key facts:
- Annual cap: 85,000 visas per year (65,000 regular cap + 20,000 for US master's degree holders)
- Lottery system: Applications submitted in April for October 1 start date; USCIS conducts a random lottery due to high demand
- Duration: 3 years initial + 3-year extension; can extend further if green card is pending
- Employer-sponsored: The company files the petition; the visa is tied to the employer
- H-1B portability: Once in H-1B status, workers can change employers with an H-1B transfer while the new petition is pending

Costs: $5,000-$15,000 in filing fees and attorney fees per petition.

Cap-exempt employers: Universities, nonprofit research institutions, and government research organizations are exempt from the H-1B cap.

### O-1A Visa (Extraordinary Ability)

The O-1A is for individuals of extraordinary ability in sciences, education, business, or athletics. It is increasingly used by startup founders and engineers who cannot wait for the H-1B lottery.

Standard: Must demonstrate "extraordinary ability" through sustained national or international acclaim. Criteria include:
- Prizes or awards for excellence in the field
- Membership in associations requiring outstanding achievement
- Published material about the person's work
- Critical role for organizations with distinguished reputations
- High salary relative to others in the field
- Original contributions of major significance

Advantages: No cap or lottery; faster processing; renewable in 1-year increments; self-petition possible (important for startup founders).

### National Interest Waiver (NIW) for EB-2 Green Card

The NIW allows individuals of exceptional ability or advanced degree holders to self-petition for a green card without a job offer or labor certification, if their work is in the national interest.

Particularly useful for: Researchers, scientists, engineers, entrepreneurs with businesses serving the national interest.

### E-2 Treaty Investor Visa

For nationals of treaty countries who invest substantial capital in a US business they will direct and develop. The business must be active (not a passive investment) and have a real economic impact.

Investment threshold: "Substantial" is relative — typically $100,000+ but no fixed minimum. Must be at risk.

Not a path to a green card: E-2 does not directly lead to permanent residence. Treaty nationals from countries without E-2 treaties (India, China) cannot use this visa.

### L-1 Intracompany Transferee

For multinational companies transferring executives, managers, or specialized knowledge employees from a foreign affiliate to the US entity.

- L-1A (executives and managers): Allows EB-1C green card sponsorship, which has no per-country cap
- L-1B (specialized knowledge): More difficult to prove; limited to 5 years total

### Startup Founder Visa Options

There is no dedicated "startup visa" in the US (unlike many other countries). Options for foreign-born founders:
- O-1A: Most common path; requires demonstrating extraordinary ability
- E-2: For investors from treaty countries with sufficient capital
- H-1B: Must be sponsored by the company; founder cannot self-petition
- EB-1A: Self-petitioned green card for individuals of extraordinary ability (higher bar than O-1A)
- International Entrepreneur Rule (IER): Allows foreign entrepreneurs with at least 10% ownership in a US startup that received $264,000+ in government awards or qualified investments to receive parole (not a visa) for 2.5 years (extendable). DHS administers this rule and implementation has been inconsistent.

### Employment Verification (Form I-9)

Every employer must verify each employee's identity and authorization to work in the US using Form I-9 within 3 business days of hire. Failure to complete I-9s properly can result in civil penalties of $272-$2,701 per form for paperwork violations; criminal penalties for knowingly hiring unauthorized workers.

E-Verify: Electronic system for verifying work authorization. Required for federal contractors and some states (Arizona, Alabama, others).
""",
    },
    {
        "id": "antitrust-competition-law",
        "title": "Antitrust Law: Sherman Act, Clayton Act, Merger Review, Price Fixing",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Antitrust and Competition Law

### Key Antitrust Statutes

Sherman Antitrust Act (1890):
- Section 1: Prohibits contracts, combinations, and conspiracies in restraint of trade. Requires two or more actors (cannot be a unilateral business decision).
- Section 2: Prohibits monopolization, attempted monopolization, and conspiracies to monopolize.

Clayton Antitrust Act (1914): Addresses specific practices that may substantially lessen competition or tend to create a monopoly, including mergers, exclusive dealing, and tying arrangements.

FTC Act Section 5: The FTC can challenge "unfair methods of competition" — broader than Sherman Act and can reach anticompetitive conduct that might not meet the Sherman Act standard.

### Per Se Violations (Always Illegal)

Certain agreements between competitors are per se illegal — no business justification can save them:
- Horizontal price fixing: Competitors agreeing on prices
- Market allocation: Competitors agreeing not to compete in each other's territories or for each other's customers
- Group boycotts: Competitors agreeing not to do business with a third party
- Bid rigging: Competitors coordinating on bids for contracts

Criminal penalties: Price fixing and bid rigging are federal crimes. Individuals can face up to 10 years in prison and $1 million fines; corporations face fines up to $100 million (or twice the gain or loss).

### Rule of Reason Analysis

Most vertical restraints (manufacturer to distributor) and some horizontal restraints are analyzed under the "rule of reason" — courts balance procompetitive effects against anticompetitive harms. Relevant market definition and market power are key factors.

### Merger Review (Hart-Scott-Rodino)

The Hart-Scott-Rodino (HSR) Act requires pre-merger notification to the DOJ and FTC for transactions that meet size thresholds. In 2024, the filing threshold is approximately $119 million (adjusted annually). If both parties have at least $23.8M in assets/revenues and the deal exceeds the threshold, pre-merger filing is required.

HSR filing: Both parties file detailed information about their businesses and the transaction. The government has 30 days to investigate (or 30 days after substantial compliance with a Second Request for more information).

DOJ vs. FTC: Either the Department of Justice Antitrust Division or the FTC reviews a given deal based on industry experience. Both agencies can sue to block a merger.

### Monopolization (Section 2)

To violate Section 2, a company must: (1) have monopoly power in the relevant market (generally 70%+ market share) AND (2) willfully acquire or maintain that power through exclusionary conduct (as opposed to superior product, business acumen, or historical accident).

Examples of exclusionary conduct: Exclusive dealing agreements that foreclose competitors, predatory pricing below cost, tying arrangements, and denial of essential facilities.

### Digital Markets and Tech Antitrust

Recent enforcement focus on tech platforms:
- Self-preferencing: Platforms preferring their own products in results (e.g., Google Shopping)
- Vertical integration: Acquisitions that eliminate potential competition (e.g., Instagram, WhatsApp acquisitions)
- API and data access: Denying competitors access to APIs or data that is essential to competition
- App store restrictions: Apple and Google app store policies under scrutiny in US and EU

The European Union's Digital Markets Act (DMA) (effective 2024) designates "gatekeepers" (large platforms) with specific obligations to ensure contestability.

### Practical Antitrust Compliance

Startup considerations:
- Non-solicitation agreements with competitors' employees can raise antitrust concerns (no-poach agreements between competitors are per se illegal under recent DOJ guidance)
- Participation in trade associations: Do not share competitively sensitive information (pricing, capacity) with competitors in any setting
- Merger defense: Early filing of HSR and a clean record of competitive conduct reduce risk of extended investigation
""",
    },
    {
        "id": "bankruptcy-fundamentals",
        "title": "Bankruptcy Law: Chapter 7, Chapter 11, Chapter 13, Automatic Stay",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## US Bankruptcy Law

### Overview of Bankruptcy

Bankruptcy is a federal legal process (11 USC — the Bankruptcy Code) that allows individuals and businesses to discharge or restructure debt when they cannot pay their creditors. Bankruptcy cases are filed in federal bankruptcy courts.

### Chapter 7 — Liquidation

Individual or business: Can be used by both individuals and businesses.

For individuals: The bankruptcy trustee liquidates non-exempt assets, distributes proceeds to creditors, and the debtor receives a discharge of most unsecured debts (credit cards, medical bills, personal loans) within 3-6 months. Exempt assets vary by state (primary home up to a homestead exemption, retirement accounts, vehicle).

For businesses: Assets are liquidated and the business ceases to exist. No discharge for corporations (they cease to exist after liquidation).

Means test: Individuals with income above the state median must pass a means test to qualify for Chapter 7.

Non-dischargeable debts: Alimony, child support, most student loans, criminal fines, recent tax debts, debts incurred through fraud.

### Chapter 11 — Business Reorganization

Chapter 11 allows a business (or high-debt individual) to continue operating while restructuring its debts under a court-approved Plan of Reorganization.

Debtor-in-Possession (DIP): The company remains in control of operations as a "debtor-in-possession" unless a trustee is appointed (rare, usually for fraud).

Key features:
- Automatic Stay: All collection actions against the debtor and its assets are immediately halted upon filing
- DIP Financing: New debt that has super-priority status (paid before pre-petition creditors) — allows the business to continue operations
- Rejection of Contracts: The debtor can reject burdensome contracts and unexpired leases
- Plan of Reorganization: Must be approved by creditors (voting by class) and confirmed by the court

Timeline: Chapter 11 can last 6 months to several years. Small Business Subchapter V (since 2019) provides a faster, cheaper restructuring process for businesses with under $7.5 million in debt.

Pre-packaged bankruptcy: Creditors vote on the reorganization plan before filing — allows a faster, cheaper process (30-60 days in court vs. 12+ months).

### Chapter 13 — Individual Repayment Plan

For individuals with regular income who want to keep assets (like a home) by repaying debts over 3-5 years. Maximum debt limits apply (approximately $2.75M combined secured and unsecured).

### The Automatic Stay

Upon filing bankruptcy, an automatic stay (11 USC § 362) immediately stops:
- Foreclosure proceedings
- Collection calls and lawsuits
- Wage garnishments
- Repossession of property

Creditors who violate the automatic stay can be sanctioned by the court.

### Priority of Claims

In bankruptcy, creditors are paid in a specific order:
1. Secured creditors (up to the value of their collateral)
2. Administrative expenses (DIP financing, trustee fees, professional fees)
3. Priority unsecured claims (wages owed to employees up to $15,150; recent taxes)
4. General unsecured creditors (trade creditors, suppliers)
5. Equity holders (shareholders — often receive nothing)

### Preference Payments

The trustee can "claw back" certain payments made by the debtor in the 90 days before bankruptcy (or 1 year for insiders) if the payment gave the creditor more than they would have received in liquidation. Common preference targets: large payments to vendors, early repayment of loans.

Startups receiving payments from customers in financial distress should be aware they may face preference claims if the customer later files for bankruptcy.
""",
    },
    {
        "id": "international-business-export",
        "title": "International Business: Export Controls, FCPA, Transfer Pricing, OFAC Sanctions",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## International Business Law and Compliance

### Export Control Laws

The US has two primary export control regimes:

Export Administration Regulations (EAR) — administered by the Commerce Department's Bureau of Industry and Security (BIS):
- Controls commercial items, technology, and software with potential dual-use (civilian and military) applications
- Items are classified on the Commerce Control List (CCL) by Export Control Classification Number (ECCN)
- License required to export controlled items to restricted countries, entities on restricted lists, or for restricted end-uses
- EAR99: Items that don't require a license for most destinations

International Traffic in Arms Regulations (ITAR) — administered by the State Department:
- Controls defense articles and services listed on the United States Munitions List (USML)
- Any manufacturer, exporter, or broker of defense articles must register with the State Department's Directorate of Defense Trade Controls (DDTC)
- Foreign persons cannot access ITAR-controlled technical data without a license — applies even within the US (deemed export rule)

Penalties: Criminal penalties up to 20 years imprisonment and $1M per violation; civil penalties up to $1.3M per violation.

Software and AI considerations: Encryption software (EAR 5E002) and AI/ML technology may be subject to export controls. Cloud services providing access to controlled technology to foreign persons may require export licenses.

### OFAC Sanctions

The Office of Foreign Assets Control (OFAC) administers US economic sanctions against countries, entities, and individuals. Doing business with Specially Designated Nationals (SDNs) is prohibited regardless of where the transaction occurs.

Key sanctions programs: Cuba, Iran, North Korea, Syria, Russia (expanded post-2022), Crimea/Donetsk/Luhansk regions.

Compliance requirements:
- Screen all customers, counterparties, and employees against the SDN List and other OFAC lists
- Do not process transactions involving sanctioned parties
- No geographic IP or bank filtering can fully replace OFAC screening

Penalties: Civil penalties up to $1M per transaction; criminal penalties up to $20M and 30 years imprisonment for willful violations.

### Foreign Corrupt Practices Act (FCPA)

The FCPA prohibits US persons (individuals and entities) and companies listed on US exchanges from:
1. Bribing foreign government officials (anti-bribery provisions)
2. Failing to maintain accurate books and records reflecting transactions (accounting provisions)

Key elements:
- "Government officials" includes employees of state-owned enterprises (SOEs) — common in China, Brazil, and other markets
- "Anything of value" includes gifts, entertainment, and charitable contributions
- Third-party liability: Companies can be liable for bribes paid by agents, distributors, or joint venture partners if they knew or had red flags

FCPA compliance program: Written anti-corruption policy, training, due diligence on business partners, robust accounting controls, and escalation procedures.

Penalties: Criminal fines up to $2 million per violation for companies; up to $100,000 and 5 years imprisonment per violation for individuals. The DOJ and SEC share enforcement authority.

### Transfer Pricing

When related entities (parent/subsidiary, affiliates) transact with each other, they must use "arm's length" pricing — the price that unrelated parties would agree to under similar circumstances. IRS regulations (IRC § 482) and OECD guidelines govern transfer pricing.

Documentation: Companies must maintain contemporaneous transfer pricing documentation supporting their pricing policies. Penalties for underpayment due to transfer pricing: 20-40% of underpaid taxes.

### International Contracts

Key issues in cross-border contracts:
- Choice of law: Which country's law governs?
- Choice of forum: Where are disputes resolved? (Arbitration is commonly preferred for international disputes — ICC, SIAC, AAA)
- Force majeure: Events (pandemic, war, natural disaster) that excuse performance
- Currency: Which currency? What happens to currency fluctuation risk?
- Import/export restrictions: Customs duties, tariffs, and trade restrictions
""",
    },
    {
        "id": "environmental-law-basics",
        "title": "Environmental Law: EPA Regulations, CERCLA, Clean Air Act, ESG",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## US Environmental Law

### Federal Environmental Statutes

Clean Air Act (CAA): Regulates air pollutants from stationary and mobile sources. The EPA establishes National Ambient Air Quality Standards (NAAQS) for pollutants like ozone, particulate matter, SO2, CO, NOx. Businesses operating facilities that emit air pollutants may need state air quality permits.

Clean Water Act (CWA): Regulates discharge of pollutants into navigable waters of the US. Facilities discharging pollutants need an NPDES (National Pollutant Discharge Elimination System) permit. Stormwater management programs required for certain facilities.

Resource Conservation and Recovery Act (RCRA): Governs generation, transportation, treatment, storage, and disposal of hazardous waste. Generators of hazardous waste must track, label, store, and dispose of waste properly.

Toxic Substances Control Act (TSCA): The EPA can require testing and regulate the manufacture, import, and distribution of chemical substances and mixtures.

### Comprehensive Environmental Response, Compensation, and Liability Act (CERCLA / Superfund)

CERCLA creates strict, joint and several liability for cleanup of contaminated sites. Potentially Responsible Parties (PRPs) include:
- Current owners and operators of contaminated facilities
- Past owners/operators at the time of disposal
- Generators who sent hazardous waste to the site
- Transporters who selected the disposal site

Key feature: Joint and several liability — each PRP can be held responsible for the entire cleanup cost, even if their contribution was minor. PRPs can then seek contribution from other PRPs.

Environmental due diligence in M&A:
- Phase I Environmental Site Assessment: Historical review, records search, site inspection to identify recognized environmental conditions (RECs). No sampling.
- Phase II ESA: Soil, groundwater, or building sampling to confirm or deny RECs identified in Phase I.
- Innocent Landowner Defense: Buyers who conduct appropriate All Appropriate Inquiries (AAI — Phase I + Phase II) and did not contribute to contamination may qualify for CERCLA liability protection.

### Environmental Permitting

Most businesses that emit air pollutants, discharge water, or generate hazardous waste need environmental permits. Permits are primarily issued by state environmental agencies (often delegated by EPA). Operating without required permits is a serious violation.

### ESG (Environmental, Social, and Governance)

ESG refers to the three central factors in measuring the sustainability and societal impact of a business. Key legal developments:
- SEC climate disclosure rules (proposed/finalized): Public companies may be required to disclose material climate risks and Scope 1, 2, and 3 greenhouse gas emissions
- EU Corporate Sustainability Reporting Directive (CSRD): Mandatory ESG reporting for large companies and EU subsidiaries of global companies
- Greenwashing claims: The FTC Green Guides regulate environmental marketing claims; false environmental claims can constitute deceptive advertising
- Supply chain due diligence: Several states (California Transparency in Supply Chains Act) and the EU require disclosure of supply chain human rights and environmental due diligence

### Environmental Compliance for Tech Companies

Tech companies often overlook:
- E-waste regulations: Computers, phones, and electronics must be disposed of according to state e-waste laws
- Data center energy and water use disclosures (SEC ESG reporting)
- Chemical substances in products (TSCA, EU RoHS — Restriction of Hazardous Substances in electronics)
- Renewable energy certificates (RECs) and carbon offset claims must be substantiated to avoid greenwashing liability
""",
    },
    {
        "id": "consumer-credit-law",
        "title": "Consumer Credit Law: FCRA, ECOA, TILA, FDCPA, Fair Lending",
        "industry": "fintech",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Consumer Credit and Fair Lending Law

### Fair Credit Reporting Act (FCRA)

The FCRA regulates how consumer reporting agencies (CRAs — Equifax, Experian, TransUnion) collect, use, and share consumer credit information.

Key obligations for businesses using consumer reports:
- Permissible purpose: Can only pull a consumer credit report for permissible purposes (credit application, employment with consent, insurance underwriting, account review)
- Adverse action notices: If you take adverse action (deny credit, increase rates, reduce credit limit) based in whole or in part on a credit report, you must provide an adverse action notice to the consumer within specific timeframes. The notice must identify the CRA, state the consumer's right to a free report, and state the right to dispute inaccurate information.
- Furnisher obligations: If you report consumer account information to credit bureaus, you must maintain accuracy and investigate disputes within 30 days.

FCRA penalties: Actual damages, statutory damages ($100-$1,000 per violation), and punitive damages for willful violations. Class action risk.

### Equal Credit Opportunity Act (ECOA)

ECOA prohibits discrimination in any aspect of a credit transaction (application, underwriting, terms, collection) based on race, color, religion, national origin, sex, marital status, age, or receipt of public assistance.

Adverse action requirements: When credit is denied or terms are less favorable, lenders must provide specific reasons for the denial or adverse action.

Regulation B (implementing ECOA): Covers application procedures, evaluation of creditworthiness, notification requirements, and record retention.

Disparate impact: Even facially neutral credit policies that have a disproportionate negative impact on a protected class can violate ECOA, unless the business can show a business necessity for the practice.

### Truth in Lending Act (TILA)

TILA (Regulation Z) requires clear disclosure of credit terms to consumers before they are obligated to pay.

Key disclosures: Annual Percentage Rate (APR), total amount financed, total finance charge, and total payment amount.

Right of rescission: For certain home equity loans and refinances (not purchase mortgages), borrowers have a 3-business-day right to rescind the transaction.

Credit card disclosures: Card issuers must disclose interest rates, fees, and the consequences of making only minimum payments.

### Fair Debt Collection Practices Act (FDCPA)

The FDCPA regulates third-party debt collectors (not original creditors) collecting consumer debts.

Prohibited practices:
- Calling before 8am or after 9pm
- Harassment, threats, or use of profane language
- False or misleading representations (cannot misrepresent the amount owed or the consequences of non-payment)
- Communicating with third parties about the debt (with limited exceptions)
- Contacting consumer at work if employer prohibits it

Validation notice: Debt collectors must send a written validation notice within 5 days of initial contact, stating the amount of the debt and the consumer's right to dispute it.

Penalties: Actual damages, statutory damages up to $1,000 per case, class action statutory damages up to $500,000.

### Community Reinvestment Act (CRA)

The CRA encourages banks to meet the credit needs of all segments of their communities, including low- and moderate-income areas. Banks are evaluated on CRA performance during regulatory examinations. CRA performance is considered in applications for bank charters, mergers, and branch openings.

### Mortgage Lending Regulations

Home Mortgage Disclosure Act (HMDA): Requires mortgage lenders to collect and report data on mortgage applications, loan originations, and denials to help identify discriminatory lending patterns.

RESPA: Regulates the settlement process for federally-related mortgage loans, prohibiting kickbacks and requiring disclosures.

Qualified Mortgage (QM) Rule: CFPB rules define "qualified mortgages" — loans with certain features (no negative amortization, no interest-only, debt-to-income ≤43%) that receive a safe harbor from ability-to-repay liability.
""",
    },
    {
        "id": "digital-health-ai-regulation",
        "title": "Digital Health AI Regulation: FDA Software, Clinical Decision Support, SaMD",
        "industry": "healthcare",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Digital Health and AI Regulatory Law

### FDA Regulation of Software as a Medical Device (SaMD)

The FDA regulates software that meets the definition of a medical device under the Federal Food, Drug, and Cosmetic Act (FD&C Act). A medical device is any instrument, apparatus, implement, machine, contrivance, implant, or other similar article intended to:
(1) diagnose, cure, mitigate, treat, or prevent disease, or
(2) affect the structure or function of the body

SaMD (Software as a Medical Device): Software that qualifies as a medical device but is not part of a hardware device.

Examples of regulated SaMD:
- AI algorithms that detect cancer from radiological images
- Software that interprets ECGs to detect arrhythmias
- Apps that diagnose diabetic retinopathy from photographs
- Clinical decision support software that calculates medication dosing based on patient vitals

Examples of NON-regulated software (21st Century Cures Act exemptions):
- Electronic health records (EHR/EMR) software
- Administrative functions (billing, scheduling)
- General wellness apps (diet, fitness, sleep tracking) that do not make disease claims
- Clinical decision support software that displays, transfers, or stores data WITHOUT interpreting it (i.e., the clinician makes the decision, not the software)

### FDA Device Classification

Class I (low risk): Devices subject only to general controls; most are exempt from premarket review.
Class II (moderate risk): Devices subject to general controls and special controls; typically cleared via 510(k) premarket notification.
Class III (high risk): Life-sustaining/supporting devices; requires Premarket Approval (PMA) — the most rigorous pathway.

510(k) Clearance: A company demonstrates that its device is "substantially equivalent" to a legally marketed predicate device. Most SaMD seeks 510(k) clearance.

De Novo Classification: For novel low-to-moderate risk devices that lack a predicate. Creates a new regulatory classification that can serve as a predicate for future 510(k)s.

Pre-Submission (Q-Sub) Meeting: Companies can request an FDA meeting before submitting to get informal feedback on regulatory pathway and study requirements.

### FDA's Approach to AI/ML in SaMD

FDA's AI/ML Action Plan (2021) and proposed regulation address the unique challenge of AI/ML that continuously learns and changes from real-world use:
- Predetermined Change Control Plan (PCCP): Companies pre-specify the types of modifications they will make to their AI algorithm and how performance will be monitored, allowing changes without requiring a new 510(k) for each update
- Transparency and explainability: FDA expects documentation of training data, algorithm performance, and limitations
- Real-world performance monitoring: Post-market surveillance requirements for AI that may degrade or drift over time

### Clinical Decision Support (CDS) Software

The 21st Century Cures Act and FDA's CDS guidance distinguish between regulated and non-regulated CDS:

Non-regulated CDS (four criteria must ALL be met):
1. Not intended to acquire, process, or analyze a medical image or signal from an in vitro diagnostic device
2. Displays, analyzes, or prints medical information generally available to the HCP
3. Supports or provides recommendations to an HCP rather than replacing HCP judgment
4. Displays the basis for each recommendation so the HCP can independently review it

If the software does NOT display the basis for its recommendation (black-box AI), it does NOT qualify as non-regulated CDS, even if a human clinician makes the final decision.

### State Digital Health Laws

Telemedicine: Each state regulates independently. Key issues:
- Licensure: Physicians must generally be licensed in the state where the patient is located
- Prescribing: Many states prohibit prescribing without a prior patient-provider relationship or physical examination
- PSYPACT and interstate compacts: Allow licensed professionals to practice across member states

AI in Healthcare: Illinois, New York, and other states have enacted or proposed laws requiring disclosure when AI is used in clinical decision-making.
""",
    },
    {
        "id": "real-estate-investing-law",
        "title": "Real Estate Investment Law: REITs, 1031 Exchange, Opportunity Zones, Syndications",
        "industry": "real_estate",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Real Estate Investment Law

### Real Estate Investment Trusts (REITs)

A REIT is a company that owns, operates, or finances income-producing real estate. REITs allow investors to access real estate returns without directly owning property.

To qualify as a REIT, a company must meet IRS requirements:
- 75% of total assets in real estate-related assets
- 75% of gross income from real estate-related sources (rents, mortgage interest)
- Distribute at least 90% of taxable income to shareholders annually as dividends
- At least 100 shareholders; no five shareholders owning more than 50% of shares

Tax advantage: REITs are not taxed at the entity level (no double taxation) if they distribute 90%+ of taxable income.

Types: Equity REITs (own property), Mortgage REITs (hold mortgages), Hybrid REITs.

Private REITs: REITs that are not publicly traded. Often sold through broker-dealers to accredited investors under Regulation D.

### 1031 Like-Kind Exchange (Tax-Deferred Exchange)

Section 1031 of the Internal Revenue Code allows investors to defer capital gains taxes when selling investment property by reinvesting the proceeds into a like-kind replacement property.

Rules for a valid 1031 exchange:
- Both properties must be held for investment or productive use in a trade or business (not primary residence)
- Both properties must be in the US
- The replacement property must be identified within 45 days of closing the relinquished property
- The replacement property must be acquired within 180 days of closing
- A qualified intermediary (QI) must hold the proceeds — the investor cannot receive the cash

Reverse exchange: Acquiring the replacement property before selling the relinquished property. Allowed under Revenue Procedure 2000-37 but more complex.

### Qualified Opportunity Zones (QOZ)

Created by the Tax Cuts and Jobs Act of 2017 to encourage investment in low-income census tracts designated by the Treasury Department.

Tax benefits for investing capital gains in a Qualified Opportunity Fund (QOF):
- Deferral: Capital gains invested in a QOF within 180 days are deferred until December 31, 2026 or when the QOF investment is sold, whichever is earlier
- Step-up in basis: If the QOF investment is held for 5 years before December 31, 2026, the basis increases by 10% (this benefit has largely expired by 2024 given the December 2026 deadline)
- Exclusion: If the QOF investment is held for 10+ years, the gains on the QOF investment itself (not the deferred gain) are excluded from federal income tax entirely

QOF compliance: Must hold 90%+ of assets in Qualified Opportunity Zone Property (QOZP). Harsh penalties for non-compliance.

### Real Estate Syndications

A real estate syndication pools capital from multiple investors to acquire and operate a real estate asset.

Legal structure: Typically an LLC with investors as limited liability members and a sponsor (syndicator) as the managing member or manager.

Securities law compliance: Interests in real estate syndications are securities. Most syndications rely on Regulation D Rule 506(b) (up to 35 non-accredited investors; no general solicitation) or Rule 506(c) (accredited investors only; general solicitation allowed).

Offering documents:
- Private Placement Memorandum (PPM): Discloses the investment opportunity, risks, and terms
- Operating Agreement: Governs the LLC and investor rights
- Subscription Agreement: Each investor's agreement to purchase the interest

Sponsor economics:
- Acquisition fee: 1-3% of purchase price
- Asset management fee: 1-2% of equity or revenue annually
- Waterfall: Preferred return to investors (e.g., 8% cumulative), then profit splits (e.g., 70/30 LP/GP)

### Passive Activity Rules

The IRS passive activity rules (Section 469) limit the ability of passive investors to offset passive losses against active income (wages, business profits).

Real estate professional status: A taxpayer who qualifies as a real estate professional (more than 750 hours/year materially participating in real property trades or businesses, AND more than 50% of personal service time in real property) can treat real estate losses as active losses, deductible against ordinary income. This is a significant tax planning strategy.

Short-term rental exception: Rental activities with an average rental period of 7 days or less (e.g., Airbnb properties) are not subject to the passive activity rules if the owner materially participates.
""",
    },
    {
        "id": "agency-employment-liability",
        "title": "Agency Law, Vicarious Liability, Independent Contractors, Gig Economy",
        "industry": "general",
        "document_type": "legal_guide",
        "jurisdiction": "US",
        "content": """
## Agency Law and Vicarious Liability

### Agency Fundamentals

An agency relationship exists when one person (the agent) acts on behalf of and subject to the control of another (the principal), and the principal consents to this arrangement.

Types of authority:
- Actual authority: Expressly granted (written or oral) or implied from the principal's conduct
- Apparent authority: Authority that a third party reasonably believes the agent has, even if the principal did not actually grant it. The principal is bound if they created the appearance of authority.
- Ratification: The principal adopts an agent's unauthorized act after the fact, creating authority retroactively.

### Vicarious Liability (Respondeat Superior)

A principal (employer) is vicariously liable for the torts of an agent (employee) committed within the scope of employment.

Within the scope of employment: Acts that are authorized, of the kind the employee is employed to perform, occurring within authorized hours and space, and motivated at least in part by the purpose of serving the employer.

Frolic vs. detour: A minor deviation from authorized activities (detour) does not take the employee outside the scope of employment. A major departure (frolic — going somewhere for purely personal reasons) may do so.

Independent contractors: Employers are generally NOT vicariously liable for torts of independent contractors. However, exceptions apply for:
- Inherently dangerous activities
- Non-delegable duties (duties the employer is legally required to perform personally)
- If the employer retains control over the manner and means of the work (making the contractor effectively an employee)

### Apparent Authority and Protecting Against Liability

To avoid apparent authority claims when using agents:
- Clearly communicate the scope of the agent's authority to third parties
- Use letterhead and contracts that clearly identify the company (not the agent) as the contracting party
- Revoke authority promptly when agents are terminated and notify third parties

### Gig Economy and Platform Liability

The legal status of gig workers (Uber, Lyft, DoorDash drivers, TaskRabbit workers) has been extensively litigated:
- Most platforms classify workers as independent contractors
- California AB5 (2019) applied the ABC test, making most gig workers employees. Prop 22 (2020) created a special category for app-based drivers and couriers.
- Other states: Multiple states have adopted or are considering employee reclassification standards for gig workers

Platform liability for user conduct:
- Section 230 of the Communications Decency Act: Platforms are not liable as publishers for user-generated content
- FOSTA-SESTA (2018) creates exceptions to Section 230 for sex trafficking content
- Platforms are NOT immune from liability for their own content or for content they develop or help create

### Franchise Law

A franchise is a relationship where a franchisor licenses its trademark, business methods, and systems to a franchisee in exchange for fees and royalties.

Federal regulation: The FTC Franchise Rule requires franchisors to provide prospective franchisees with a Franchise Disclosure Document (FDD) at least 14 days before signing any agreement or paying any money. The FDD contains 23 specific disclosures.

State registration: About 15 states require registration of the FDD with state regulators before offering franchises.

Vicarious liability: Franchisors can face vicarious liability for acts of franchisees if they exercise significant control over day-to-day operations. Courts look at the degree of control exercised.

Joint employer doctrine: If a franchisor exercises control over employment decisions of franchisee employees, both the franchisor and franchisee may be considered joint employers with shared liability under employment law.
""",
    },
]


def main():
    print("\n=== Seeding Foundational Legal Concepts (Python) ===\n")

    # Delete and recreate collection to ensure proper embedding function configuration
    # This fixes the "No embedding function configuration found" warning
    try:
        chroma.delete_collection(name=COLLECTION_NAME)
        print(f"Deleted existing collection '{COLLECTION_NAME}' (will recreate with EF config)\n")
    except Exception:
        pass

    col = chroma.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
        embedding_function=openai_ef,
    )
    print(f"Created collection '{COLLECTION_NAME}' with OpenAI embedding function.\n")

    total = 0
    for doc in LEGAL_CONCEPTS:
        print(f"  Processing: {doc['title']}")
        base_meta = {
            "source": "elle-legal-seed",
            "title": doc["title"],
            "industry": doc["industry"],
            "document_type": doc["document_type"],
            "jurisdiction": doc["jurisdiction"],
            "relevance_score": "0.95",
        }
        chunks = chunk_text(doc["content"].strip(), base_meta)
        if not chunks:
            print("    → 0 chunks (skipped)")
            continue

        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            ids = [f"seed-{doc['id']}-chunk-{i + j}" for j, _ in enumerate(batch)]
            texts = [c["text"] for c in batch]
            metas = [c["metadata"] for c in batch]
            embeddings = embed_texts(texts)
            # Pass embeddings directly — the stored OpenAI EF is metadata only;
            # we always embed ourselves for consistency with the TypeScript runtime.
            col.upsert(ids=ids, embeddings=embeddings, documents=texts, metadatas=metas)

        total += len(chunks)
        print(f"    → {len(chunks)} chunks indexed")

    final_count = col.count()
    print(f"\n=== Seed Complete: {total} chunks indexed, collection has {final_count} docs ===\n")


if __name__ == "__main__":
    main()
