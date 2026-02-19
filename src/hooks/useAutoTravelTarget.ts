import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CALENDAR_FEEDS, HOME_TIMEZONE } from '../lib/calendar/config';
import type { CalendarEvent } from '../lib/calendar/types';
import { geocodeLocation } from '../lib/api/geocoding';
import { useCalendar } from './useCalendar';
import type { TravelTarget } from './useTravelWeather';

interface TravelCandidate {
  query: string;
  personId: string | null;
  startMs: number;
}

const TRAVEL_HINT_REGEX = /\b(flight|trip|travel|hotel|stay|conference|quiltcon|vacation)\b/i;
const PREPOSITION_DESTINATION_REGEX =
  /\b(?:to|in|at)\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}(?:,\s*[A-Za-z. ]{2,20})?)/i;
const LABEL_DESTINATION_REGEX =
  /^[^:]{2,40}:\s*([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}(?:,\s*[A-Za-z. ]{2,20})?)/;
const PLACE_ONLY_REGEX =
  /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}(?:,\s*[A-Za-z. ]{2,20})?$/;
const NON_DESTINATION_SUMMARY_REGEX =
  /\b(call|meeting|review|sync|chat|hold|block|dentist|doctor|appointment|school|kita)\b/i;

function isHomeArea(text: string): boolean {
  return /berlin|germany|deutschland/i.test(text);
}

function selectPersonId(event: CalendarEvent): string | null {
  return event.persons.find((id) => id !== 'family') ?? event.persons[0] ?? null;
}

function normalizeCandidate(text: string | undefined): string | null {
  if (!text) return null;
  const normalized = text
    .replace(/^[\s\-:;,]+/, '')
    .replace(/[\s\-:;,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized || normalized.length < 2) return null;
  if (/^https?:\/\//i.test(normalized)) return null;
  return normalized;
}

function extractDestinationFromSummary(summary: string): string | null {
  const normalizedSummary = summary.replace(/\s+/g, ' ').trim();
  if (!normalizedSummary) return null;

  const prepositionMatch = normalizedSummary.match(PREPOSITION_DESTINATION_REGEX);
  const prepositionDestination = normalizeCandidate(prepositionMatch?.[1]);
  if (prepositionDestination) return prepositionDestination;

  const labelMatch = normalizedSummary.match(LABEL_DESTINATION_REGEX);
  const labelDestination = normalizeCandidate(labelMatch?.[1]);
  if (labelDestination) return labelDestination;

  if (
    PLACE_ONLY_REGEX.test(normalizedSummary) &&
    !NON_DESTINATION_SUMMARY_REGEX.test(normalizedSummary)
  ) {
    return normalizeCandidate(normalizedSummary);
  }

  return null;
}

function buildCandidates(events: CalendarEvent[]): TravelCandidate[] {
  const now = Date.now();
  const upcoming = events
    .filter((event) => event.endTime.getTime() > now - 12 * 60 * 60 * 1000)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const candidates: TravelCandidate[] = [];
  for (const event of upcoming) {
    const personId = selectPersonId(event);

    const location = event.location?.trim();
    if (location && !isHomeArea(location)) {
      candidates.push({
        query: location,
        personId,
        startMs: event.startTime.getTime(),
      });
    }

    const destination = extractDestinationFromSummary(event.summary);
    const hasTravelHint = TRAVEL_HINT_REGEX.test(event.summary);
    if (
      destination &&
      !isHomeArea(destination) &&
      (hasTravelHint || !location)
    ) {
      candidates.push({
        query: destination,
        personId,
        startMs: event.startTime.getTime(),
      });
    }
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.personId ?? 'unknown'}|${candidate.query.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function resolveTravelTarget(candidates: TravelCandidate[]): Promise<TravelTarget | null> {
  for (const candidate of candidates.slice(0, 12)) {
    const results = await geocodeLocation(candidate.query);
    if (results.length === 0) continue;

    const selected =
      results.find((result) => result.timezone !== HOME_TIMEZONE) ?? results[0];
    if (!selected) continue;

    if (selected.timezone === HOME_TIMEZONE && isHomeArea(candidate.query)) {
      continue;
    }

    const person = candidate.personId
      ? CALENDAR_FEEDS.find((feed) => feed.id === candidate.personId)
      : null;
    const who = person ? `${person.emoji} ${person.name}` : 'Travel';
    const where = selected.country ? `${selected.name}, ${selected.country}` : selected.name;

    return {
      id: `auto-${candidate.personId ?? 'unknown'}-${candidate.query.toLowerCase()}`,
      label: `${who} (${where})`,
      timezone: selected.timezone,
      latitude: selected.latitude,
      longitude: selected.longitude,
    };
  }

  return null;
}

export function useAutoTravelTarget() {
  const { rawEvents } = useCalendar();
  const candidates = useMemo(() => buildCandidates(rawEvents), [rawEvents]);

  return useQuery({
    queryKey: ['travel-target', 'auto', candidates],
    queryFn: () => resolveTravelTarget(candidates),
    enabled: candidates.length > 0,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}
