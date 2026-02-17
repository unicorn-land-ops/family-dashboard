# Timer Shortcut -- Step-by-Step Creation Guide

This guide walks you through creating an Apple Shortcut that starts kitchen timers on the family dashboard via Siri.

**Trigger:** "Hey Siri, timer"
**Siri asks:** "What timer would you like to set?"
**You say:** "pasta 10 minutes"
**Siri confirms:** "pasta timer set for 10 minutes"

Features:
- Parses name and duration from a single phrase ("pasta 10 minutes")
- If duration is missing, Siri asks a follow-up question
- Supports seconds, minutes, and hours
- No maximum duration limit
- Duplicate timer names are allowed (multiple simultaneous timers)
- Retries once on network failure, then shows an error

## Before You Start

You need your Supabase **Project URL** and **anon key**. See [README.md](README.md) for where to find them.

## Create the Shortcut

Open the **Shortcuts** app on your iPhone. Tap **+** to create a new Shortcut. Tap the name at the top and rename it to **Timer**.

### Step 1: Ask for Input

1. Tap **Add Action**
2. Search for **Ask for Input** and add it
3. Set **Type** to **Text**
4. Set **Prompt** to: `What timer would you like to set?`

### Step 2: Set Up Supabase Configuration Variables

5. Add a **Text** action
6. Set the text to your Supabase project URL (e.g., `[YOUR_SUPABASE_URL]`)
7. Long-press the action, tap **Rename**, name it `supabaseUrl`

8. Add another **Text** action
9. Set the text to your Supabase anon key (e.g., `[YOUR_ANON_KEY]`)
10. Long-press the action, tap **Rename**, name it `anonKey`

### Step 3: Save the Raw Input

11. Add a **Set Variable** action
12. Set **Variable Name** to: `rawInput`
13. Set **Value** to: `Provided Input` (from Step 1)

### Step 4: Try to Match Duration in the Input

14. Add a **Match Text** action
15. Set **Pattern** to: `(\d+)\s*(seconds?|minutes?|hours?)`
16. Enable **Regular Expression** (should be on by default for Match Text)
17. Set **Input** to: `rawInput`

This regex looks for a number followed by a time unit (e.g., "10 minutes", "5 seconds", "1 hour").

### Step 5: Check If a Duration Was Found

18. Add an **If** action
19. Set the condition: `Matches` (from Step 15) **has any value**

#### If Duration Was Found (Steps 20-27):

20. Add a **Get Group from Matched Text** action
21. Set **Group** to: `1` (the number)
22. Set **Input** to: `Matches` (first match)
23. Add a **Set Variable** action
24. Set **Variable Name** to: `durationNumber`
25. Set **Value** to: the result from Step 21

26. Add another **Get Group from Matched Text** action
27. Set **Group** to: `2` (the unit)
28. Set **Input** to: `Matches` (first match)
29. Add a **Set Variable** action
30. Set **Variable Name** to: `durationUnit`
31. Set **Value** to: the result from Step 27

Now extract the timer name by removing the duration from the input:

32. Add a **Replace Text** action
33. Set **Find** to: `\s*\d+\s*(seconds?|minutes?|hours?)\s*`
34. Enable **Regular Expression**
35. Set **Replace with** to: (leave empty)
36. Set **Input** to: `rawInput`
37. Add a **Replace Text** action (trim whitespace)
38. Set **Find** to: `^\s+|\s+$`
39. Enable **Regular Expression**
40. Set **Replace with** to: (leave empty)
41. Set **Input** to: the result from Step 36
42. Add a **Set Variable** action
43. Set **Variable Name** to: `timerName`
44. Set **Value** to: the result from Step 41

45. Add an **If** action
46. Set the condition: `timerName` **does not have any value** (empty after removing duration)
47. In the **If** path:
    - Add a **Set Variable** action
    - Set `timerName` to: `Timer` (default name if only a duration was provided)
48. Add **End If**

#### If No Duration Found (Otherwise path, Steps 49-62):

49. In the **Otherwise** section of the If from Step 19:

50. Add a **Set Variable** action
51. Set **Variable Name** to: `timerName`
52. Set **Value** to: `rawInput` (the entire input is the timer name)

53. Add an **Ask for Input** action
54. Set **Type** to **Text**
55. Set **Prompt** to: `How long should the timer be?`

56. Add a **Match Text** action
57. Set **Pattern** to: `(\d+)\s*(seconds?|minutes?|hours?)`
58. Set **Input** to: `Provided Input` (from Step 55)

