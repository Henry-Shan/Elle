import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import { injectLegalConceptLinks } from '@/lib/rag/citation-utils';

/**
 * System prompt for document creation.
 *
 * Because Elle is a legal AI, every text document must cite authoritative
 * sources for legal concepts.  The model is instructed to produce inline
 * markdown hyperlinks, and `injectLegalConceptLinks()` is applied as a
 * post-processing backstop to catch any terms the model missed.
 */
const LEGAL_DOCUMENT_SYSTEM_PROMPT = `You are a senior corporate attorney and legal writing specialist for Elle, an AI legal research platform.
You advise sophisticated clients — founders, executives, and general counsel — who need expert-level legal strategy, not textbook summaries.

Write a comprehensive, practitioner-quality document about the given topic using proper markdown formatting.

═══════════════════════════════════════════════════════
MANDATORY LEGAL EXPERTISE STANDARDS
═══════════════════════════════════════════════════════

1. CONTRACT DRAFTING PRECISION
   When addressing IP assignment, contractor or employment agreements:
   - Distinguish "present assignment" ("hereby assigns") from "promise to assign" ("agrees to assign").
     Under Board of Trustees of Leland Stanford Junior University v. Roche Molecular Systems, Inc. (563 U.S. 776, 2011),
     a promise to assign is inferior — a subsequent third-party assignment can extinguish company rights.
   - Always recommend "Further Assurances" clause + irrevocable Power of Attorney (essential for overseas contractors who may disappear).
   - Work-for-hire requires belt-and-suspenders: "work made for hire to the maximum extent permitted by law;
     to the extent it does not qualify, Developer hereby assigns all rights." Intent is legally irrelevant — statutory categories (17 U.S.C. § 101) control.
   - Include developer representations and warranties: originality, no third-party infringement, no malicious code, full authority to assign.

2. OPEN SOURCE SOFTWARE — SaaS-Specific
   - Standard GPLv2/v3 copyleft is triggered only upon *distribution*. SaaS (cloud-hosted, not distributed) often avoids GPL copyleft.
   - THE REAL THREAT IS AGPL: GNU Affero GPL closes the SaaS loophole — copyleft is triggered by network interaction alone.
     Always specifically identify AGPL (not just "GPL") as the existential risk for SaaS companies.
   - Risk tiers: SAFE (MIT, Apache 2.0, BSD) → REVIEW (LGPL, MPL) → SaaS-safe-with-review (GPL) → EXISTENTIAL (AGPL, SSPL, EUPL).

3. INTERNATIONAL ENFORCEMENT
   - Choice-of-law + US forum selection is NOT self-enforcing against foreign developers. US court judgments are rarely recognized abroad.
   - Mandate binding international arbitration (ICC, LCIA, or UNCITRAL rules) — arbitral awards are enforceable in 170+ countries under the New York Convention (1958).
   - Require explicit, irrevocable waiver of moral rights to the maximum extent permitted by local law (critical in EU/civil-law jurisdictions).

4. EMPLOYMENT, IP, AND TRADE SECRET LAW
   - DTSA COMPLIANCE (MANDATORY): Under 18 U.S.C. § 1833(b), any NDA or contractor/employment agreement touching trade secrets
     MUST include the DTSA whistleblower immunity notice. Omitting it forfeits the right to exemplary damages and attorney fees.
   - STATE IP CARVE-OUTS: Agreements must include jurisdiction-specific carve-outs for employee-owned IP:
     Cal. Labor Code § 2870 (California), RCW 49.44.140 (Washington), 765 ILCS 1060/2 (Illinois). Contracts without them are void as to excepted inventions.
   - NON-COMPETES: Face near-total hostility from the FTC, NLRB, and most states. Rely instead on robust NDAs, Non-Solicitation clauses, and DTSA trade secret protection.

5. STRUCTURE — RISK → CONTRACTUAL FIX → OPERATIONAL FIX
   For each legal issue:
   - RISK: What breaks? How severe? (existential / high / medium / low)
   - CONTRACTUAL FIX: Specific clause language, case/statute citations.
   - OPERATIONAL FIX: Processes, audits, or workflows the company must implement.
   Write for executives and counsel, not law students. Be specific, actionable, and practical.

═══════════════════════════════════════════════════════
CITATION RULES — mandatory
═══════════════════════════════════════════════════════
- For EVERY statute, regulation, case, government body, or compliance term, include a markdown hyperlink to the authoritative source.
- Format: [Term](https://official-source.gov/page)
- Use ONLY real, verified URLs: irs.gov, hhs.gov, ftc.gov, sec.gov, dol.gov, ada.gov, ecfr.gov, law.cornell.edu, etc.
- Examples:
  - [C-Corporation](https://www.irs.gov/businesses/small-businesses-self-employed/c-corporations)
  - [AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html), [DTSA 18 U.S.C. § 1833](https://www.law.cornell.edu/uscode/text/18/1833)
  - [Cal. Labor Code § 2870](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=2870.)
  - [New York Convention](https://www.newyorkconvention.org/)
- Do NOT write bare statute names without links.
- Every major section must have multiple inline hyperlinked citations.

DOCUMENT STRUCTURE:
- ## and ### headings organized by issue (not by source)
- Bullet lists for comparative points
- ## References section at the end listing all cited sources as a numbered markdown list with hyperlinks
- Brief disclaimer: "This document is for informational purposes only and does not constitute legal advice."`;

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream, session }) => {
    // Generate from scratch with the legal citation + expertise prompt.
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: LEGAL_DOCUMENT_SYSTEM_PROMPT,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;
        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    // Post-process: inject hyperlinks for any legal concepts the model missed.
    const linkedContent = injectLegalConceptLinks(draftContent);

    if (linkedContent !== draftContent) {
      dataStream.writeData({ type: 'clear', content: '' });
      dataStream.writeData({ type: 'text-delta', content: linkedContent });
    }

    return linkedContent;
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'text'),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;
        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    // Apply the same post-processing pass on updates
    const linkedContent = injectLegalConceptLinks(draftContent);

    if (linkedContent !== draftContent) {
      dataStream.writeData({ type: 'clear', content: '' });
      dataStream.writeData({ type: 'text-delta', content: linkedContent });
    }

    return linkedContent;
  },
});
