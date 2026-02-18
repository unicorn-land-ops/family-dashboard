#!/usr/bin/env python3
"""
Generate Apple Shortcuts for the Family Dashboard.
Creates signed .shortcut files that can be opened directly on macOS/iOS.

Key format discovery: attachmentsByRange entries must be raw dicts
({Type, OutputUUID, OutputName}), NOT wrapped in WFSerializationType.
Named variables (Type: Variable) don't work in text attachments — use
ActionOutput magic variables instead.
"""
import plistlib
import uuid
import subprocess
import os
import sys

# Supabase config
SUPABASE_URL = "https://byefgblmsgxljdqzvjks.supabase.co"
ANON_KEY = "sb_publishable_FLFFYhLD5myZ6j-u08ky0g_xBFNoygj"

OUTPUT_DIR = "/tmp/family-dashboard-shortcuts"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def make_uuid():
    return str(uuid.uuid4()).upper()


def mv(output_uuid, output_name):
    """Magic variable attachment dict (raw, for use in attachmentsByRange)."""
    return {"OutputUUID": output_uuid, "OutputName": output_name, "Type": "ActionOutput"}


def mv_wrapped(output_uuid, output_name):
    """Magic variable wrapped with WFSerializationType (for WFInput, WFVariable, etc)."""
    return {
        "Value": mv(output_uuid, output_name),
        "WFSerializationType": "WFTextTokenAttachment",
    }


def var_attachment(var_name):
    """Named variable attachment dict (raw, for use in attachmentsByRange)."""
    return {"VariableName": var_name, "Type": "Variable"}


def var_wrapped(var_name):
    """Named variable wrapped (for WFInput, WFVariable, etc)."""
    return {
        "Value": var_attachment(var_name),
        "WFSerializationType": "WFTextTokenAttachment",
    }


def cond_input(wrapped_ref):
    """Wrap a variable reference for conditional (If) WFInput."""
    return {"Type": "Variable", "Variable": wrapped_ref}


def twv(parts):
    """
    Build WFTextTokenString. Parts: str (literal) or dict (raw attachment).
    Attachments must be raw dicts (mv() or var_attachment()), NOT wrapped.
    """
    full = ""
    atts = {}
    pos = 0
    for p in parts:
        if isinstance(p, str):
            full += p
            pos += len(p)
        else:
            atts[f"{{{pos}, 1}}"] = p
            full += "\ufffc"
            pos += 1
    return {
        "Value": {"attachmentsByRange": atts, "string": full},
        "WFSerializationType": "WFTextTokenString",
    }


def tl(s):
    """Text literal (no variables)."""
    return {
        "Value": {"attachmentsByRange": {}, "string": s},
        "WFSerializationType": "WFTextTokenString",
    }


def act(identifier, params=None):
    a = {"WFWorkflowActionIdentifier": identifier}
    if params:
        a["WFWorkflowActionParameters"] = params
    return a


def wrap_shortcut(actions, icon_color=4282601983, icon_glyph=59511):
    return {
        "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowMinimumClientVersionString": "900",
        "WFWorkflowClientVersion": "2302.0.4",
        "WFWorkflowIcon": {
            "WFWorkflowIconStartColor": icon_color,
            "WFWorkflowIconGlyphNumber": icon_glyph,
        },
        "WFWorkflowTypes": ["NCWidget", "WatchKit", "MenuBar"],
        "WFWorkflowInputContentItemClasses": ["WFStringContentItem"],
        "WFWorkflowActions": actions,
    }