59. Add a **Get Group from Matched Text** action
60. Set **Group** to: `1`
61. Add a **Set Variable** action, set `durationNumber` to the result

62. Add another **Get Group from Matched Text** action
63. Set **Group** to: `2`
64. Add a **Set Variable** action, set `durationUnit` to the result

65. Add **End If** (closes the If from Step 19)

### Step 6: Convert Duration to Seconds

66. Add an **If** action
67. Set the condition: `durationUnit` **contains** `hour`

68. In the **If** path:
    - Add a **Calculate** action: `durationNumber` **x** `3600`
    - Add a **Set Variable** action, set `durationSeconds` to the result

69. In the **Otherwise** path:
    - Add an **If** action
    - Set the condition: `durationUnit` **contains** `minute`

70. In the inner **If** path:
    - Add a **Calculate** action: `durationNumber` **x** `60`
    - Add a **Set Variable** action, set `durationSeconds` to the result

71. In the inner **Otherwise** path (seconds):
    - Add a **Set Variable** action, set `durationSeconds` to `durationNumber`

72. Add **End If** (inner)
73. Add **End If** (outer)

### Step 7: Get the Current Time in ISO 8601 Format

74. Add a **Date** action (Current Date)
75. Add a **Format Date** action
76. Set **Date Format** to: **Custom**
77. Set the custom format string to: `yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ`
78. Set **Input** to: `Current Date`
79. Add a **Set Variable** action
80. Set **Variable Name** to: `isoNow`
81. Set **Value** to: the formatted date string

This produces a proper ISO 8601 timestamp with timezone offset (e.g., `2026-02-17T16:30:00.000-06:00`).

### Step 8: Send the Timer to Supabase (with Retry)

82. Add a **Repeat** action
83. Set **Count** to: `2`

84. Inside the Repeat, add a **Get Contents of URL** action
85. Build the URL: `[supabaseUrl]/rest/v1/timers`
86. Set **Method** to: **POST**
87. Tap **Headers** and add:
    - `apikey`: `[anonKey variable]`
    - `Authorization`: `Bearer [anonKey variable]`
    - `Content-Type`: `application/json`
88. Tap **Request Body** and set to **JSON**
89. Add these key-value pairs:
    - `label`: `timerName` variable -- set type to **Text**
    - `duration_seconds`: `durationSeconds` variable -- set type to **Number**
    - `started_at`: `isoNow` variable -- set type to **Text**

90. Add an **If** action
91. Set the condition: `Contents of URL` **has any value**
92. In the **If** path:
    - Add a **Set Variable** action, set `postSuccess` to `done`
93. **Otherwise**:
    - Do nothing (retry via loop)
94. Add **End If**
95. Add **End Repeat**

### Step 9: Handle Network Failure

96. Add an **If** action
97. Set the condition: `postSuccess` **is not** `done`

98. In the **If** path:
    - Add a **Show Result** action
    - Set the text to: `Couldn't reach the dashboard`
    - Add a **Stop This Shortcut** action

99. Add **End If**

### Step 10: Show Confirmation

100. Add a **Show Result** action
101. Set the text to: `[timerName] timer set for [durationNumber] [durationUnit]`
     - Tap the text field and insert the `timerName`, `durationNumber`, and `durationUnit` variables

When triggered via Siri, this confirmation is spoken aloud.

## Testing

1. **Tap the play button** in the Shortcuts app to test with typed input
2. Type: `pasta 10 minutes`
3. Verify: Shows "pasta timer set for 10 minutes"
4. Check the wall display -- a 10-minute pasta timer should appear

Test the duration prompt:
1. Run the Shortcut again
2. Type: `tea`
3. Verify: Asks "How long should the timer be?"
4. Type: `5 minutes`
5. Verify: Shows "tea timer set for 5 minutes"

Test with Siri:
1. Say **"Hey Siri, timer"**
2. When prompted, say **"eggs 7 minutes"**
3. Verify the timer appears on the wall display

## Troubleshooting

- **"Couldn't reach the dashboard"** -- Check that `supabaseUrl` and `anonKey` are correct. Verify your internet connection.
- **Duration not detected** -- Siri may transcribe "ten" as the word instead of "10". If this happens, say the number clearly or use digits when typing. A future update could add word-to-number mapping.
- **Timer shows wrong remaining time** -- Make sure the Format Date action uses the format `yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ` which includes the timezone offset. Without it, the time may be interpreted as UTC.
- **Timer not appearing on wall display** -- Verify the Supabase realtime publication includes the `timers` table (it should already be configured).
