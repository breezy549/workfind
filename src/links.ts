// Official US finders, all checked in a browser on 2026-11-27.
// CareerOneStop and O*NET accept the O*NET-SOC code (e.g. 47-2111.00), which matches the job exactly.
// Apprenticeship.gov keeps its search in page state, so we link to the finder and show the words to search for.
export const usLinks = (onetCode: string) => ({
  apprenticeships: 'https://www.apprenticeship.gov/apprenticeship-job-finder',
  training: `https://www.careeronestop.org/Toolkit/Training/find-local-training.aspx?keyword=${onetCode}&location=United%20States&ajax=0&post=y&lang=en`,
  licenses: `https://www.careeronestop.org/toolkit/training/find-licenses.aspx?keyword=${onetCode}&location=99&direct=0&ajax=occ`,
  certifications: `https://www.onetonline.org/link/localcert/${onetCode}`,
  onet: `https://www.onetonline.org/link/summary/${onetCode}`,
});
