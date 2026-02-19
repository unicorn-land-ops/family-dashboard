#!/usr/bin/env python3
"""Generate a minimal test Apple Shortcut to verify the sign+import pipeline."""
import plistlib
import uuid

shortcut = {
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowClientVersion": "2302.0.4",
    "WFWorkflowIcon": {
        "WFWorkflowIconStartColor": 4282601983,  # Blue
        "WFWorkflowIconGlyphNumber": 59511,
    },
    "WFWorkflowTypes": ["NCWidget", "WatchKit", "MenuBar"],
    "WFWorkflowInputContentItemClasses": [
        "WFStringContentItem",
    ],
    "WFWorkflowActions": [
        {
            "WFWorkflowActionIdentifier": "is.workflow.actions.ask",
            "WFWorkflowActionParameters": {
                "WFAskActionPrompt": "What would you like to test?",
                "WFInputType": "Text",
            },
        },
        {
            "WFWorkflowActionIdentifier": "is.workflow.actions.showresult",
            "WFWorkflowActionParameters": {
                "Text": {
                    "Value": {
                        "attachmentsByRange": {},
                        "string": "You said: test works!",
                    },
                    "WFSerializationType": "WFTextTokenString",
                },
            },
        },
    ],
}

output_path = "/tmp/test-shortcut-unsigned.shortcut"
with open(output_path, "wb") as f:
    plistlib.dump(shortcut, f, fmt=plistlib.FMT_BINARY)

print(f"Written unsigned shortcut to {output_path}")
