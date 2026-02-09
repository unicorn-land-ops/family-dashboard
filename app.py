from flask import Flask, render_template, jsonify, request
import json
import os
import requests
import random
from datetime import datetime, date, timedelta
from dateutil import rrule
from threading import Thread, Lock
import time
import re

app = Flask(__name__)
DATA_FILE = '/home/pi/dashboard/data.json'
BVG_API_URL = 'https://v6.bvg.transport.rest/stops/900110005/departures'

file_lock = Lock()

config = {
    'calendars': {
        'family': 'https://calendar.google.com/calendar/ical/9gaocpaifjfdfd809s51vhteos%40group.calendar.google.com/private-870afa40c37fe857d90e573bc7a94d39/basic.ics',
        'papa': 'https://calendar.google.com/calendar/ical/joshua%40masawa.fund/private-b9d2d8e3c640cba307bffb8800e1184e/basic.ics',
        'wren': 'https://calendar.google.com/calendar/ical/0u0uevnmmhtb295sre9bftof98%40group.calendar.google.com/private-00c2f92516c2c794947233ab72ab459f/basic.ics',
        'ellis': 'https://calendar.google.com/calendar/ical/p906t82tuhrdj60muv22euq3hs%40group.calendar.google.com/private-9f2885f66e05c732531f5e8412afbf1a/basic.ics',
        'daddy': 'https://calendar.google.com/calendar/ical/scottculley%40gmail.com/private-880cafa3c384dbb901770fbe10917bdb/basic.ics'
    },
    'weather_lat': 52.5200,
    'weather_lon': 13.4050,
    'bvg_enabled': True
}

# Family birth data for astrology
FAMILY_ASTRO = {
    'papa': {'name': 'Papa', 'sign': 'sagittarius', 'emoji': '♐'},
    'daddy': {'name': 'Daddy', 'sign': 'capricorn', 'emoji': '♑'},
    'wren': {'name': 'Wren', 'sign': 'capricorn', 'emoji': '♑'},
    'ellis': {'name': 'Ellis', 'sign': 'aquarius', 'emoji': '♒'}
}

LOCATION_TIMEZONES = {
    'munich': 'Europe/Berlin', 'new york': 'America/New_York', 'london': 'Europe/London',
    'paris': 'Europe/Paris', 'tokyo': 'Asia/Tokyo', 'singapore': 'Asia/Singapore',
    'sydney': 'Australia/Sydney', 'dubai': 'Asia/Dubai', 'east coast': 'America/New_York',
    'west coast': 'America/Los_Angeles', 'los angeles': 'America/Los_Angeles',
    'california': 'America/Los_Angeles', 'chicago': 'America/Chicago', 'boston': 'America/New_York'
}

INTERESTING_COUNTRIES = [
    'ST', 'TV', 'BT', 'MV', 'LC', 'VC', 'KI', 'NR', 'PW', 'FM',
    'AD', 'LI', 'MC', 'SM', 'TO',
    'MN', 'GE', 'AM', 'RW', 'SI', 'EE', 'LV', 'LT',
    'IS', 'FO', 'GL', 'SJ',
    'ZA', 'NA', 'BW', 'ZM', 'ZW',
    'NP', 'BT', 'LA', 'MM', 'KH',
    'CR', 'PA', 'GT', 'BZ', 'HN',
    'FJ', 'SB', 'VU', 'WS', 'TO',
]

def load_data():
    with file_lock:
        try:
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r') as f:
                    return json.load(f)
        except:
            pass
    return {
        'wren': {'dishes': False, 'room': False, 'homework': False, 'screen_time': 0},
        'ellis': {'toys': False, 'bed': False, 'teeth': False, 'screen_time': 0},
        'grocery_list': [],
        'timers': [],
        'alexa_timers': [],
        'last_reset': str(date.today()),
        'cached_transit': [],
        'cached_weather': {},
        'cached_forecast': [],
        'cached_events': [],
        'travel_info': None,
        'country_of_day': None,
        'astrology': None,
        'cached_astrology_date': None
    }

