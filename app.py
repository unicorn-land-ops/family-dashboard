from flask import Flask, render_template, jsonify, request
import json
import os
import requests
import random
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
from threading import Thread, Lock
import time

app = Flask(__name__)
DATA_FILE = '/home/pi/dashboard/data.json'
BVG_API_URL = 'https://v6.bvg.transport.rest/stops/900110005/departures'
CREDENTIALS_FILE = '/home/pi/dashboard/obadiah-486121-feddc6056e28.json'

file_lock = Lock()

CALENDAR_IDS = {
    'family': '9gaocpaifjfdfd809s51vhteos@group.calendar.google.com',
    'papa': 'joshua@masawa.fund',
    'wren': '0u0uevnmmhtb295sre9bftof98@group.calendar.google.com',
    'ellis': 'p906t82tuhrdj60muv22euq3hs@group.calendar.google.com',
    'daddy': 'scottculley@gmail.com'
}

config = {
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

BERLIN_TZ = ZoneInfo('Europe/Berlin')
UTC_TZ = ZoneInfo('UTC')

# Google Calendar API auth
_gcal_service = None

def get_gcal_service():
    global _gcal_service
    if _gcal_service is not None:
        return _gcal_service
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE,
            scopes=['https://www.googleapis.com/auth/calendar.readonly']
        )
        _gcal_service = build('calendar', 'v3', credentials=creds)
        return _gcal_service
    except Exception as e:
        print(f'Google Calendar auth error: {e}')
        return None

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
    """Fetch daily horoscopes using horoscope-app-api.vercel.app"""
    today = str(date.today())
    data = load_data()

    if data.get('cached_astrology_date') == today and data.get('astrology'):
        return data['astrology']

    astrology = {
        'capricorn': 'Stars are aligning...',
        'aquarius': 'Cosmic energies at work...',
        'sagittarius': 'Universal wisdom incoming...'
    }

    for sign in ['Capricorn', 'Aquarius', 'Sagittarius']:
        try:
            url = f'https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign={sign}&day=TODAY'
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                result = resp.json()
                if result.get('success'):
                    desc = result['data'].get('horoscope_data', '')
                    astrology[sign.lower()] = desc
        except Exception as e:
            print(f'Astro error for {sign}: {e}')

    data['astrology'] = astrology
    data['cached_astrology_date'] = today
    save_data(data)
    return astrology

def fetch_calendar_events():
    """Fetch events from Google Calendar API with automatic recurring event expansion."""
    service = get_gcal_service()
    if not service:
        print('Calendar: no Google Calendar service available')
        return [], None, {}

    events = []
    travel_events = []
    today = date.today()
    time_min = datetime.combine(today, datetime.min.time()).strftime('%Y-%m-%dT00:00:00Z')
    time_max = (datetime.combine(today + timedelta(days=6), datetime.max.time())).strftime('%Y-%m-%dT23:59:59Z')
    school_off_dates = {}

    for cal_name, cal_id in CALENDAR_IDS.items():
        try:
            result = service.events().list(
                calendarId=cal_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime',
                maxResults=100
            ).execute()

            for item in result.get('items', []):
                summary = item.get('summary', '').strip()
                if not summary:
                    continue

                location = item.get('location', '')
                start = item.get('start', {})
                is_all_day = 'date' in start and 'dateTime' not in start

                if is_all_day:
                    event_date = datetime.strptime(start['date'], '%Y-%m-%d').date()
                    event_dt = None
                else:
                    dt_str = start.get('dateTime', '')
                    event_dt = datetime.fromisoformat(dt_str)
                    if event_dt.tzinfo:
                        event_dt = event_dt.astimezone(BERLIN_TZ).replace(tzinfo=None)
                    event_date = event_dt.date()

                # Travel detection for all-day events
                if is_all_day:
                    travel_info = detect_travel_location(summary, location)
                    if travel_info:
                        travel_events.append({
                            'traveler': travel_info['traveler'],
                            'location': travel_info['location'],
                            'timezone': travel_info['timezone'],
                            'date': event_date.isoformat()
                        })

                if not should_show_event(summary, cal_name, event_dt, is_all_day):
                    continue

                # School off detection
                if cal_name in ['wren', 'ellis'] and is_all_day:
                    if any(k in summary.lower() for k in ['schule', 'schulfrei', 'ferien', 'no school', 'holiday', 'vacation']):
                        if event_date not in school_off_dates:
                            school_off_dates[event_date] = []
                        school_off_dates[event_date].append(cal_name)
                        continue

                sort_time = event_dt.time() if event_dt else datetime.min.time()
                events.append({
                    'title': summary,
                    'date': event_date.isoformat(),
                    'time': event_dt.strftime('%H:%M') if event_dt and not is_all_day else None,
                    'calendar': cal_name,
                    'is_all_day': is_all_day,
                    'sort_key': datetime.combine(event_date, sort_time).isoformat()
                })

        except Exception as e:
            print(f'Calendar error ({cal_name}): {e}')

    # Add consolidated school-off entries
    for off_date, kids_list in school_off_dates.items():
        events.append({
            'title': 'No School',
            'date': off_date.isoformat(),
            'time': None,
            'calendar': 'family' if len(kids_list) > 1 else kids_list[0],
            'is_all_day': True,
            'sort_key': datetime.combine(off_date, datetime.min.time()).isoformat()
        })

    events.sort(key=lambda x: (x['sort_key'], x['calendar']))

    current_travel = None
    today_str = today.isoformat()
    for te in travel_events:
        if te['date'] == today_str:
            current_travel = te
            break

    return events, current_travel, school_off_dates

