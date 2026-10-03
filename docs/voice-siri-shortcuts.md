# Voice: Siri Shortcuts for groceries, chores and points

The `family-voice` Cloudflare Worker (`voice-worker/`) takes simple requests from Siri
Shortcuts, writes to the same Supabase tables as the dashboard, and replies with one
sentence that Siri reads out loud.

| Route | Body | Example reply |
|---|---|---|
| `POST /grocery` | `{"item": "milk", "by": "papa"}` (`by` optional) | Added milk to the list. |
| `POST /chore` | `{"kid": "ellis", "chore": "teeth"}` | Done! Brush teeth. Ellis has 23 points. |
| `POST /redeem` | `{"kid": "wren", "reward": "ice cream"}` | Enjoy Ice cream! Wren has 5 points left. |
| `GET /points?kid=ellis` | none | Ellis has 23 points. 27 more for Cinema night. |

Every request needs the header `Authorization: Bearer <VOICE_TOKEN>`. Replies are plain
text. Add `?json=1` to any URL to get JSON instead.

Chore and reward names are matched loosely: case doesn't matter, umlauts and emoji are
ignored, and "teeth" finds "🦷 Brush teeth". A chore that's already done for today (or
this week, for weekly chores) isn't counted twice.

## 1. Deploy the Worker (once)

You need the Supabase project URL and anon key (the same values as `VITE_SUPABASE_URL`
and `VITE_SUPABASE_ANON_KEY`), plus a long random token for Siri.

```bash
cd voice-worker
npx wrangler login                      # pick the Cloudflare account to host it
openssl rand -hex 24                    # copy this: it's your VOICE_TOKEN
npx wrangler secret put VOICE_TOKEN     # paste the token
npx wrangler secret put SUPABASE_URL    # https://<project>.supabase.co
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler deploy
```

`wrangler deploy` prints the URL, e.g. `https://family-voice.<subdomain>.workers.dev`.
The first `secret put` may offer to create the Worker; say yes. The Worker imports
`src/lib/points.ts` and `src/lib/choreSchedule.ts` from the dashboard, so run
`npm ci` at the repo root first.

Check it from a terminal:

```bash
curl -H "Authorization: Bearer $TOKEN" "https://family-voice.<subdomain>.workers.dev/points?kid=ellis"
```

Points and rewards need `supabase/migrations/2026-10-03-rewards.sql` to have been run.
Without it, groceries and chores still work and replies just leave out the points.

## 2. Build the Shortcuts on iPhone

Open the **Shortcuts** app, tap **+**, and build each one below. In every one, the
"Get Contents of URL" step is set up the same way: tap **Show More**, set **Method**,
add a **Header** with key `Authorization` and value `Bearer <your token>` (the word
Bearer, a space, then the token), and for POST set **Request Body** to **JSON**.

### "Add to family list"

1. **Ask for Input**: Text, prompt "What do we need?"
2. **Get Contents of URL**
   - URL: `https://family-voice.<subdomain>.workers.dev/grocery`
   - Method: POST, header as above
   - Request Body: JSON, add field `item` (Text) = *Provided Input*
   - Optional: add field `by` (Text) = `papa` (or `daddy` on Scott's phone)
3. **Speak Text**: *Contents of URL*
4. Rename the shortcut "Add to family list".

### "Chore done"

1. **Choose from Menu**, prompt "Who?", options `Wren` and `Ellis`. In each branch add
   a **Text** action with `wren` or `ellis`, then after the menu a **Set Variable**
   `kid` = *Menu Result*. (On a kid's own phone, skip the menu and just use a Text
   action with their name.)
2. **Ask for Input**: Text, prompt "Which chore?"
3. **Get Contents of URL**
   - URL: `https://family-voice.<subdomain>.workers.dev/chore`
   - Method: POST, header as above
   - Request Body: JSON, fields `kid` = *kid*, `chore` = *Provided Input*
4. **Speak Text**: *Contents of URL*
5. Rename it "Chore done".

### "My points"

1. Same "Who?" menu as above, setting `kid` (or a fixed Text on a kid's phone).
2. **Get Contents of URL**
   - URL: `https://family-voice.<subdomain>.workers.dev/points?kid=` followed by the
     *kid* variable
   - Method: GET, header as above
3. **Speak Text**: *Contents of URL*
4. Rename it "My points".

A redeem shortcut works the same way as "Chore done": POST to `/redeem` with fields
`kid` and `reward`. It refuses politely if there aren't enough points.

## 3. Suggested Siri phrases

The phrase is the shortcut's name, so name them in the language you'll speak. You can
make a German copy of each with the same steps.

| Shortcut | English | German |
|---|---|---|
| Add to family list | "Add to family list" | "Auf die Einkaufsliste" |
| Chore done | "Chore done" | "Aufgabe erledigt" |
| My points | "My points" | "Meine Punkte" |
| Redeem | "Spend my points" | "Punkte einlösen" |

Short, distinct names work best. Avoid names that clash with built-in Siri commands
such as "Add to list" or "Reminders".

## 4. HomePod

HomePod runs personal Shortcuts only when it recognises the voice of the iPhone owner
the Shortcut belongs to. Turn on **Recognise My Voice** and **Personal Requests** in the
Home app (Home settings > your name), and make sure the shortcut is on that person's
iPhone. Kids without their own iPhone and Apple ID can't trigger them on the HomePod
by voice; a parent can say "Chore done" and answer "Ellis".

## Security notes

- The token is the only thing protecting writes. Treat it like a password. To rotate:
  `npx wrangler secret put VOICE_TOKEN`, then update the header in each Shortcut.
- Shortcuts shared via iCloud link include the header value. Don't share them publicly.