def save_data(data):
    with file_lock:
        tmp_file = DATA_FILE + '.tmp'
        with open(tmp_file, 'w') as f:
            json.dump(data, f)
        os.replace(tmp_file, DATA_FILE)

def parse_ics_datetime(dt_str):
    try:
        # All-day event: YYYYMMDD
        if len(dt_str) == 8 and 'T' not in dt_str:
            return datetime.strptime(dt_str, '%Y%m%d'), True
        
        # UTC datetime: YYYYMMDDTHHMMSSZ
        if 'Z' in dt_str:
            dt_clean = dt_str.replace('Z', '')
            dt = datetime.strptime(dt_clean[:15], '%Y%m%dT%H%M%S')
            # Convert UTC to Berlin time (CET = UTC+1)
            dt = dt + timedelta(hours=1)
            return dt, False
        
        # Local datetime with TZID (Europe/Berlin): already in local time
        if 'T' in dt_str:
            dt = datetime.strptime(dt_str[:15], '%Y%m%dT%H%M%S')
            return dt, False
        
        return None, False
    except Exception as e:
        print(f'Datetime parse error: {e} for {dt_str}')
        return None, False

def should_show_event(event_title, calendar_name, event_dt, is_all_day):
    if calendar_name == 'papa':
        if is_all_day:
            return True
        if event_dt and 9 <= event_dt.hour < 18:
            return False
        return True
    return True

def detect_travel_location(event_title, event_location=''):
    text = (event_title + ' ' + event_location).lower()
    for location, timezone in LOCATION_TIMEZONES.items():
        if location in text:
            traveler = None
            if 'papa' in text or 'joshua' in text:
                traveler = 'Papa'
            elif 'daddy' in text or 'scott' in text:
                traveler = 'Daddy'
            return {'traveler': traveler, 'location': location.title(), 'timezone': timezone}
    return None

def fetch_astrology():
    """Fetch daily horoscopes by sign using Aztro API"""
    today = str(date.today())
    data = load_data()
    
    # Return cached astrology if from today
    if data.get('cached_astrology_date') == today and data.get('astrology'):
        return data['astrology']
    
    # Initialize with default messages
    astrology = {
        'capricorn': 'Stars are aligning...',
        'aquarius': 'Cosmic energies at work...',
        'sagittarius': 'Universal wisdom incoming...'
    }
    
    signs = ['capricorn', 'aquarius', 'sagittarius']
    
    for sign in signs:
        try:
            url = f'https://aztro.sameerkumar.website/v2/?sign={sign}&day=today'
            resp = requests.post(url, timeout=10)
            if resp.status_code == 200:
                result = resp.json()
                desc = result.get('description', 'No reading available')
                if len(desc) > 120:
                    desc = desc[:117] + '...'
                astrology[sign] = desc
            else:
                astrology[sign] = f'{sign.title()} energy strong today'
        except Exception as e:
            print(f'Astro error for {sign}: {e}')
            astrology[sign] = f'{sign.title()} wisdom incoming'
    
    # Save to cache
    data['astrology'] = astrology
    data['cached_astrology_date'] = today
    save_data(data)
    
    return astrology