def fetch_weather_and_forecast():
    try:
        url = ("https://api.open-meteo.com/v1/forecast?"
               "latitude=" + str(config['weather_lat']) +
               "&longitude=" + str(config['weather_lon']) +
               "&current_weather=true"
               "&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset"
               "&timezone=Europe/Berlin&forecast_days=7")
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            daily = data.get('daily', {})
            today_sunrise = daily.get('sunrise', [''])[0]
            today_sunset = daily.get('sunset', [''])[0]
            current = {
                'temp': data['current_weather']['temperature'],
                'condition': data['current_weather'].get('weathercode', 0),
                'is_day': data['current_weather'].get('is_day', 1),
                'sunrise': today_sunrise[11:16] if today_sunrise else '',
                'sunset': today_sunset[11:16] if today_sunset else ''
            }

            forecast = []
            for i in range(len(daily.get('time', []))):
                sr = daily.get('sunrise', [''])[i] if i < len(daily.get('sunrise', [])) else ''
                ss = daily.get('sunset', [''])[i] if i < len(daily.get('sunset', [])) else ''
                forecast.append({
                    'date': daily['time'][i],
                    'high': round(daily['temperature_2m_max'][i]),
                    'low': round(daily['temperature_2m_min'][i]),
                    'condition': daily['weather_code'][i],
                    'sunrise': sr[11:16] if sr else '',
                    'sunset': ss[11:16] if ss else ''
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
            'fun_fact': get_fun_fact(country_data.get('name', {}).get('common', ''), cca2, country_data),
            'dish': get_typical_dish(cca2)
        }
    except Exception as e:
        print('Country fetch error: ' + str(e))
        return None

COUNTRY_FACTS = {
    'ST': 'Straddles the equator in the Gulf of Guinea',
    'TV': 'Fourth smallest country in the world',
    'BT': 'Measures success by Gross National Happiness',
    'MV': 'Lowest-lying country on Earth, avg 1.5m above sea level',
    'LC': 'Named after Saint Lucy by French sailors',
    'VC': 'Home to the oldest botanic gardens in the Western Hemisphere',
    'KI': 'Spans all four hemispheres of the Earth',
    'NR': 'Smallest island nation in the world',
    'PW': 'Created the world\'s first shark sanctuary',
    'FM': 'Contains ancient ruins of Nan Madol, the "Venice of the Pacific"',
    'AD': 'Has no airport, railway, or seaport',
    'LI': 'Last country to give women the right to vote (1984)',
    'MC': 'Smaller than Central Park in New York',
    'SM': 'Claims to be the world\'s oldest republic (founded 301 AD)',
    'TO': 'One of the first places in the world to see the new day',
    'MN': 'Home to the least densely populated country on Earth',
    'GE': 'Birthplace of wine — 8000 years of winemaking',
    'AM': 'First country to adopt Christianity as state religion (301 AD)',
    'RW': 'Known as the "Land of a Thousand Hills"',
    'SI': 'Over 60% of the country is covered in forest',
    'EE': 'Has the most startups per capita in Europe',
    'IS': 'Has no army and no McDonald\'s',
    'ZA': 'Has three capital cities',
    'NA': 'Home to the world\'s oldest desert (the Namib)',
    'BW': 'Home to the Okavango Delta, the largest inland delta',
    'NP': 'The only country with a non-rectangular flag',
    'CR': 'Abolished its army in 1948',
    'PA': 'Only place where you can see the sun rise over the Pacific and set over the Atlantic',
    'FJ': 'Made up of 333 islands, only 110 inhabited',
    'JP': 'Has more than 6,800 islands',
    'DE': 'Has over 1,500 different beers',
    'BR': 'Contains 60% of the Amazon rainforest',
    'NZ': 'Has more sheep than people',
    'AU': 'Home to 21 of the world\'s 25 most venomous snakes',
}

def get_fun_fact(country_name, country_code='', country_data=None):
    if country_code in COUNTRY_FACTS:
        return COUNTRY_FACTS[country_code]
    if country_data:
        landlocked = country_data.get('landlocked', False)
        pop = country_data.get('population', 0)
        area = country_data.get('area', 0)
        borders = country_data.get('borders', [])
        if landlocked:
            return f'A landlocked country with {len(borders)} neighbor{"s" if len(borders) != 1 else ""}'
        if pop and area and area > 0:
            density = pop / area
            if density < 5:
                return 'One of the least densely populated places on Earth'
            if density > 1000:
                return 'One of the most densely populated places on Earth'
        if area and area < 1000:
            return f'Tiny nation — only {int(area)} km² in area'
    return f'A fascinating place to explore!'

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
                events, travel, school_off = fetch_calendar_events()
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
    # Ensure country and astrology are populated on first request
    if not data.get('country_of_day') or data.get('country_of_day', {}).get('date') != str(date.today()):
        try:
            country = get_country_of_day()
            if country:
                data['country_of_day'] = country
        except:
            pass
    if not data.get('astrology') or data.get('cached_astrology_date') != str(date.today()):
        try:
            astro = fetch_astrology()
            if astro:
                data['astrology'] = astro
        except:
            pass
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
