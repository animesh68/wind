from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo
from app.core.timestamps import (
    parse_iso_datetime,
    format_iso_utc,
    calculate_settlement_period,
    get_day_ahead_cutoff
)

def test_parse_iso_datetime():
    dt = parse_iso_datetime("2026-01-01T12:00:00Z")
    assert dt.year == 2026
    assert dt.month == 1
    assert dt.day == 1
    assert dt.hour == 12
    assert dt.tzinfo is not None

def test_format_iso_utc():
    dt = datetime(2026, 1, 15, 11, 30, tzinfo=timezone.utc)
    s = format_iso_utc(dt)
    assert s == "2026-01-15T11:30:00Z"

def test_calculate_settlement_period():
    # 00:00 UTC on Jan 1 is SP 1
    dt1 = datetime(2026, 1, 1, 0, 0, tzinfo=timezone.utc)
    d_str, sp1 = calculate_settlement_period(dt1)
    assert d_str == "2026-01-01"
    assert sp1 == 1

    # 23:30 UTC on Jan 1 is SP 48
    dt48 = datetime(2026, 1, 1, 23, 30, tzinfo=timezone.utc)
    _, sp48 = calculate_settlement_period(dt48)
    assert sp48 == 48

def test_get_day_ahead_cutoff():
    # For delivery on 2026-01-02, default 11:00 cutoff should be 2026-01-01T11:00:00Z
    d = date(2026, 1, 2)
    cutoff = get_day_ahead_cutoff(d, "11:00")
    assert cutoff.year == 2026
    assert cutoff.month == 1
    assert cutoff.day == 1
    assert cutoff.hour == 11
    assert cutoff.minute == 0
