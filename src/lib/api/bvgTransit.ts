const BVG_BASE = 'https://v6.bvg.transport.rest';
const SENEFELDERPLATZ_ID = '900110005';

export interface Departure {
  tripId: string;
  direction: string;
  line: { name: string; product: string };
  when: string | null;
  plannedWhen: string;
  delay: number | null;
  platform: string | null;
  remarks: Array<{ type: string; text: string }>;
}

interface DeparturesResponse {
  departures: Departure[];
  realtimeDataUpdatedAt: number;
}

export async function fetchDepartures(): Promise<Departure[]> {
  const url = `${BVG_BASE}/stops/${SENEFELDERPLATZ_ID}/departures?duration=30&results=3`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `BVG API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: DeparturesResponse = await response.json();
  return data.departures;
}