def fetch_calendar_events():
    events = []
    travel_events = []
    today = date.today()
    window_start = today
    window_end = today + timedelta(days=6)
    school_off_dates = {}
    
    for cal_name, cal_url in config["calendars"].items():
        if not cal_url:
            continue
        try:
            resp = requests.get(cal_url, timeout=15)
            if resp.status_code != 200:
                continue
            ics_content = resp.text
            vevents = re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", ics_content, re.DOTALL)
            
            # Limit events processed per calendar for performance
            vevents = vevents[:100]  # Max 100 events per calendar
            
            for vevent in vevents:
                summary_match = re.search(r"SUMMARY:(.*?)(?:\r?\n[\w-]+:|\r?\nEND:VEVENT)", vevent, re.DOTALL)
                summary = summary_match.group(1).strip() if summary_match else ""
                summary = summary.replace("\\,", ",").replace("\\n", " ").strip()
                if not summary:
                    continue
                
                loc_match = re.search(r"LOCATION:(.*?)(?:\r?\n[\w-]+:|\r?\nEND:VEVENT)", vevent, re.DOTALL)
                location = loc_match.group(1).strip() if loc_match else ""
                
                dtstart_match = re.search(r"DTSTART(?:;[^:]*)?:([\dTZ]+)", vevent)
                dtstart = dtstart_match.group(1) if dtstart_match else None
                if not dtstart:
                    continue
                
                # Check for recurring events
                rrule_match = re.search(r"RRULE:([^\n]+)", vevent)
                rrule_str = rrule_match.group(1) if rrule_match else None
                
                # Get exception dates
                exdate_matches = re.findall(r"EXDATE(?:;[^:]*)?:([^\n]+)", vevent)
                exdates = set()
                for em in exdate_matches:
                    em_clean = em.strip().replace("T", "").replace("Z", "")
                    if len(em_clean) >= 8:
                        try:
                            exdates.add(datetime.strptime(em_clean[:8], "%Y%m%d").date())
                        except:
                            pass
                
                event_dt, is_all_day = parse_ics_datetime(dtstart)
                if not event_dt:
                    continue
                
                # Generate event instances within the window
                event_instances = []
                
                if rrule_str and isinstance(event_dt, datetime):
                    # Recurring event - expand instances
                    try:
                        # Determine frequency
                        freq_str = "WEEKLY"
                        if "DAILY" in rrule_str: freq_str = "DAILY"
                        if "MONTHLY" in rrule_str: freq_str = "MONTHLY"
                        delta_map = {"DAILY": timedelta(days=1), "WEEKLY": timedelta(weeks=1), "MONTHLY": timedelta(days=30)}
                        delta = delta_map[freq_str]
                        
                        # Fast forward to window_start
                        current_dt = event_dt
                        if current_dt.date() < window_start:
                            days_diff = (window_start - current_dt.date()).days
                            if freq_str == "WEEKLY":
                                weeks = days_diff // 7
                                current_dt = current_dt + timedelta(weeks=weeks)
                            elif freq_str == "DAILY":
                                current_dt = current_dt + timedelta(days=days_diff)
                            else:
                                while current_dt.date() < window_start:
                                    current_dt = current_dt + delta
                        
                        # Generate up to 10 occurrences in window
                        for _ in range(10):
                            occ_date = current_dt.date()
                            if occ_date > window_end:
                                break
                            if occ_date >= window_start and occ_date not in exdates:
                                event_instances.append({"dt": current_dt, "date": occ_date, "is_all_day": False})
                            current_dt = current_dt + delta
                    except Exception as e:
                        print(f"RRULE error: {e}")
                        event_date = event_dt.date()
                        if window_start <= event_date <= window_end:
                            event_instances.append({"dt": event_dt, "date": event_date, "is_all_day": False})
                else:
                    # Single event (or all-day)
                    event_date = event_dt.date() if isinstance(event_dt, datetime) else event_dt
                    if window_start <= event_date <= window_end:
                        event_instances.append({"dt": event_dt, "date": event_date, "is_all_day": is_all_day})
                
                # Process each instance
                for inst in event_instances:
                    event_dt = inst["dt"]
                    event_date = inst["date"]
                    is_all_day = inst["is_all_day"]
                    
                    if is_all_day:
                        travel_info = detect_travel_location(summary, location)
                        if travel_info:
                            travel_events.append({"traveler": travel_info["traveler"], "location": travel_info["location"], "timezone": travel_info["timezone"], "date": event_date.isoformat()})
                    
                    if not should_show_event(summary, cal_name, event_dt if not is_all_day else None, is_all_day):
                        continue
                    
                    if cal_name in ["wren", "ellis"] and is_all_day:
                        if any(k in summary.lower() for k in ["schule", "schulfrei", "ferien", "no school", "holiday", "vacation"]):
                            if event_date not in school_off_dates:
                                school_off_dates[event_date] = []
                            school_off_dates[event_date].append(cal_name)
                            continue
                    
                    events.append({
                        "title": summary,
                        "date": event_date.isoformat(),
                        "time": event_dt.strftime("%H:%M") if isinstance(event_dt, datetime) and not is_all_day else None,
                        "calendar": cal_name,
                        "is_all_day": is_all_day,
                        "sort_key": datetime.combine(event_date, event_dt.time() if isinstance(event_dt, datetime) else datetime.min.time()).isoformat()
                    })
                    
        except Exception as e:
            print(f"Calendar error: {e}")
    
    for off_date, kids_list in school_off_dates.items():
        events.append({
            "title": "No School",
            "date": off_date.isoformat(),
            "time": None,
            "calendar": "family" if len(kids_list) > 1 else kids_list[0],
            "is_all_day": True,
            "sort_key": datetime.combine(off_date, datetime.min.time()).isoformat()
        })
    
    events.sort(key=lambda x: (x["sort_key"], x["calendar"]))
    
    current_travel = None
    today_str = today.isoformat()
    for te in travel_events:
        if te["date"] == today_str:
            current_travel = te
            break
    
    return events, current_travel, school_off_dates

