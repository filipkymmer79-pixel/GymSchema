#!/usr/bin/env python3
"""Jobbmotorn: krypterar en ögonblicksbild av jobben till jobb/data.enc, som appen på telefonen läser.

Användning:  JM_KEY=<nyckel> python3 jobb/tools/export.py snapshot.json jobb/data.enc

Nyckeln är 32 slumpbyte i base64url utan "=". Samma nyckel finns bara i Filips telefon och i morgonkörningen,
så det som ligger här på GitHub går inte att läsa utan den (AES-256-GCM).
"""
import base64, json, os, sys, time

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

AAD = b"jobbmotorn-v1"


def b64u(b):
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def unb64u(s):
    s = s.strip()
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def main():
    if len(sys.argv) != 3:
        sys.exit("användning: JM_KEY=<nyckel> python3 export.py snapshot.json data.enc")
    key = unb64u(os.environ.get("JM_KEY", ""))
    if len(key) != 32:
        sys.exit("JM_KEY saknas eller är fel")
    with open(sys.argv[1], encoding="utf-8") as f:
        data = json.load(f)
    data["v"] = 1
    data.setdefault("at", int(time.time() * 1000))
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    iv = os.urandom(12)
    ct = AESGCM(key).encrypt(iv, raw, AAD)
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        json.dump({"v": 1, "iv": b64u(iv), "ct": b64u(ct)}, f)
    print("ok:", len(data.get("queue", [])), "i kön,", len(data.get("sent", [])), "skickade,", len(data.get("web", [])), "hemsidejobb")


if __name__ == "__main__":
    main()
