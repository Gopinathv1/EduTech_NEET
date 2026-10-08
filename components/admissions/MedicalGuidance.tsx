import Link from 'next/link';

/** Keep medical eligibility distinct from institution admission and licensing. */
export default function MedicalGuidance() {
  return <section id="eligibility" className="my-8 rounded-md border border-[#b9c4d0] bg-[#f5f7fa] p-5 text-[#344253]">
    <h2 className="text-xl font-semibold">Eligibility and medical practice in India</h2>
    <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7">
      <li>Indian citizens and OCI applicants planning primary medical education abroad must qualify NEET and meet the applicable eligibility rules. A practice-test score is not NEET qualification.</li>
      <li>University admission is separate: confirm academic prerequisites, teaching and clinical languages, internship, intake and deadlines with the institution.</li>
      <li>For medical practice in India, check the applicable NMC foreign graduate rules, internship, licensing and registration requirements for your cohort before enrolling. Admission or a directory listing does not guarantee registration.</li>
    </ul>
    <p className="mt-4 text-sm leading-7">SIVORA does not certify a foreign university as automatically NMC recognised. Engineering and other undergraduate or postgraduate courses have their own entry and professional requirements.</p>
    <div className="mt-4 flex flex-wrap gap-4 text-sm underline">
      <a href="https://nmc.org.in/page/rules-regulations-rules-regulations-of-erstwhile-mci-screening-test-regulations-2002" target="_blank" rel="noreferrer">NMC: NEET eligibility notice</a>
      <a href="https://nmc.org.in/e-gazette-nmc?page=2" target="_blank" rel="noreferrer">NMC: Foreign Medical Graduate Licentiate Regulations</a>
      <a href="https://neet.nta.nic.in/" target="_blank" rel="noreferrer">NTA: current NEET bulletin</a>
      <Link href="/admissions#enquiry">Request programme-specific guidance</Link>
    </div>
  </section>;
}
