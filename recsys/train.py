"""
LightFM training pipeline (Phase 2). Free, no external APIs, no LLM.

Reads implicit feedback from Postgres (`interactions` + `reviews`), trains a
LightFM model, calibrates scores into a 0–100% "probability you'll like", and
writes per-user top-N into `rec_cache`. Designed to run nightly via cron.

Run:  DATABASE_URL=... python recsys/train.py
Deps: recsys/requirements.txt  (lightfm, scipy, numpy, psycopg2-binary, scikit-learn)

NOTE: This is the offline trainer for when data has accumulated. The live app
serves a transparent cold-start probability (backend/src/recsys) until then, and
falls back to it whenever a user/item is unknown to the model.
"""
import os
import math
import datetime as dt

import numpy as np
import psycopg2
from scipy.sparse import coo_matrix
from lightfm import LightFM
from lightfm.data import Dataset
from sklearn.linear_model import LogisticRegression

WEIGHTS = {"RATE_HIGH": 5, "RATE_GOOD": 4, "SAVE": 3, "VIEW": 2, "OPEN": 1}
HALF_LIFE_DAYS = 60.0
MODEL_VERSION = dt.date.today().isoformat()


def connect():
    url = os.environ["DATABASE_URL"]
    return psycopg2.connect(url)


def time_decay(created_at, now):
    days = max(0.0, (now - created_at).total_seconds() / 86400.0)
    return math.exp(-days / HALF_LIFE_DAYS)


def load(conn):
    now = dt.datetime.now(dt.timezone.utc)
    cur = conn.cursor()
    # implicit signals
    cur.execute("SELECT user_id, listing_id, weight, created_at FROM interactions")
    rows = cur.fetchall()
    # item side-features
    cur.execute("SELECT id, type, category, cuisine, price_level FROM listings")
    items = cur.fetchall()
    # explicit ratings → labels for score→probability calibration
    cur.execute(
        "SELECT user_id, listing_id, rating FROM reviews WHERE status = 'APPROVED'"
    )
    ratings = cur.fetchall()
    cur.close()
    return now, rows, items, ratings


def main():
    conn = connect()
    now, rows, items, ratings = load(conn)
    if len(rows) < 200:
        print(f"Too little data ({len(rows)} interactions) — cold-start stays in charge.")
        return

    ds = Dataset()
    users = {r[0] for r in rows}
    item_ids = [it[0] for it in items]
    item_feats = []
    for it in items:
        _id, _type, cat, cui, price = it
        feats = [f"type:{_type}", f"cat:{cat}", f"price:{price}"]
        if cui:
            feats += [f"cuisine:{c.strip()}" for c in str(cui).split(",") if c.strip()]
        item_feats.append((_id, feats))
    all_feats = sorted({f for _, fs in item_feats for f in fs})
    ds.fit(users=users, items=item_ids, item_features=all_feats)

    interactions = ((r[0], r[1], float(r[2]) * time_decay(r[3], now)) for r in rows)
    mat, weights = ds.build_interactions(interactions)
    item_features = ds.build_item_features(item_feats)

    model = LightFM(loss="warp", no_components=64, learning_rate=0.05)
    model.fit(mat, sample_weight=weights, item_features=item_features, epochs=30, num_threads=4)
    print("Model trained.")

    # ---- calibrate score → P(rating >= 8/10 i.e. >= 4/5) ----
    uidx, _, iidx, _ = ds.mapping()  # user map, ..., item map
    cal_x, cal_y = [], []
    for u, l, rating in ratings:
        if u in uidx and l in iidx:
            s = model.predict(uidx[u], np.array([iidx[l]]), item_features=item_features)[0]
            cal_x.append([s])
            cal_y.append(1 if rating >= 4 else 0)
    calibrator = None
    if len(set(cal_y)) == 2:
        calibrator = LogisticRegression().fit(np.array(cal_x), np.array(cal_y))

    def to_pct(score):
        if calibrator is None:
            return int(max(40, min(97, 50 + score * 8)))
        p = calibrator.predict_proba([[score]])[0][1]
        return int(max(40, min(97, p * 100)))

    # ---- top-N per user → rec_cache ----
    cur = conn.cursor()
    cur.execute(
        """CREATE TABLE IF NOT EXISTS rec_cache(
             user_id text, listing_id text, probability int, score double precision,
             reason text, rank int, model_version text,
             updated_at timestamptz DEFAULT now(), PRIMARY KEY(user_id, listing_id))"""
    )
    inv_item = {v: k for k, v in iidx.items()}
    n_items = len(iidx)
    for u, ui in uidx.items():
        scores = model.predict(ui, np.arange(n_items), item_features=item_features)
        top = np.argsort(-scores)[:50]
        for rank, ii in enumerate(top):
            lid, s = inv_item[ii], float(scores[ii])
            cur.execute(
                """INSERT INTO rec_cache(user_id,listing_id,probability,score,reason,rank,model_version,updated_at)
                   VALUES(%s,%s,%s,%s,%s,%s,%s,now())
                   ON CONFLICT(user_id,listing_id) DO UPDATE SET
                     probability=EXCLUDED.probability, score=EXCLUDED.score,
                     reason=EXCLUDED.reason, rank=EXCLUDED.rank,
                     model_version=EXCLUDED.model_version, updated_at=now()""",
                (u, lid, to_pct(s), s, "Пользователи с похожим вкусом оценили высоко", rank, MODEL_VERSION),
            )
    conn.commit()
    cur.close()
    conn.close()
    print(f"rec_cache updated. model_version={MODEL_VERSION}")


if __name__ == "__main__":
    main()
