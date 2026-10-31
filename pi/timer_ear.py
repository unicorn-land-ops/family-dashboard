#!/usr/bin/env python3
"""timer-ear: puts the HomePod's Siri timers on the kitchen dashboard.

A USB mic beside the HomePod feeds Vosk (offline speech recognition, nothing leaves the Pi and
nothing is recorded). Whenever a heard sentence is about a timer, either the person asking
("set an eight minute rice timer") or the HomePod confirming it ("rice timer, eight minutes,
starting now"), it is sent to the family-voice worker, which puts it on the dial.
Both sentences of one exchange arrive within seconds, so a repeat of the same duration inside
DEDUP_S is dropped. Apple offers no way to read Siri's own timers; this is the workaround (31.10.2026).

  arecord -q -D plughw:CARD=...,DEV=0 -f S16_LE -r 16000 -c 1 -t raw | venv/bin/python timer_ear.py
Env: VOICE_URL, VOICE_TOKEN (from ~/timer-ear/env), VOSK_MODEL (default ./model).
"""
import json, os, re, sys, time, urllib.request

DEDUP_S = 20
ONES = {w: i for i, w in enumerate(
    'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen '
    'fifteen sixteen seventeen eighteen nineteen'.split())}
TENS = {'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90}
UNIT = {'second': 1, 'seconds': 1, 'minute': 60, 'minutes': 60, 'hour': 3600, 'hours': 3600}
FILLER = set('set a an the for timer timers starting now okay ok and of start my is your on minute minutes '
             'hour hours second seconds hey siri please new called named'.split())


def words_to_numbers(text: str) -> list[str]:
    """'twenty five minutes' -> ['25', 'minutes']; 'a minute' -> ['1', 'minute']; 'half an hour' -> ['30', 'minutes']."""
    text = text.replace('half an hour', '30 minutes').replace('an hour and a half', '90 minutes')
    out: list[str] = []
    for w in text.split():
        if w in TENS:
            out.append(str(TENS[w]))
        elif w in ONES:
            if out and out[-1].isdigit() and int(out[-1]) % 10 == 0 and int(out[-1]) >= 20 and ONES[w] < 10:
                out[-1] = str(int(out[-1]) + ONES[w])
            else:
                out.append(str(ONES[w]))
        else:
            out.append(w)
    # "a minute" / "an hour"
    for i, w in enumerate(out[:-1]):
        if w in ('a', 'an') and out[i + 1] in UNIT:
            out[i] = '1'
    return out


def parse(text: str):
    """A heard sentence -> ('start', seconds, label) | ('cancel', label) | None."""
    t = text.lower().strip()
    if 'timer' not in t:
        return None
    if re.search(r'\b(cancel|stop|delete|remove)\b', t):
        label = ' '.join(w for w in t.split() if w not in FILLER and w not in ('cancel', 'stop', 'delete', 'remove', 'all'))
        return ('cancel', label)
    ws = words_to_numbers(t)
    seconds, used = 0, set()
    for i in range(len(ws) - 1):
        if ws[i].isdigit() and ws[i + 1] in UNIT:
            seconds += int(ws[i]) * UNIT[ws[i + 1]]
            used.update((i, i + 1))
    if not seconds:
        return None
    label = ' '.join(w for i, w in enumerate(ws) if i not in used and w not in FILLER and not w.isdigit())
    return ('start', seconds, label)


def post(path: str, body: dict) -> str:
    req = urllib.request.Request(os.environ['VOICE_URL'] + path, data=json.dumps(body).encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + os.environ['VOICE_TOKEN'],
                                          'Content-Type': 'application/json',
                                          'User-Agent': 'timer-ear/1'})  # Cloudflare 403s urllib's default UA
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.read().decode()


def main():
    from vosk import KaldiRecognizer, Model, SetLogLevel
    SetLogLevel(-1)
    rec = KaldiRecognizer(Model(os.environ.get('VOSK_MODEL', 'model')), 16000)
    last = (0.0, 0)  # (time, seconds) of the last timer sent
    while chunk := sys.stdin.buffer.read(8000):
        if not rec.AcceptWaveform(chunk):
            continue
        heard = json.loads(rec.Result()).get('text', '')
        got = parse(heard)
        if not got:
            continue
        try:
            if got[0] == 'start':
                _, secs, label = got
                if time.time() - last[0] < DEDUP_S and last[1] == secs:
                    continue
                last = (time.time(), secs)
                text = f'{secs // 60} minutes {label}' if secs % 60 == 0 else f'{secs} seconds {label}'
                print(f'heard "{heard}" -> {post("/timer", {"text": text})}', flush=True)
            else:
                print(f'heard "{heard}" -> {post("/timer/cancel", {"label": got[1]})}', flush=True)
        except Exception as e:  # a network blip must not kill the listener
            print(f'heard "{heard}" -> failed: {e}', flush=True)


def demo():
    assert parse('set an eight minute rice timer') == ('start', 480, 'rice')
    assert parse('rice timer eight minutes starting now') == ('start', 480, 'rice')
    assert parse('okay twenty five minutes starting now') is None  # no "timer": too risky to guess
    assert parse('set a timer for twenty five minutes') == ('start', 1500, '')
    assert parse('set ellis pad timer for ten minutes') == ('start', 600, 'ellis pad')
    assert parse('set a timer for an hour and a half') == ('start', 5400, '')
    assert parse('set a timer for one hour and ten minutes') == ('start', 4200, '')
    assert parse('cancel the rice timer') == ('cancel', 'rice')
    assert parse('what is the time') is None
    print('ok')


if __name__ == '__main__':
    demo() if '--test' in sys.argv else main()
