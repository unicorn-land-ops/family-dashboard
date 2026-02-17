# Grocery Shortcut -- Step-by-Step Creation Guide

This guide walks you through creating an Apple Shortcut that adds grocery items to the family dashboard via Siri.

**Trigger:** "Hey Siri, grocery"
**Siri asks:** "What would you like to add?"
**You say:** "milk, eggs, and bread"
**Siri confirms:** "Added milk, eggs, bread"

Features:
- Multiple items in one command (separated by commas or "and")
- Duplicate items are silently skipped (case-insensitive)
- Quantities as part of the name ("2 milk" stays as "2 milk")
- Retries once on network failure, then shows an error

## Before You Start

You need your Supabase **Project URL** and **anon key**. See [README.md](README.md) for where to find them.

## Create the Shortcut

Open the **Shortcuts** app on your iPhone. Tap **+** to create a new Shortcut. Tap the name at the top and rename it to **Grocery**.

### Step 1: Ask for Input

1. Tap **Add Action**
2. Search for **Ask for Input** and add it
3. Set **Type** to **Text**
4. Set **Prompt** to: `What would you like to add?`

This captures the user's voice input. When triggered via Siri, the user speaks their response.

### Step 2: Set Up Supabase Configuration Variables

5. Add a **Text** action
6. Set the text to your Supabase project URL (e.g., `[YOUR_SUPABASE_URL]`)
7. Long-press the action, tap **Rename**, name it `supabaseUrl`

8. Add another **Text** action
9. Set the text to your Supabase anon key (e.g., `[YOUR_ANON_KEY]`)
10. Long-press the action, tap **Rename**, name it `anonKey`

### Step 3: Parse Multi-Item Input

11. Add a **Replace Text** action
12. Set **Find** to: ` and `  (with spaces on both sides)
13. Set **Replace with** to: `,`
14. Set **Input** to: `Provided Input` (from Step 1)

15. Add a **Split Text** action
16. Set **Separator** to **Custom**
17. Set the custom separator to: `,`
18. Set **Input** to: `Updated Text` (from Step 12)

This converts "milk, eggs, and bread" into a list: ["milk", " eggs", " bread"].

### Step 4: Initialize the Added Items Tracker

19. Add a **Set Variable** action
20. Set **Variable Name** to: `addedItems`
21. Set **Value** to an empty **Text** action (just leave it blank)

### Step 5: Begin the Loop

22. Add a **Repeat with Each** action
23. Set **Input** to: `Split Text` (from Step 16)

Everything from Step 24 to Step 43 goes INSIDE this Repeat with Each block.

### Step 6: Trim Whitespace from Each Item

24. Inside the loop, add a **Replace Text** action
25. Set **Find** to: `^\s+|\s+$`  (enable **Regular Expression**)
26. Set **Replace with** to: (leave empty)
27. Set **Input** to: `Repeat Item`

This trims leading and trailing spaces from each item.

### Step 7: Skip Empty Items

28. Add an **If** action
29. Set the condition: `Updated Text` (from Step 25) **has any value**

Everything from Step 30 to Step 42 goes inside this If block.

### Step 8: URL-Encode the Item Name

30. Add a **URL Encode** action
31. Set **Input** to: `Updated Text` (the trimmed item name from Step 25)

This ensures item names with spaces (like "orange juice") are properly encoded for the URL.

### Step 9: Check for Duplicates (with Retry)

32. Add a **Set Variable** action
33. Set **Variable Name** to: `retryCount`
34. Set **Value** to: `0`

35. Add a **Repeat** action
36. Set **Count** to: `2`

37. Inside the Repeat, add a **Get Contents of URL** action
38. Tap the URL field and build it by combining:
    - Variable: `supabaseUrl` (from Step 6)
    - Text: `/rest/v1/groceries?name=ilike.`
    - Variable: `URL Encoded Text` (from Step 31)
    - Text: `&checked=eq.false&select=id`

    The full URL looks like: `[supabaseUrl]/rest/v1/groceries?name=ilike.[encodedItem]&checked=eq.false&select=id`

