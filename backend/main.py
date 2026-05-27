import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

state = {"df": None}


def read_file(contents: bytes, filename: str) -> pd.DataFrame:
    ext = filename.lower().split('.')[-1]
    if ext == 'csv':
        try:
            return pd.read_csv(io.BytesIO(contents))
        except Exception:
            return pd.read_csv(io.BytesIO(contents), delimiter=';')
    elif ext in ['xlsx', 'xls']:
        return pd.read_excel(io.BytesIO(contents))
    elif ext == 'json':
        try:
            return pd.read_json(io.BytesIO(contents))
        except Exception:
            return pd.json_normalize(pd.read_json(io.BytesIO(contents), typ='series').tolist())
    elif ext == 'tsv':
        return pd.read_csv(io.BytesIO(contents), sep='\t')
    else:
        # fallback: try csv
        return pd.read_csv(io.BytesIO(contents))


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = read_file(contents, file.filename)
        state["df"] = df

        if len(df) < 5:
            return {"status": "error", "message": "Dataset too small for analysis (minimum 5 rows required)"}

        columns = df.columns.tolist()
        types = {
            col: "Numeric" if pd.api.types.is_numeric_dtype(df[col]) else "Categorical"
            for col in columns
        }

        numeric_cols = [c for c in columns if types[c] == "Numeric"]

        if len(numeric_cols) == 0:
            return {"status": "error", "message": "No numeric data detected in this dataset"}

        preview = df.head(100).replace({np.nan: None}).to_dict(orient="records")

        # ── Missing values analysis ────────────────────────────────────────────
        missing_info = {}
        for col in columns:
            missing_count = int(df[col].isna().sum())
            missing_pct = round(missing_count / len(df) * 100, 1)
            missing_info[col] = {"count": missing_count, "pct": missing_pct}

        # ── Duplicate rows ─────────────────────────────────────────────────────
        duplicate_count = int(df.duplicated().sum())

        # ── Column-wise stats ──────────────────────────────────────────────────
        col_stats = {}
        for col in numeric_cols:
            s = df[col].dropna()
            if len(s) == 0:
                continue
            col_stats[col] = {
                "mean":   round(float(s.mean()), 4),
                "median": round(float(s.median()), 4),
                "min":    round(float(s.min()), 4),
                "max":    round(float(s.max()), 4),
                "std":    round(float(s.std()), 4),
            }

        # ── Categorical stats ──────────────────────────────────────────────────
        cat_stats = {}
        cat_cols = [c for c in columns if types[c] == "Categorical"]
        for col in cat_cols:
            s = df[col].dropna()
            vc = s.value_counts()
            cat_stats[col] = {
                "unique": int(s.nunique()),
                "top": vc.index[0] if len(vc) > 0 else None,
                "top_count": int(vc.iloc[0]) if len(vc) > 0 else 0,
            }

        # ── Insight report ────────────────────────────────────────────────────
        insights = []

        insights.append(f"Dataset contains {len(df)} rows and {len(columns)} columns "
                        f"({len(numeric_cols)} numeric, {len(columns) - len(numeric_cols)} categorical).")

        if duplicate_count > 0:
            insights.append(f"Found {duplicate_count} duplicate row(s) — consider removing them before analysis.")

        high_missing = [(col, info) for col, info in missing_info.items() if info['pct'] > 10]
        if high_missing:
            insights.append("High missing values in: " + ", ".join([f"{c} ({i['pct']}%)" for c, i in high_missing[:3]]))

        for col in numeric_cols[:4]:
            st = col_stats.get(col)
            if not st:
                continue
            insights.append(
                f"{col} — mean {st['mean']}, median {st['median']}, "
                f"range [{st['min']} – {st['max']}], σ = {st['std']}"
            )

        if numeric_cols:
            variances = {col: df[col].dropna().var() for col in numeric_cols}
            high_var_col = max(variances, key=variances.get)
            insights.append(f"Highest variance column: '{high_var_col}' (σ² = {round(variances[high_var_col], 2)})")

        corr_pairs = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                a, b = numeric_cols[i], numeric_cols[j]
                pair_df = df[[a, b]].dropna()
                if len(pair_df) < 3:
                    continue
                r = pair_df.corr().iloc[0, 1]
                if not np.isnan(r):
                    corr_pairs.append((a, b, round(float(r), 3)))

        if corr_pairs:
            strongest = max(corr_pairs, key=lambda x: abs(x[2]))
            direction = "positive" if strongest[2] > 0 else "negative"
            strength_word = (
                "strong" if abs(strongest[2]) > 0.7 else
                "moderate" if abs(strongest[2]) > 0.4 else "weak"
            )
            insights.append(
                f"Strongest correlation: '{strongest[0]}' ↔ '{strongest[1]}' "
                f"(r = {strongest[2]}, {strength_word} {direction})"
            )

        outlier_cols = []
        for col in numeric_cols:
            s = df[col].dropna()
            if len(s) < 5:
                continue
            mean, std = s.mean(), s.std()
            if std == 0:
                continue
            n_out = int(((s < mean - 3 * std) | (s > mean + 3 * std)).sum())
            if n_out > 0:
                outlier_cols.append(f"{col} ({n_out} outlier{'s' if n_out > 1 else ''})")

        if outlier_cols:
            insights.append("Potential outliers detected in: " + ", ".join(outlier_cols))
        else:
            insights.append("No extreme outliers detected (3σ rule) across numeric columns.")

        if len(numeric_cols) >= 2:
            first, last = numeric_cols[0], numeric_cols[-1]
            insights.append(
                f"General note: '{first}' and '{last}' are available as regression targets in Neural Lab."
            )

        # ── System relations ───────────────────────────────────────────────────
        system_relations = []
        for i in range(min(len(numeric_cols) - 1, 4)):
            a, b = numeric_cols[i], numeric_cols[i + 1]
            pair_df = df[[a, b]].dropna()
            if len(pair_df) < 3:
                continue
            r = pair_df.corr().iloc[0, 1]
            if not np.isnan(r):
                system_relations.append({"colA": a, "colB": b, "strength": round(float(r), 2)})

        # ── Full correlation matrix ────────────────────────────────────────────
        corr_matrix = None
        if len(numeric_cols) >= 2:
            cm = df[numeric_cols].corr().round(3)
            corr_matrix = {
                "columns": numeric_cols,
                "values":  cm.replace({np.nan: None}).values.tolist()
            }

        # ── Thresholds ─────────────────────────────────────────────────────────
        thresholds = {
            col: {"critical_high": float(df[col].mean() + 2 * df[col].std())}
            for col in numeric_cols
            if df[col].std() > 0
        }

        return {
            "status": "success",
            "preview": preview,
            "summary": {
                "columns":          columns,
                "types":            types,
                "total_rows":       len(df),
                "insights":         insights,
                "system_relations": system_relations,
                "col_stats":        col_stats,
                "cat_stats":        cat_stats,
                "corr_matrix":      corr_matrix,
                "thresholds":       thresholds,
                "missing_info":     missing_info,
                "duplicate_count":  duplicate_count,
                "file_type":        file.filename.split('.')[-1].upper(),
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/clean")
async def clean_data(action: str, column: str = None, fill_value: str = None):
    if state["df"] is None:
        return {"status": "error", "message": "No data loaded"}
    try:
        df = state["df"].copy()
        if action == "remove_duplicates":
            before = len(df)
            df = df.drop_duplicates()
            state["df"] = df
            return {"status": "success", "message": f"Removed {before - len(df)} duplicate rows", "rows": len(df)}
        elif action == "fill_missing" and column:
            if pd.api.types.is_numeric_dtype(df[column]):
                val = df[column].mean() if fill_value == "mean" else df[column].median() if fill_value == "median" else float(fill_value)
                df[column] = df[column].fillna(val)
            else:
                df[column] = df[column].fillna(fill_value or "Unknown")
            state["df"] = df
            return {"status": "success", "message": f"Filled missing values in '{column}'"}
        elif action == "drop_column" and column:
            df = df.drop(columns=[column])
            state["df"] = df
            return {"status": "success", "message": f"Dropped column '{column}'"}
        else:
            return {"status": "error", "message": "Unknown action"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/regression")
async def calculate_regression(x_col: str, y_col: str):
    if state["df"] is None:
        return {"status": "error", "message": "No data loaded. Upload a dataset first."}

    try:
        df_work = state["df"].copy()
        df_work[x_col] = pd.to_numeric(df_work[x_col], errors="coerce")
        df_work[y_col] = pd.to_numeric(df_work[y_col], errors="coerce")
        df_work = df_work[[x_col, y_col]].dropna()

        if len(df_work) < 2:
            return {"status": "error", "message": "Not enough numeric data for regression"}

        x = df_work[x_col].values
        y = df_work[y_col].values

        m, b = np.polyfit(x, y, 1)
        r    = float(np.corrcoef(x, y)[0, 1])

        y_pred = m * x + b
        ss_res = float(np.sum((y - y_pred) ** 2))
        ss_tot = float(np.sum((y - y.mean()) ** 2))
        r2     = round(1 - ss_res / ss_tot, 4) if ss_tot != 0 else 0.0

        insight = (
            "Strong Positive"   if r > 0.7  else
            "Strong Negative"   if r < -0.7 else
            "Moderate Positive" if r > 0.4  else
            "Moderate Negative" if r < -0.4 else
            "Weak / No Correlation"
        )

        points = [{"x": float(vx), "y": float(vy)} for vx, vy in zip(x[:500], y[:500])]
        x_min, x_max = float(x.min()), float(x.max())

        return {
            "status":   "success",
            "equation": f"y = {round(m, 4)}x + {round(b, 4)}",
            "slope":    round(float(m), 4),
            "intercept":round(float(b), 4),
            "r":        round(r, 4),
            "r2":       r2,
            "insight":  insight,
            "points":   points,
            "line":     [{"x": x_min, "y": float(m * x_min + b)},
                         {"x": x_max, "y": float(m * x_max + b)}]
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/correlation")
async def full_correlation(col_a: str, col_b: str):
    if state["df"] is None:
        return {"status": "error", "message": "No data loaded"}
    try:
        df_work = state["df"][[col_a, col_b]].dropna()
        df_work = df_work.apply(pd.to_numeric, errors="coerce").dropna()
        if len(df_work) < 3:
            return {"status": "error", "message": "Not enough data"}
        r = float(df_work.corr().iloc[0, 1])
        strength = (
            "strong"   if abs(r) >= 0.7 else
            "moderate" if abs(r) >= 0.4 else
            "weak"     if abs(r) >= 0.2 else
            "negligible"
        )
        direction = "positive" if r > 0 else "negative"
        return {
            "status":        "success",
            "r":             round(r, 4),
            "strength":      strength,
            "direction":     direction,
            "interpretation": f"{strength.capitalize()} {direction} correlation (r = {round(r, 4)})"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)