def sign_shortcut(unsigned_path, signed_path):
    result = subprocess.run(
        ["shortcuts", "sign", "--mode", "anyone", "--input", unsigned_path, "--output", signed_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"Signing failed: {result.stderr}")
        sys.exit(1)


def make_post_action(url, key, json_text_uid, uid=None):
    """Build a POST action that sends a Text action's output as File body."""
    params = {
        "WFURL": tl(url),
        "Advanced": True,
        "WFHTTPMethod": "POST",
        "WFHTTPBodyType": "File",
        "WFRequestVariable": mv_wrapped(json_text_uid, "Text"),
        "ShowHeaders": True,
        "WFHTTPHeaders": {
            "Value": {"WFDictionaryFieldValueItems": [
                {"WFItemType": 0, "WFKey": tl("apikey"), "WFValue": tl(key)},
                {"WFItemType": 0, "WFKey": tl("Authorization"), "WFValue": tl(f"Bearer {key}")},
                {"WFItemType": 0, "WFKey": tl("Content-Type"), "WFValue": tl("application/json")},
            ]},
            "WFSerializationType": "WFDictionaryFieldValue",
        },
    }
    if uid:
        params["UUID"] = uid
    return act("is.workflow.actions.downloadurl", params)


# ═══════════════════════════════════════════════════════════
# GROCERY SHORTCUT
# ═══════════════════════════════════════════════════════════

def build_grocery_shortcut():
    """
    Simple and reliable: Ask → Build JSON → POST → Show confirmation.
    Matches the proven "melons" pattern exactly.
    """
    actions = []

    ask_uid = make_uuid()
    json_uid = make_uuid()
    post_uid = make_uuid()

    base_url = f"{SUPABASE_URL}/rest/v1/groceries"

    # 1. Ask for input
    actions.append(act("is.workflow.actions.ask", {
        "WFAskActionPrompt": "What would you like to add?",
        "WFInputType": "Text",
        "UUID": ask_uid,
    }))

    # 2. Build JSON body using magic var from Ask
    actions.append(act("is.workflow.actions.gettext", {
        "WFTextActionText": twv([
            '{"name":"', mv(ask_uid, "Provided Input"), '","checked":false,"added_by":"siri"}',
        ]),
        "UUID": json_uid,
    }))

    # 3. POST
    actions.append(make_post_action(base_url, ANON_KEY, json_uid, uid=post_uid))

    # 4. Show confirmation
    actions.append(act("is.workflow.actions.showresult", {
        "Text": twv(["Added ", mv(ask_uid, "Provided Input")]),
    }))

    return wrap_shortcut(actions, icon_color=431817727, icon_glyph=59496)


# ═══════════════════════════════════════════════════════════
# TIMER SHORTCUT
# ═══════════════════════════════════════════════════════════

def build_timer_shortcut():
    """
    Two separate asks: name + minutes. Calculate action converts minutes to
    seconds. POSTs real duration_seconds value so timers work immediately.
    """
    actions = []

    name_ask_uid = make_uuid()
    mins_ask_uid = make_uuid()
    calc_uid = make_uuid()
    json_uid = make_uuid()
    post_uid = make_uuid()

    base_url = f"{SUPABASE_URL}/rest/v1/timers"

    # 1. Ask for timer name
    actions.append(act("is.workflow.actions.ask", {
        "WFAskActionPrompt": "What should the timer be called?",
        "WFInputType": "Text",
        "UUID": name_ask_uid,
    }))

    # 2. Ask for duration in minutes
    actions.append(act("is.workflow.actions.ask", {
        "WFAskActionPrompt": "How many minutes?",
        "WFInputType": "Number",
        "UUID": mins_ask_uid,
    }))

    # 3. Calculate: minutes * 60 = seconds
    #    Input is implicitly the output of the previous action (mins Ask)
    actions.append(act("is.workflow.actions.math", {
        "WFMathOperand": 60,
        "WFMathOperation": "\u00d7",
        "UUID": calc_uid,
    }))

    # 4. Build JSON body with name from Ask 1 and seconds from Calculate
    actions.append(act("is.workflow.actions.gettext", {
        "WFTextActionText": twv([
            '{"label":"', mv(name_ask_uid, "Provided Input"),
            '","duration_seconds":', mv(calc_uid, "Calculation Result"),
            ',"created_by":"siri"}',
        ]),
        "UUID": json_uid,
    }))

    # 5. POST
    actions.append(make_post_action(base_url, ANON_KEY, json_uid, uid=post_uid))

    # 6. Confirm using timer name
    actions.append(act("is.workflow.actions.showresult", {
        "Text": twv(["Timer set: ", mv(name_ask_uid, "Provided Input")]),
    }))

    return wrap_shortcut(actions, icon_color=4251333119, icon_glyph=59548)


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

def main():
    shortcuts = {
        "Grocery": build_grocery_shortcut,
        "Timer": build_timer_shortcut,
    }

    for name, builder in shortcuts.items():
        print(f"\n{'='*50}")
        print(f"Building {name} shortcut...")
        shortcut_data = builder()

        unsigned = os.path.join(OUTPUT_DIR, f"{name}-unsigned.shortcut")
        signed = os.path.join(OUTPUT_DIR, f"{name}.shortcut")

        with open(unsigned, "wb") as f:
            plistlib.dump(shortcut_data, f, fmt=plistlib.FMT_BINARY)
        print(f"  Written unsigned: {unsigned}")

        sign_shortcut(unsigned, signed)
        print(f"  Signed: {signed}")

        size = os.path.getsize(signed)
        print(f"  Size: {size:,} bytes")

    print(f"\n{'='*50}")
    print(f"All shortcuts ready in: {OUTPUT_DIR}/")
    print(f"\nTo install, run:")
    print(f"  open '{OUTPUT_DIR}/Grocery.shortcut'")
    print(f"  open '{OUTPUT_DIR}/Timer.shortcut'")


if __name__ == "__main__":
    main()
