import pandas as pd
import numpy as np

def process_csv(file_path):
    # Load the data
    df = pd.read_csv(file_path)
    
    # 1. Basic Stats (Min, Max, Avg, Count)
    # We only calculate this for columns that contain numbers
    numeric_df = df.select_dtypes(include=[np.number])
    stats = {}
    if not numeric_df.empty:
        stats = {
            "mean": numeric_df.mean().round(2).to_dict(),
            "max": numeric_df.max().to_dict(),
            "min": numeric_df.min().to_dict(),
            "count": len(df)
        }

    # 2. Correlation (How columns relate to each other)
    correlation = {}
    if len(numeric_df.columns) > 1:
        correlation = numeric_df.corr().round(2).to_dict()

    # 3. Patterns (Detecting top recurring values/categories)
    patterns = {}
    for col in df.columns:
        # Get the top 3 most common values for every column
        patterns[col] = df[col].value_counts().head(3).to_dict()

    # 4. Data Summary (For the overview text)
    summary = {
        "total_rows": len(df),
        "total_cols": len(df.columns),
        "missing_values": int(df.isnull().sum().sum()),
        "numeric_cols": list(numeric_df.columns)
    }

    return {
        "columns": df.columns.tolist(),
        "stats": stats,
        "correlation": correlation,
        "patterns": patterns,
        "summary": summary,
        "raw_data": df.head(50).fillna("").to_dict(orient='records')
    }