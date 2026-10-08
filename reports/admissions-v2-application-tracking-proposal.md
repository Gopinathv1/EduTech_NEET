# University-application tracking: schema and workflow proposal

Status: design only, release-blocked; no schema, migration or database change applied. Reviewed 2026-10-08.

## Existing architecture

`ContactEnquiry` stores public counselling messages and NEW/RESPONDED/CLOSED triage. `AdmissionLead` stores signed-in counselling preferences, contact consent, country interests and NEW/CONTACTED/IN_PROGRESS/CONVERTED/CLOSED sales workflow. `LeadEvent` audits those lead changes. Existing admission APIs create/read counselling records and admin APIs assign, note and update lead status.

Neither record has a university/programme/intake relation, an external application reference, submitted documents, submission evidence or a university decision. Static institution IDs are catalogue lookup IDs, not database foreign keys. `CONVERTED` cannot establish enrolment. Existing records must not be reinterpreted or automatically backfilled as applications.

## Distinct concepts

| Concept | Meaning | Current readiness |
| --- | --- | --- |
| Counselling enquiry | Contact request and consent | Implemented |
| Student application draft | Student-authorized preparation for one identified programme/intake | Requires new persisted model |
| University application | Actual submission to a named institution with evidence/reference | Requires new persisted model and verified submission process |
| University admission decision | Institution-issued offer, conditional offer or rejection | Requires a separate evidenced decision record |

## Additive schema proposal (not executable migration)

- `AdmissionsInstitution`: durable UUID, canonical name, country code, official URL, optional legacy catalogue alias, evidence URL/review date and review state. Alias mapping must be approved; catalogue order must not become a foreign key.
- `AdmissionsProgramme`: durable UUID, institution FK, exact award/title, campus and intake identifiers, source/review metadata. No inferred accreditation or licensing fields.
- `UniversityApplication`: UUID, student FK, optional counselling lead FK, programme FK, version, draft/submission/withdrawal state, consentAt, createdAt/updatedAt, optional externalReference, submittedAt and submissionEvidenceId. Unique submission idempotency key; index student and programme/intake. DRAFT is the default and is not submitted.
- `ApplicationEvidence`: UUID, application FK, evidence kind, private storage key, content hash, source/issued date, capturedBy admin FK and capturedAt. Requires private document storage, access control, retention rules and malware scanning; never place student documents in public URLs or unredacted logs.
- `UniversityDecision`: UUID, application FK, explicit institution decision type (conditional offer/offer/rejection), issuedAt, receivedAt, decisionEvidenceId, enteredBy and correction history. Decisions are separately audited, never inferred from sales conversion or payment. Offer does not establish acceptance, enrolment, visa or professional registration.
- `UniversityApplicationEvent`: append-only actor, event type, old/new state, evidence reference, timestamp and optimistic version; all state changes transactional. Deletions/retention require an agreed policy and must not cascade into existing counselling or student records.

## Workflow and API proposal

1. Student prepares a DRAFT for an explicitly confirmed programme/intake and consents to processing. Proposed `POST /api/university-applications` is idempotent; drafts are student-owned.
2. Authenticated active admissions admin validates programme identity, documents and the student's authorization. Preparation/review never marks submission.
3. Record SUBMITTED only after actual submission has an institution reference or auditable confirmation evidence and submittedAt. If an integration exists later, consume signed callbacks idempotently; no speculative auto-submit or outbound communication in this task.
4. Record a separate decision only from university-issued evidence. Student view displays decision provenance and date. Corrections append audit events rather than overwriting evidence silently.
5. Withdrawal and closure describe their actual action, not rejection. Visa, enrolment and licensing are outside this workflow until their own evidence models/processes are approved.
6. Proposed student GET routes enforce ownership; active admin routes enforce scoped role access, optimistic concurrency, evidence requirements and audit logging. Never trust client-supplied actor or decision provenance.

## Migration and release gate

Prepare an additive migration in a later authorized implementation task, rehearse against a new isolated database, test foreign keys/rollback/retention, and review the mapping and document-security design. Do not backfill enquiries as SUBMITTED applications. Existing student and lead data remain untouched. Production migration requires explicit release authorization. Until the models, evidence handling, APIs, ownership tests and submission/decision process are implemented and verified, genuine university-application tracking remains **release-blocked**. Current counselling functionality may be reviewed separately and must retain its counselling-only labels.
