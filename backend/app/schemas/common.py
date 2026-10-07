from datetime import datetime, timezone
from typing import Annotated

from pydantic import PlainSerializer


def _to_iso_z(value: datetime) -> str:
    # Datetimes are stored as naive UTC; send them with an explicit 'Z' so browsers
    # don't misread them as local time.
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


UTCDatetime = Annotated[datetime, PlainSerializer(_to_iso_z, return_type=str)]
