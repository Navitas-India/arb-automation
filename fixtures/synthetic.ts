type SyntheticMemberData = {
  firstName: string;
  lastName: string;
  ssn: string;
  confirmSsn: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  mailingStreet: string;
  mailingCity: string;
  mailingZip: string;
  physicalStreet: string;
  physicalCity: string;
  physicalZip: string;
  personnelNumber: string;
};

function randomDigits(length: number): string {
  let result = '';
  while (result.length < length) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result.slice(0, length);
}

export function buildSyntheticMemberData(): SyntheticMemberData {
  const stamp = Date.now().toString().slice(-6);
  const ssnRaw = `${Math.floor(100 + Math.random() * 899)}${Math.floor(10 + Math.random() * 89)}${Math.floor(1000 + Math.random() * 8999)}`;
  const ssn = `${ssnRaw.slice(0, 3)}-${ssnRaw.slice(3, 5)}-${ssnRaw.slice(5, 9)}`;
  const phoneSuffix = randomDigits(4);

  return {
    firstName: `Auto${stamp}`,
    lastName: `Member${stamp}`,
    ssn,
    confirmSsn: ssn,
    phone: `501555${phoneSuffix}`,
    personalEmail: `auto.member.${stamp}@examplemail.com`,
    workEmail: `auto.member.${stamp}@workmail.com`,
    mailingStreet: `${Math.floor(100 + Math.random() * 899)} Test Street`,
    mailingCity: 'Little Rock',
    mailingZip: '72201',
    physicalStreet: `${Math.floor(100 + Math.random() * 899)} Profile Lane`,
    physicalCity: 'Little Rock',
    physicalZip: '72202',
    personnelNumber: `PN${stamp}`,
  };
}

export function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
