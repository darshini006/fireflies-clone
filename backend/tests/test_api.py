PASTED = """[00:05] Ana Ruiz: Let's kick off the sprint review.
[00:30] Ben Cole: Shipped the login fix.
It also removes the old redirect.
[01:10] Ana Ruiz: Great, thanks."""


def make_meeting(client, **overrides):
    body = {"title": "Test meeting", "participants": ["Ana Ruiz", "Ben Cole"], **overrides}
    res = client.post("/api/meetings", json=body)
    assert res.status_code == 201, res.text
    return res.json()


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200 and res.json()["status"] == "ok"


def test_me(client):
    assert client.get("/api/me").json()["email"]


def test_seeded_meetings_sorted_newest_first(client):
    data = client.get("/api/meetings", params={"limit": 100}).json()
    assert data["total"] >= 5
    dates = [m["meeting_date"] for m in data["items"]]
    assert dates == sorted(dates, reverse=True)
    assert dates[0].endswith("Z")
    assert data["items"][0]["participants"]


def test_sort_oldest(client):
    items = client.get("/api/meetings", params={"sort": "oldest", "limit": 100}).json()["items"]
    dates = [m["meeting_date"] for m in items]
    assert dates == sorted(dates)


def test_search_by_title_and_participant(client):
    by_title = client.get("/api/meetings", params={"q": "standup"}).json()
    assert by_title["total"] == 1
    by_person = client.get("/api/meetings", params={"q": "jordan"}).json()
    assert by_person["total"] == 1


def test_filter_by_participant_and_date(client):
    people = client.get("/api/participants").json()
    meera = next(p for p in people if p["name"] == "Meera Nair")
    res = client.get("/api/meetings", params={"participant_id": meera["id"]}).json()
    assert res["total"] == 1
    assert client.get("/api/meetings", params={"date_from": "2999-01-01"}).json()["total"] == 0
    assert client.get("/api/meetings", params={"date_to": "2000-01-01"}).json()["total"] == 0


def test_pagination(client):
    res = client.get("/api/meetings", params={"limit": 2, "page": 1}).json()
    assert len(res["items"]) == 2 and res["total"] >= 5


def test_create_from_form(client):
    m = make_meeting(client, duration_seconds=600)
    assert m["source"] == "form" and m["duration_seconds"] == 600
    assert [p["name"] for p in m["participants"]] == ["Ana Ruiz", "Ben Cole"]
    assert client.get(f"/api/meetings/{m['id']}/transcript").json()["segments"] == []
    summary = client.get(f"/api/meetings/{m['id']}/summary").json()
    assert summary["overview"] is None and summary["chapters"] == []


def test_create_from_pasted_transcript(client):
    m = make_meeting(client, transcript_text=PASTED, participants=[])
    assert m["source"] == "paste" and m["duration_seconds"] >= 70
    segs = client.get(f"/api/meetings/{m['id']}/transcript").json()["segments"]
    assert [s["position"] for s in segs] == [0, 1, 2]
    assert segs[0]["speaker"]["name"] == "Ana Ruiz" and segs[0]["start_ms"] == 5000
    assert segs[1]["start_ms"] < segs[1]["end_ms"] <= 70000
    assert "old redirect" in segs[1]["text"]
    assert sorted(p["name"] for p in m["participants"]) == ["Ana Ruiz", "Ben Cole"]


def test_bad_transcript_is_422(client):
    res = client.post("/api/meetings", json={"title": "x", "transcript_text": "no speaker here"})
    assert res.status_code == 422


def test_blank_title_is_422(client):
    assert client.post("/api/meetings", json={"title": "   "}).status_code == 422


def test_update_meeting(client):
    m = make_meeting(client)
    res = client.patch(
        f"/api/meetings/{m['id']}", json={"title": "Renamed", "participants": ["Ana Ruiz", "Zed"]}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Renamed"
    assert sorted(p["name"] for p in body["participants"]) == ["Ana Ruiz", "Zed"]


def test_delete_meeting_cascades(client):
    m = make_meeting(client, transcript_text=PASTED)
    item = client.post(f"/api/meetings/{m['id']}/action-items", json={"text": "Do it"}).json()
    assert client.delete(f"/api/meetings/{m['id']}").status_code == 204
    assert client.get(f"/api/meetings/{m['id']}").status_code == 404
    assert client.get(f"/api/meetings/{m['id']}/transcript").status_code == 404
    assert client.patch(f"/api/action-items/{item['id']}", json={"text": "x"}).status_code == 404


def test_seeded_transcript_summary_and_items(client):
    items = client.get("/api/meetings", params={"limit": 100}).json()["items"]
    mid = next(m["id"] for m in items if m["title"] == "Q4 Product Roadmap Planning")
    segs = client.get(f"/api/meetings/{mid}/transcript").json()["segments"]
    assert len(segs) >= 10
    assert all(s["speaker"] for s in segs)
    assert [s["start_ms"] for s in segs] == sorted(s["start_ms"] for s in segs)
    assert all(s["end_ms"] > s["start_ms"] for s in segs)

    summary = client.get(f"/api/meetings/{mid}/summary").json()
    assert summary["overview"] and len(summary["chapters"]) >= 3
    assert [c["position"] for c in summary["chapters"]] == sorted(c["position"] for c in summary["chapters"])

    items = client.get(f"/api/meetings/{mid}/action-items").json()
    assert len(items) >= 3 and all(i["assignee"] for i in items)


def test_action_item_crud_and_toggle(client):
    m = make_meeting(client)
    ana = m["participants"][0]

    created = client.post(
        f"/api/meetings/{m['id']}/action-items",
        json={"text": "Write docs", "assignee_id": ana["id"], "due_date": "2030-01-31"},
    )
    assert created.status_code == 201
    item = created.json()
    assert item["is_completed"] is False and item["assignee"]["name"] == "Ana Ruiz"

    done = client.patch(f"/api/action-items/{item['id']}", json={"is_completed": True}).json()
    assert done["is_completed"] is True and done["text"] == "Write docs"

    edited = client.patch(
        f"/api/action-items/{item['id']}", json={"text": "Write the docs", "assignee_id": None}
    ).json()
    assert edited["text"] == "Write the docs" and edited["assignee"] is None
    assert edited["due_date"] == "2030-01-31"  # untouched fields stay as they were

    assert client.patch(f"/api/action-items/{item['id']}", json={"text": None}).status_code == 422
    assert client.delete(f"/api/action-items/{item['id']}").status_code == 204
    assert client.get(f"/api/meetings/{m['id']}/action-items").json() == []


def test_assignee_must_be_participant(client):
    m = make_meeting(client)
    outsider = next(p for p in client.get("/api/participants").json() if p["name"] == "Jordan Blake")
    res = client.post(
        f"/api/meetings/{m['id']}/action-items", json={"text": "x", "assignee_id": outsider["id"]}
    )
    assert res.status_code == 422


def test_removing_participant_clears_their_assignments(client):
    m = make_meeting(client)
    ben = next(p for p in m["participants"] if p["name"] == "Ben Cole")
    item = client.post(
        f"/api/meetings/{m['id']}/action-items", json={"text": "x", "assignee_id": ben["id"]}
    ).json()
    client.patch(f"/api/meetings/{m['id']}", json={"participants": ["Ana Ruiz"]})
    items = client.get(f"/api/meetings/{m['id']}/action-items").json()
    assert items[0]["id"] == item["id"] and items[0]["assignee"] is None


def test_unknown_meeting_is_404(client):
    assert client.get("/api/meetings/999999").status_code == 404
    assert client.get("/api/meetings/999999/summary").status_code == 404
