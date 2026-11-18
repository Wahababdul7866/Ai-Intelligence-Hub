import re
import ast
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from app.services.dataset_service import DatasetService
from app.services.ollama_service import OllamaService
from app.schemas.schemas import AnalystQueryResponse, AnalystChartConfig

class SafeAstValidator(ast.NodeVisitor):
    ALLOWED_CALLS = {
        'groupby', 'agg', 'mean', 'sum', 'median', 'min', 'max', 'count',
        'sort_values', 'head', 'tail', 'nlargest', 'nsmallest', 'value_counts',
        'round', 'reset_index', 'to_dict', 'fillna', 'dropna', 'describe', 'corr'
    }
    
    ALLOWED_MODULES = set()  # No external imports allowed

    def __init__(self):
        self.is_safe = True
        self.reasons = []

    def visit_Import(self, node):
        self.is_safe = False
        self.reasons.append("Imports are forbidden.")

    def visit_ImportFrom(self, node):
        self.is_safe = False
        self.reasons.append("Imports are forbidden.")

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            if node.func.id not in {'len', 'int', 'float', 'round', 'str', 'list', 'dict', 'set'}:
                self.is_safe = False
                self.reasons.append(f"Function call '{node.func.id}' is not allowed.")
        elif isinstance(node.func, ast.Attribute):
            if node.func.attr not in self.ALLOWED_CALLS:
                self.is_safe = False
                self.reasons.append(f"Method '{node.func.attr}' is not in the safe whitelist.")
        self.generic_visit(node)