def fetch_weather_and_forecast():
    try:
        url = "https://api.open-meteo.com/v1/forecast?latitude=" + str(config['weather_lat']) + "&longitude=" + str(config['weather_lon']) + "&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe/Berlin&forecast_days=7"
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            current = {
                'temp': data['current_weather']['temperature'],
                'condition': data['current_weather'].get('weathercode', 0),
                'is_day': data['current_weather'].get('is_day', 1)
            }
            
            forecast = []
            daily = data.get('daily', {})
            for i in range(len(daily.get('time', []))):
                forecast.append({
                    'date': daily['time'][i],
                    'high': round(daily['temperature_2m_max'][i]),
                    'low': round(daily['temperature_2m_min'][i]),
                    'condition': daily['weather_code'][i]
                })
            
            return current, forecast
    except Exception as e:
        print('Weather error: ' + str(e))
    return {}, []

def get_country_of_day():
    data = load_data()
    
    if data.get('country_of_day', {}).get('date') == str(date.today()):
        return data['country_of_day']
    
    country = fetch_random_country()
    if country:
        country['date'] = str(date.today())
        data['country_of_day'] = country
        save_data(data)
    return country

def fetch_random_country():
    try:
        if random.random() < 0.7 and INTERESTING_COUNTRIES:
            code = random.choice(INTERESTING_COUNTRIES)
            resp = requests.get('https://restcountries.com/v3.1/alpha/' + code, timeout=10)
            if resp.status_code == 200:
                country_data = resp.json()[0]
            else:
                resp = requests.get('https://restcountries.com/v3.1/all', timeout=10)
                countries = resp.json()
                country_data = random.choice(countries)
        else:
            resp = requests.get('https://restcountries.com/v3.1/all', timeout=10)
            if resp.status_code == 200:
                countries = resp.json()
                country_data = random.choice(countries)
            else:
                return None
        
        cca2 = country_data.get('cca2', '')
        flag_emoji = ''
        if cca2:
            flag_emoji = chr(ord(cca2[0]) + 127397) + chr(ord(cca2[1]) + 127397) if len(cca2) == 2 else '🏳️'
        
        languages = list(country_data.get('languages', {}).values())
        capitals = country_data.get('capital', [])
        capital = capitals[0] if capitals else 'N/A'
        
        population = country_data.get('population', 0)
        if population > 1000000:
            pop_str = str(round(population / 1000000, 1)) + 'M'
        elif population > 1000:
            pop_str = str(round(population / 1000, 1)) + 'K'
        else:
            pop_str = str(population)
        
        return {
            'code': cca2,
            'name': country_data.get('name', {}).get('common', 'Unknown'),
            'capital': capital,
            'population': pop_str,
            'languages': languages[:3],
            'flag_emoji': flag_emoji,
            'region': country_data.get('region', 'Unknown'),
            'fun_fact': get_fun_fact(country_data.get('name', {}).get('common', '')),
            'dish': get_typical_dish(cca2)
        }
    except Exception as e:
        print('Country fetch error: ' + str(e))
        return None

