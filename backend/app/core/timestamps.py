from datetime import datetime, date, time, timedelta
from zoneinfo import ZoneInfo
from typing import Tuple, Optional

LONDON_TZ = ZoneInfo("Europe/London")
UTC_TZ = ZoneInfo("UTC")

def parse_iso_datetime(dt_str: str) -> datetime:
    """Parse an ISO 8601 timestamp string into a timezone-aware datetime."""
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC_TZ)
    return dt

def format_iso_utc(dt: datetime) -> str:
    """Format a datetime to standard UTC ISO 8601 string ending with Z."""
    utc_dt = dt.astimezone(UTC_TZ)
    return utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def calculate_settlement_period(start_dt_utc: datetime) -> Tuple[str, int]:
    """
    Calculate settlement date and settlement period (1-48) for a UTC start time
    under Europe/London settlement conventions.
    In the UK BSC:
    SP 1 is 00:00 to 00:30 local time.
    SP 48 is 23:30 to 24:00 local time.
    """
    local_dt = start_dt_utc.astimezone(LONDON_TZ)
    settlement_date = local_dt.strftime("%Y-%m-%d")
    sp = (local_dt.hour * 60 + local_dt.minute) // 30 + 1
    return settlement_date, sp

def get_day_ahead_cutoff(delivery_date: date, cutoff_time_str: str = "11:00") -> datetime:
    """
    Compute the day-ahead decision cutoff timestamp in UTC.
    Default assumption: 11:00 Europe/London on the calendar day before the delivery date.
    """
    parts = cutoff_time_str.split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    
    prev_day = delivery_date - timedelta(days=1)
    prev_day_cutoff_local = datetime(
        year=prev_day.year,
        month=prev_day.month,
        day=prev_day.day,
        hour=hour,
        minute=minute,
        second=0,
        microsecond=0,
        tzinfo=LONDON_TZ
    )
    return prev_day_cutoff_local.astimezone(UTC_TZ)

def format_hour_label(hour: int) -> str:
    """Format hour integer (0-23) to '00:00 - 01:00' format."""
    return f"{hour:02d}:00"
