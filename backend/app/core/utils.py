from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC 'now'. We store all datetimes as naive UTC and add the 'Z' on the way out."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(value: datetime) -> datetime:
    """Normalise any incoming datetime (aware or naive) to naive UTC."""
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value