def get_fun_fact(country_name):
    facts = [
        "Home to unique wildlife found nowhere else on Earth",
        "Has more than 700 islands in its territory",
        "One of the smallest countries in the world by population",
        "Known for having no traffic lights in the entire country",
        "Contains the world's oldest rainforest",
        "Has more sheep than people",
        "The only country in its region never colonized by Europe",
        "Famous for having pink sand beaches"
    ]
    return random.choice(facts)

def get_typical_dish(country_code):
    dishes = {
        'ST': 'Calulu', 'TV': 'Pulaka', 'BT': 'Ema datshi', 'MV': 'Mas huni',
        'IT': 'Pizza', 'JP': 'Ramen', 'IN': 'Butter Chicken', 'MX': 'Tacos',
        'TH': 'Pad Thai', 'VN': 'Pho', 'GR': 'Moussaka', 'ES': 'Paella',
        'FR': 'Coq au Vin', 'DE': 'Sauerbraten', 'CN': 'Peking Duck',
        'KR': 'Kimchi', 'BR': 'Feijoada'
    }
    return dishes.get(country_code, 'Traditional stew')

# ALEXA WEBHOOK ENDPOINTS
@app.route('/api/alexa/grocery', methods=['POST'])
def alexa_add_grocery():
    data = load_data()
    item = request.json.get('item', '').strip()
    if item and item not in data['grocery_list']:
        data['grocery_list'].append(item)
        save_data(data)
        return jsonify({'status': 'added', 'item': item, 'list': data['grocery_list']})
    return jsonify({'status': 'already_exists' if item in data['grocery_list'] else 'error', 'item': item})

@app.route('/api/alexa/grocery/remove', methods=['POST'])
def alexa_remove_grocery():
    data = load_data()
    item = request.json.get('item', '').strip()
    if item in data['grocery_list']:
        data['grocery_list'].remove(item)
        save_data(data)
        return jsonify({'status': 'removed', 'item': item})
    return jsonify({'status': 'not_found', 'item': item})

@app.route('/api/alexa/timer', methods=['POST'])
def alexa_add_timer():
    data = load_data()
    timer_data = request.json
    name = timer_data.get('name', 'Timer')
    duration = timer_data.get('duration_minutes', 5)
    new_timer = {
        'id': len(data['alexa_timers']),
        'name': name,
        'duration_minutes': duration,
        'created': datetime.now().isoformat(),
        'ends_at': (datetime.now() + timedelta(minutes=duration)).isoformat()
    }
    data['alexa_timers'].append(new_timer)
    save_data(data)
    return jsonify({'status': 'added', 'timer': new_timer})

@app.route('/api/alexa/timer/<int:timer_id>', methods=['DELETE'])
def alexa_delete_timer(timer_id):
    data = load_data()
    data['alexa_timers'] = [t for t in data['alexa_timers'] if t['id'] != timer_id]
    save_data(data)
    return jsonify({'status': 'removed', 'id': timer_id})

@app.route('/api/alexa/clear-all', methods=['POST'])
def alexa_clear_all():
    data = load_data()
    data['grocery_list'] = []
    data['alexa_timers'] = []
    save_data(data)
    return jsonify({'status': 'cleared'})

