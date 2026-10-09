from datetime import datetime
from zoneinfo import ZoneInfo


# timezone = input("Enter timezone ex:(Asia/Kolkata)")
# dt = datetime(2026, 3, 15, 12, 0, tzinfo=ZoneInfo(timezone))

dt = datetime(2026, 3, 15, 12, 0, tzinfo=ZoneInfo("America/New_York"))

print("UTC offset:", dt.utcoffset())
print("DST:",dt.dst())

import zoneinfo # Pulls from the system's IANA database (fewer entries)
import pytz # includes aliases and historical zones (many more entries)

print("Available timezones",len(zoneinfo.available_timezones()))
print("All timezones",len(pytz.all_timezones))

# ---- Naive replace trap ----
dt = datetime(2026, 7, 1, 12, 0)
ny = pytz.timezone("America/New_York")

# Wrong way (naive replace trap)
print(ny.localize(dt)) #correct
print(dt.replace(tzinfo=ny)) #incorrect, doesn't adjust offset


# --- Convert between zones ---
dt_ny = datetime(2026, 7, 1, 12, 0, tzinfo=ZoneInfo("America/New_York"))
dt_ist = dt_ny.astimezone(ZoneInfo("Asia/Kolkata"))
print("NY time:", dt_ny)
print("IST time:", dt_ist)

# --- DST fold handling ---
from datetime import datetime, timedelta

# Example: DST ends in New York on Nov 1,2026 at 2 AM
dt = datetime(2026, 11, 1, 1, 30, tzinfo=ZoneInfo("America/New_York"))
print("Before fold:", dt, dt.utcoffset())

# Add 1 hour
dt_plus = dt + timedelta(hours=1)
print("After fold:", dt_plus, dt_plus.utcoffset())