class AnalystService:
    @classmethod
    def execute_safe_query(
        cls,
        df: pd.DataFrame,
        query: str
    ) -> Tuple[Any, str, str, Optional[AnalystChartConfig], Optional[List[Dict[str, Any]]]]:
        """
        Interprets natural language question into safe pandas execution,
        returning (computed_result, executed_operation, interpreted_intent, chart_config, chart_data).
        """
        q_lower = query.lower().strip()
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        cat_cols = [c for c in df.columns if c not in num_cols]

        # 1. Average / Mean query
        if any(w in q_lower for w in ["average", "mean", "avg"]):
            target_col = None
            for c in num_cols:
                if c.lower() in q_lower:
                    target_col = c
                    break
            if not target_col and num_cols:
                target_col = num_cols[0]
            
            # Check for groupby
            group_col = None
            for c in cat_cols:
                if c.lower() in q_lower or f"by {c.lower()}" in q_lower:
                    group_col = c
                    break

            if group_col and target_col:
                res_df = df.groupby(group_col)[target_col].mean().round(2).reset_index()
                res_df = res_df.sort_values(by=target_col, ascending=False).head(10)
                chart_data = res_df.to_dict(orient="records")
                chart_config = AnalystChartConfig(
                    chart_type="bar",
                    x_key=group_col,
                    y_keys=[target_col],
                    title=f"Average {target_col} by {group_col}"
                )
                op = f"df.groupby('{group_col}')['{target_col}'].mean().sort_values(ascending=False)"
                intent = f"Calculate average {target_col} grouped by {group_col}"
                return res_df.to_dict(orient="records"), op, intent, chart_config, chart_data
            
            elif target_col:
                val = float(round(df[target_col].mean(), 2))
                op = f"round(df['{target_col}'].mean(), 2)"
                intent = f"Compute overall average of {target_col}"
                return val, op, intent, None, None

        # 2. Highest / Maximum / Top
        if any(w in q_lower for w in ["highest", "maximum", "max", "top", "best"]):
            target_col = None
            for c in num_cols:
                if c.lower() in q_lower:
                    target_col = c
                    break
            if not target_col and num_cols:
                target_col = num_cols[0]

            group_col = None
            for c in cat_cols:
                if c.lower() in q_lower:
                    group_col = c
                    break

            if group_col and target_col:
                res_df = df.groupby(group_col)[target_col].sum().round(2).reset_index()
                res_df = res_df.sort_values(by=target_col, ascending=False).head(8)
                chart_data = res_df.to_dict(orient="records")
                chart_config = AnalystChartConfig(
                    chart_type="bar",
                    x_key=group_col,
                    y_keys=[target_col],
                    title=f"Total {target_col} by {group_col}"
                )
                op = f"df.groupby('{group_col}')['{target_col}'].sum().nlargest(8)"
                top_row = res_df.iloc[0].to_dict()
                intent = f"Identify category with highest {target_col}"
                return {"top_performer": top_row, "rankings": chart_data}, op, intent, chart_config, chart_data
            elif target_col:
                val = float(round(df[target_col].max(), 2))
                op = f"df['{target_col}'].max()"
                intent = f"Find maximum value of {target_col}"
                return val, op, intent, None, None

        # 3. Lowest / Minimum
        if any(w in q_lower for w in ["lowest", "minimum", "min", "bottom"]):
            target_col = None
            for c in num_cols:
                if c.lower() in q_lower:
                    target_col = c
                    break
            if not target_col and num_cols:
                target_col = num_cols[0]
            val = float(round(df[target_col].min(), 2))
            op = f"df['{target_col}'].min()"
            intent = f"Find minimum value of {target_col}"
            return val, op, intent, None, None

        # 4. Total / Sum
        if any(w in q_lower for w in ["total", "sum"]):
            target_col = None
            for c in num_cols:
                if c.lower() in q_lower:
                    target_col = c
                    break
            if not target_col and num_cols:
                target_col = num_cols[0]
            val = float(round(df[target_col].sum(), 2))
            op = f"round(df['{target_col}'].sum(), 2)"
            intent = f"Compute total sum of {target_col}"
            return val, op, intent, None, None

        # 5. Distribution / Breakdown / Counts
        if any(w in q_lower for w in ["distribution", "breakdown", "count", "category", "how many"]):
            group_col = None
            for c in cat_cols:
                if c.lower() in q_lower:
                    group_col = c
                    break
            if not group_col and cat_cols:
                group_col = cat_cols[0]

            if group_col:
                counts = df[group_col].value_counts().head(8).reset_index()
                counts.columns = [group_col, "count"]
                chart_data = counts.to_dict(orient="records")
                chart_config = AnalystChartConfig(
                    chart_type="pie",
                    x_key=group_col,
                    y_keys=["count"],
                    title=f"Distribution of {group_col}"
                )
                op = f"df['{group_col}'].value_counts().head(8)"
                intent = f"Analyze frequency breakdown for {group_col}"
                return chart_data, op, intent, chart_config, chart_data

        # 6. Default Fallback Summary
        first_col = num_cols[0] if num_cols else df.columns[0]
        desc = df[first_col].describe().round(2).to_dict()
        op = f"df['{first_col}'].describe()"
        intent = f"Statistical summary of {first_col}"
        return desc, op, intent, None, None

    @classmethod
    async def analyze_query(
        cls,
        dataset_id: str,
        file_path: str,
        query: str,
        model: Optional[str] = None
    ) -> AnalystQueryResponse:
        df = DatasetService.load_dataframe(file_path)
        computed_res, op, intent, chart_cfg, chart_data = cls.execute_safe_query(df, query)
        
        is_num = isinstance(computed_res, (int, float))

        # Generate explanatory narrative
        explanation_prompt = (
            f"User asked: '{query}'.\n"
            f"Dataset Columns: {', '.join(df.columns.tolist()[:15])}\n"
            f"Executed Computation: {op}\n"
            f"Exact Computed Result: {computed_res}\n\n"
            "Provide a concise, 2-sentence executive summary of this analytical finding. "
            "Highlight the exact computed numbers and what business decision or observation they imply."
        )

        llm_res = await OllamaService.generate_response(
            prompt=explanation_prompt,
            system_prompt="You are an expert Data Analyst presenting verified dataset metrics.",
            model=model
        )

        explanation = llm_res.get("response", "")
        if not llm_res.get("is_local_ollama"):
            if is_num:
                explanation = f"Computation completed: The calculated value is {computed_res:,.2f} based on verified dataset records."
            else:
                explanation = f"Analytical query evaluated successfully. Generated breakdown based on {len(df)} records."

        return AnalystQueryResponse(
            query=query,
            interpreted_intent=intent,
            executed_operation=op,
            computed_result=computed_res,
            is_numerical=is_num,
            explanation=explanation,
            chart_config=chart_cfg,
            chart_data=chart_data
        )
