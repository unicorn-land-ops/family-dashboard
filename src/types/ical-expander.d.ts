declare module 'ical-expander' {
  interface ICalTime {
    toJSDate(): Date;
    isDate: boolean;
  }

  interface ICalEvent {
    uid: string;
    summary: string;
    startDate: ICalTime;
    endDate: ICalTime;
    location: string | null;
  }

  interface ICalOccurrence {
    item: ICalEvent;
    startDate: ICalTime;
    endDate: ICalTime;
  }

  interface BetweenResult {
    events: ICalEvent[];
    occurrences: ICalOccurrence[];
  }

  interface IcalExpanderOptions {
    ics: string;
    maxIterations?: number;
  }

  export default class IcalExpander {
    constructor(options: IcalExpanderOptions);
    between(after: Date, before: Date): BetweenResult;
  }
}
