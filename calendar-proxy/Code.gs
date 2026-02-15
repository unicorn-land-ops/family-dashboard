/**
 * Google Apps Script - Calendar Proxy for Family Dashboard
 *
 * Setup:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this code into Code.gs
 * 3. Update CALENDAR_IDS below with your calendar IDs
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the web app URL and paste it into CONFIG.calendarProxyUrl in index.html
 *
 * The script uses CalendarApp which has access to any calendar the
 * Google account can see (owned, shared, or subscribed).
 */

// Calendar IDs - update these to match your family's calendars
var CALENDAR_IDS = {
  'family': '9gaocpaifjfdfd809s51vhteos@group.calendar.google.com',
  'papa':   'joshua@masawa.fund',
  'wren':   '0u0uevnmmhtb295sre9bftof98@group.calendar.google.com',
  'ellis':  'p906t82tuhrdj60muv22euq3hs@group.calendar.google.com',
  'daddy':  'scottculley@gmail.com'
};

// Papa's work hours to filter (9-18 Berlin time, weekday timed events hidden)
var PAPA_WORK_START = 9;
var PAPA_WORK_END = 18;

function doGet(e) {
  try {
    var events = getUpcomingEvents();
    var output = ContentService.createTextOutput(JSON.stringify(events));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    var errorOutput = ContentService.createTextOutput(
      JSON.stringify({ error: err.message })
    );
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    return errorOutput;
  }
}

function getUpcomingEvents() {
  var now = new Date();
  var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var endDate = new Date(startOfToday);
  endDate.setDate(endDate.getDate() + 7);

  var allEvents = [];

  for (var calName in CALENDAR_IDS) {
    var calId = CALENDAR_IDS[calName];
    try {
      var calendar = CalendarApp.getCalendarById(calId);
      if (!calendar) {
        Logger.log('Calendar not found: ' + calName + ' (' + calId + ')');
        continue;
      }

      var events = calendar.getEvents(startOfToday, endDate);
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var title = event.getTitle().trim();
        if (!title) continue;

        var isAllDay = event.isAllDayEvent();
        var startTime = event.getStartTime();
        var eventDate;
        var eventTime = null;
        var eventHour = null;

        if (isAllDay) {
          eventDate = formatDate(startTime);
        } else {
          eventDate = formatDate(startTime);
          eventTime = formatTime(startTime);
          eventHour = startTime.getHours();
        }

        // Filter Papa's work-hours timed events
        if (calName === 'papa' && !isAllDay && eventHour !== null) {
          if (eventHour >= PAPA_WORK_START && eventHour < PAPA_WORK_END) {
            continue;
          }
        }

        var sortKey = isAllDay
          ? eventDate + 'T00:00:00'
          : eventDate + 'T' + eventTime + ':00';

        allEvents.push({
          title: title,
          date: eventDate,
          time: eventTime,
          calendar: calName,
          is_all_day: isAllDay,
          sort_key: sortKey,
          location: event.getLocation() || ''
        });
      }
    } catch (err) {
      Logger.log('Error reading calendar ' + calName + ': ' + err.message);
    }
  }

  // Sort by date, then time, then calendar
  allEvents.sort(function(a, b) {
    if (a.sort_key < b.sort_key) return -1;
    if (a.sort_key > b.sort_key) return 1;
    if (a.calendar < b.calendar) return -1;
    if (a.calendar > b.calendar) return 1;
    return 0;
  });

  return allEvents;
}

function formatDate(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function formatTime(date) {
  var h = String(date.getHours()).padStart(2, '0');
  var m = String(date.getMinutes()).padStart(2, '0');
  return h + ':' + m;
}

/**
 * Test function - run this in the Apps Script editor to verify it works.
 * View > Logs to see the output.
 */
function testGetEvents() {
  var events = getUpcomingEvents();
  Logger.log('Found ' + events.length + ' events:');
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    Logger.log(
      e.date + ' ' + (e.time || 'all-day') + ' [' + e.calendar + '] ' + e.title
    );
  }
}
