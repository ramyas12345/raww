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


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        state["df"] = df

        if len(df) < 10:
            return {"status": "error", "message": "Dataset too small for analysis (minimum 10 rows required)"}

        columns = df.columns.tolist()
        types = {
            col: "Numeric" if pd.api.types.is_numeric_dtype(df[col]) else "Categorical"
            for col in columns
        }

        numeric_cols = [c for c in columns if types[c] == "Numeric"]

        if len(numeric_cols) == 0:
            return {"status": "error", "message": "No numeric data detected in this dataset"}

        preview = df.head(100).replace({np.nan: None}).to_dict(orient="records")

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

        # ── Insight report (8–12 lines, rule-based) ───────────────────────────
        insights = []

        # 1. Dataset size
        insights.append(f"Dataset contains {len(df)} rows and {len(columns)} columns "
                        f"({len(numeric_cols)} numeric, {len(columns) - len(numeric_cols)} categorical).")

        # 2–5. Per-column stats
        for col in numeric_cols[:4]:
            st = col_stats.get(col)
            if not st:
                continue
            insights.append(
                f"{col} — mean {st['mean']}, median {st['median']}, "
                f"range [{st['min']} – {st['max']}], σ = {st['std']}"
            )

        # 6. Highest variance column
        if numeric_cols:
            variances = {col: df[col].dropna().var() for col in numeric_cols}
            high_var_col = max(variances, key=variances.get)
            insights.append(f"Highest variance column: '{high_var_col}' (σ² = {round(variances[high_var_col], 2)})")

        # 7–8. Correlation-based insights
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

        # 9. Anomaly / outlier check (values beyond mean ± 3σ)
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

        # 10. General trend note
        if len(numeric_cols) >= 2:
            first, last = numeric_cols[0], numeric_cols[-1]
            insights.append(
                f"General note: '{first}' and '{last}' are available as regression targets in Neural Lab."
            )

        # ── Pairwise correlations for system_relations panel ──────────────────
        system_relations = []
        for i in range(min(len(numeric_cols) - 1, 4)):
            a, b = numeric_cols[i], numeric_cols[i + 1]
            pair_df = df[[a, b]].dropna()
            if len(pair_df) < 3:
                continue
            r = pair_df.corr().iloc[0, 1]
            if not np.isnan(r):
                system_relations.append({"colA": a, "colB": b, "strength": round(float(r), 2)})

        # ── Correlation matrix (all numeric pairs) ────────────────────────────
        corr_matrix = None
        if len(numeric_cols) >= 2:
            cm = df[numeric_cols].corr().round(3)
            corr_matrix = {
                "columns": numeric_cols,
                "values":  cm.replace({np.nan: None}).values.tolist()
            }

        # ── Thresholds for critical cell highlighting ─────────────────────────
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
                "corr_matrix":      corr_matrix,
                "thresholds":       thresholds,
            }
        }

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

        # R²
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
    """Return Pearson r + interpretation for any two numeric columns."""
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