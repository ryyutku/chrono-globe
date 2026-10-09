# chrono-globe

must work for all 5 layers and scenarios
1. "Our time" / "local time"
   └─ Works only when everyone is in the same zone

2. Common abbreviation (EST, JST, GST)
   └─ Works when context makes it unambiguous

3. Regional name (Eastern, Central, Moscow Time)
   └─ Works within countries that have multiple zones

4. UTC offset (UTC−5, UTC+5:30)
   └─ Always unambiguous, but requires mental math

5. IANA zone name (America/New_York, Asia/Colombo)
   └─ Always unambiguous, machine-readable, but verbose
