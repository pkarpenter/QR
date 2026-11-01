from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any


def compute_qr_analytics(
    scans: List[Dict[str, Any]],
    links: List[Dict[str, Any]],
    days: int = 30
) -> Dict[str, Any]:
    """
    Compute comprehensive analytics for a QR code given its raw scans and links.
    Returns:
    - kpis: total_scans, today, unique_visitors, avg_per_day
    - daily: [{date, count, link_id, link_title}]
    - devices: [{device, count, percentage}]
    - cities: top 10 [{city, count}]
    - hours: 0-23 [{hour, count}]
    - top_device, top_city, peak_hour, best_day
    """
    total = len(scans)
    now = datetime.now(timezone.utc)
    today_str = now.date().isoformat()
    yesterday_str = (now.date() - timedelta(days=1)).isoformat()

    today_scans = 0
    yesterday_scans = 0
    unique_ips = set()
    link_map = {str(l.get("id")): l.get("title", "Untitled") for l in links}

    # Hourly buckets (0..23)
    hour_counts = [0] * 24

    # Daily counts & breakdown by date & link
    daily_link_counts: Dict[str, Dict[str, int]] = {}
    daily_totals: Dict[str, int] = {}
    
    # Initialize last N days in daily_totals
    for d in range(days - 1, -1, -1):
        day_date = (now.date() - timedelta(days=d)).isoformat()
        daily_totals[day_date] = 0
        daily_link_counts[day_date] = {}

    # Category buckets
    device_counts: Dict[str, int] = {}
    city_counts: Dict[str, int] = {}
    os_counts: Dict[str, int] = {}
    browser_counts: Dict[str, int] = {}

    for s in scans:
        ts = s.get("scanned_at", "")
        # Date & time parsing
        date_part = ts[:10] if len(ts) >= 10 else ""
        if date_part == today_str:
            today_scans += 1
        elif date_part == yesterday_str:
            yesterday_scans += 1

        if "T" in ts and len(ts) >= 13:
            try:
                hour = int(ts[11:13])
                if 0 <= hour <= 23:
                    hour_counts[hour] += 1
            except (ValueError, TypeError):
                pass

        if date_part in daily_totals:
            daily_totals[date_part] += 1
            lid = str(s.get("link_id") or "unlinked")
            daily_link_counts[date_part][lid] = daily_link_counts[date_part].get(lid, 0) + 1

        # Unique visitors
        ip_hash = s.get("ip_hash")
        if ip_hash:
            unique_ips.add(ip_hash)

        # Breakdowns
        dev = s.get("device") or "Desktop"
        device_counts[dev] = device_counts.get(dev, 0) + 1

        city = s.get("city")
        if city and city != "Unknown":
            city_counts[city] = city_counts.get(city, 0) + 1

        os_name = s.get("os") or "Unknown"
        os_counts[os_name] = os_counts.get(os_name, 0) + 1

        browser = s.get("browser") or "Unknown"
        browser_counts[browser] = browser_counts.get(browser, 0) + 1

    unique_visitors_count = len(unique_ips)
    avg_per_day = round(total / max(days, 1), 1)

    # Format daily list
    daily_list = []
    for date_key in sorted(daily_totals.keys()):
        total_for_day = daily_totals[date_key]
        links_for_day = daily_link_counts.get(date_key, {})
        if not links_for_day:
            daily_list.append({
                "date": date_key,
                "count": total_for_day,
                "link_id": None,
                "link_title": "No scans"
            })
        else:
            for lid, count in links_for_day.items():
                daily_list.append({
                    "date": date_key,
                    "count": count,
                    "link_id": lid if lid != "unlinked" else None,
                    "link_title": link_map.get(lid, "Active Link")
                })

    # Device list with percentage
    devices_list = []
    for dev, count in sorted(device_counts.items(), key=lambda x: -x[1]):
        pct = round((count / total) * 100, 1) if total > 0 else 0
        devices_list.append({"device": dev, "count": count, "percentage": pct})

    # Top 10 cities
    top_cities = [
        {"city": city, "count": count}
        for city, count in sorted(city_counts.items(), key=lambda x: -x[1])[:10]
    ]

    # Hours 0..23
    hours_list = [{"hour": h, "count": count} for h, count in enumerate(hour_counts)]

    # Best day & peak hour
    best_day = max(daily_totals.items(), key=lambda x: x[1])[0] if daily_totals and total > 0 else "—"
    peak_hour_idx = hour_counts.index(max(hour_counts)) if total > 0 else 0
    peak_hour = f"{peak_hour_idx:02d}:00" if total > 0 else "—"
    top_device = devices_list[0]["device"] if devices_list else "—"
    top_city = top_cities[0]["city"] if top_cities else "—"

    return {
        "kpis": {
            "total_scans": total,
            "today": today_scans,
            "yesterday": yesterday_scans,
            "unique_visitors": unique_visitors_count,
            "unique_percentage": round((unique_visitors_count / total) * 100, 1) if total > 0 else 0,
            "avg_per_day": avg_per_day,
        },
        "daily": daily_list,
        "devices": devices_list,
        "cities": top_cities,
        "hours": hours_list,
        "top_device": top_device,
        "top_city": top_city,
        "peak_hour": peak_hour,
        "best_day": best_day,
        # Keep backward compatibility for existing analytics consumers
        "total": total,
        "today": today_scans,
        "unique_visitors": unique_visitors_count,
        "scans_by_device": [{"label": d["device"], "count": d["count"]} for d in devices_list],
        "scans_by_city": [{"label": c["city"], "count": c["count"]} for c in top_cities],
        "scans_by_os": [{"label": k, "count": v} for k, v in sorted(os_counts.items(), key=lambda x: -x[1])],
        "scans_by_browser": [{"label": k, "count": v} for k, v in sorted(browser_counts.items(), key=lambda x: -x[1])],
        "hour_histogram": hours_list,
    }