39. Set **Method** to: **GET**
40. Tap **Headers** and add:
    - `apikey`: `[anonKey variable]`
    - `Authorization`: tap the value, type `Bearer `, then insert the `anonKey` variable

41. Add an **If** action after Get Contents of URL
42. Set the condition: `Contents of URL` **has any value**
43. In the **If** path (result has value -- meaning the request succeeded):
    - Add a **Text** action set to `done`
    - Add a **Set Variable** action, set `retryCount` to `done`

44. In the **Otherwise** path (request failed):
    - Do nothing (the Repeat loop will retry)

45. Add **End If**
46. Add **End Repeat**

### Step 10: Evaluate the Duplicate Check Result

47. Add a **Count** action
48. Set **Type** to: **Items**
49. Set **Input** to: `Contents of URL` (the response from the GET request)

50. Add an **If** action
51. Set the condition: `Count` **is** `0`

This means no duplicate was found -- proceed with inserting the item.

### Step 11: Insert the Grocery Item (with Retry)

52. Inside the "Count is 0" If block, add a **Repeat** action
53. Set **Count** to: `2`

54. Inside the Repeat, add a **Get Contents of URL** action
55. Build the URL: `[supabaseUrl]/rest/v1/groceries`
56. Set **Method** to: **POST**
57. Tap **Headers** and add:
    - `apikey`: `[anonKey variable]`
    - `Authorization`: `Bearer [anonKey variable]`
    - `Content-Type`: `application/json`
58. Tap **Request Body** and set to **JSON**
59. Add these key-value pairs:
    - `name`: `Updated Text` (the trimmed item name from Step 25) -- set type to **Text**
    - `checked`: `false` -- set type to **Boolean**
    - `added_by`: `siri` -- set type to **Text**

60. Add an **If** action to check for success
61. Set the condition: `Contents of URL` **has any value**
62. In the **If** path (success):
    - Add a **Text** action set to `done`
    - This breaks the retry intent (the loop will run its remaining iteration harmlessly)
63. **Otherwise** (failure):
    - Do nothing (retry via loop)
64. Add **End If**
65. Add **End Repeat**

66. After the POST Repeat block, add an **Add to Variable** action
67. Set **Variable Name** to: `addedItems`
68. Set **Value** to: `Updated Text` (the trimmed item name)

### Step 12: Close All Blocks

69. Add **End If** (closes "Count is 0" from Step 51)
70. Add **End If** (closes "has any value" from Step 29)
71. **End Repeat** (closes the Repeat with Each from Step 23)

### Step 13: Handle Network Failure

72. Add an **If** action
73. Set the condition: Check if `retryCount` **is not** `done`
74. In the **If** path:
    - Add a **Show Result** action
    - Set the text to: `Couldn't reach the dashboard`
    - Add a **Stop This Shortcut** action (optional -- prevents the confirmation below)
75. Add **End If**

### Step 14: Show Confirmation

76. Add an **If** action
77. Set the condition: `addedItems` **has any value**

78. In the **If** path:
    - Add a **Show Result** action
    - Set the text to: `Added [addedItems]`
    - (When Siri speaks this, it reads the list naturally)

79. In the **Otherwise** path:
    - Add a **Show Result** action
    - Set the text to: `Already on the list`

80. Add **End If**

## Testing

1. **Tap the play button** in the Shortcuts app to test with typed input
2. Type: `milk, eggs, and bread`
3. Verify: Shows "Added milk, eggs, bread"
4. Run again with: `milk`
5. Verify: Shows "Already on the list" (duplicate detected)

Then test with Siri:
1. Say **"Hey Siri, grocery"**
2. When prompted, say **"milk and eggs"**
3. Verify items appear on the wall display

## Troubleshooting

- **"Couldn't reach the dashboard"** -- Check that `supabaseUrl` and `anonKey` are correct. Verify your internet connection.
- **Duplicates not detected** -- Make sure the GET URL uses `ilike` (not `eq`) for case-insensitive matching.
- **"orange juice" split into two items** -- Make sure you are only splitting by commas, not by spaces. The "Replace Text" action should only replace ` and ` with `,`.
- **Items not appearing on wall display** -- Verify the Supabase realtime publication includes the `groceries` table (it should already be configured).
