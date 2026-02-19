# Timer Shortcut -- Reliable Setup Guide (No 0-Second Timers)

This version avoids regex parsing and uses two direct questions, which is much more reliable with Siri.

Trigger flow:
- You say: "Hey Siri, timer"
- Siri asks: "What should the timer be called?"
- Siri asks: "How many minutes?"
- Shortcut posts `duration_seconds = minutes * 60`

## Before You Start

You need:
- Supabase Project URL
- Supabase anon key

From Supabase Dashboard:
1. Open your project
2. Go to **Settings > API**
3. Copy **Project URL**
4. Copy **anon public** key

## Build the Shortcut

Create a new shortcut named **Timer**.

### 1) Ask for timer label

1. Add **Ask for Input**
2. Type: **Text**
3. Prompt: `What should the timer be called?`
4. Rename this action output to `timerName` (optional but recommended)

### 2) Ask for minutes

5. Add another **Ask for Input**
6. Type: **Number**
7. Prompt: `How many minutes?`
8. Rename this output to `minutesInput` (optional)

### 3) Convert minutes to seconds

9. Add **Calculate**
10. Set calculation to: `minutesInput x 60`
11. Rename output to `durationSeconds` (optional)

### 4) Save Supabase values

12. Add **Text** action with your Project URL, rename to `supabaseUrl`
13. Add **Text** action with your anon key, rename to `anonKey`

### 5) Build JSON body

14. Add **Text** action with this exact template:

```json
{"label":"[timerName]","duration_seconds":[durationSeconds],"created_by":"siri"}
```

In Shortcuts, insert `timerName` and `durationSeconds` as variables, not literal text.

### 6) POST to Supabase

15. Add **Get Contents of URL**
16. URL: `[supabaseUrl]/rest/v1/timers`
17. Method: **POST**
18. Headers:
   - `apikey`: `[anonKey]`
   - `Authorization`: `Bearer [anonKey]`
   - `Content-Type`: `application/json`
19. Request Body: use the Text JSON from Step 14

### 7) Confirmation

20. Add **Show Result**
21. Text: `[timerName] timer set`

## Critical Checks

- `duration_seconds` must use the **Calculate** result (minutes x 60)
- Do not send `duration_seconds: 0`
- The minutes question must be **Number**, not Text

## Quick Test

1. Run shortcut manually
2. Name: `Pasta`
3. Minutes: `10`
4. Confirm dashboard shows a live 10-minute countdown (not immediate Done)

## Troubleshooting

- Timer completes instantly:
  - Your `duration_seconds` variable is wrong or empty
  - Recheck Steps 9-11 and Step 14 variable insertion
- Network error:
  - Validate `supabaseUrl` and `anonKey`
  - Ensure URL ends with `/rest/v1/timers`
- Works in app but not with Siri:
  - Re-record shortcut phrase
  - Test again with shorter timer names