def update_external_data():
    while True:
        try:
            data = load_data()
            
            if config['bvg_enabled']:
                try:
                    resp = requests.get(BVG_API_URL, params={'lines': 'U2', 'duration': 30}, timeout=10)
                    if resp.status_code == 200:
                        departures = resp.json().get('departures', [])[:5]
                        data['cached_transit'] = [
                            {'line': d['line']['name'], 'direction': d['direction'], 'when': d['when'], 'platform': d.get('platform', '-')}
                            for d in departures
                        ]
                except Exception as e:
                    print('BVG error: ' + str(e))
            
            try:
                current, forecast = fetch_weather_and_forecast()
                data['cached_weather'] = current
                data['cached_forecast'] = forecast
            except Exception as e:
                print('Weather error: ' + str(e))
            
            try:
                events, travel = fetch_calendar_events()
                data['cached_events'] = events
                data['travel_info'] = travel
            except Exception as e:
                print('Calendar error: ' + str(e))
            
            # Clean up expired timers
            now = datetime.now()
            data['alexa_timers'] = [
                t for t in data.get('alexa_timers', [])
                if datetime.fromisoformat(t['ends_at']) > now
            ]
            
            try:
                country = get_country_of_day()
                if country:
                    data['country_of_day'] = country
            except Exception as e:
                print('Country error: ' + str(e))
            
            # Fetch astrology data
            try:
                astro = fetch_astrology()
                if astro:
                    data['astrology'] = astro
                    data['cached_astrology_date'] = str(date.today())
            except Exception as e:
                print('Astrology error: ' + str(e))
            
            save_data(data)
            time.sleep(60)
        except Exception as e:
            print('Background task error: ' + str(e))
            time.sleep(60)

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/status')
def status():
    data = load_data()
    if data.get('last_reset') != str(date.today()):
        data = {
            'wren': {'dishes': False, 'room': False, 'homework': False, 'screen_time': 0},
            'ellis': {'toys': False, 'bed': False, 'teeth': False, 'screen_time': 0},
            'grocery_list': data.get('grocery_list', []),
            'timers': [],
            'alexa_timers': data.get('alexa_timers', []),
            'last_reset': str(date.today()),
            'cached_transit': [],
            'cached_weather': {},
            'cached_forecast': [],
            'cached_events': [],
            'travel_info': None,
            'country_of_day': data.get('country_of_day'),
            'astrology': data.get('astrology'),
            'cached_astrology_date': data.get('cached_astrology_date')
        }
        save_data(data)
    return jsonify(data)

@app.route('/api/toggle/<kid>/<chore>', methods=['POST'])
def toggle_chore(kid, chore):
    data = load_data()
    if kid in data and chore in data[kid]:
        data[kid][chore] = not data[kid][chore]
        if kid == 'wren' and all(data['wren'][c] for c in ['dishes', 'room', 'homework']):
            data['wren']['screen_time'] = 120
        elif kid == 'ellis' and all(data['ellis'][c] for c in ['toys', 'bed', 'teeth']):
            data['ellis']['screen_time'] = 60
        save_data(data)
    return jsonify(data)

@app.route('/api/grocery', methods=['GET', 'POST', 'DELETE'])
def grocery():
    data = load_data()
    if request.method == 'GET':
        return jsonify(data.get('grocery_list', []))
    elif request.method == 'POST':
        item = request.json.get('item', '')
        if item and item not in data['grocery_list']:
            data['grocery_list'].append(item)
            save_data(data)
        return jsonify(data['grocery_list'])
    elif request.method == 'DELETE':
        item = request.json.get('item', '')
        if item in data['grocery_list']:
            data['grocery_list'].remove(item)
            save_data(data)
        return jsonify(data['grocery_list'])

if __name__ == '__main__':
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    Thread(target=update_external_data, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, debug=False)
