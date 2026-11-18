"""
Script to generate synthetic benchmark datasets for AI Intelligence Hub.
Provides datasets for:
1. Classification: Customer Churn Prediction
2. Regression: Real Estate Housing Prices
3. Clustering: Customer Segmentation
4. Anomaly Detection: Financial Transaction Fraud
5. Document Intelligence: AI & Machine Learning Research Guide (TXT)
"""

import os
import numpy as np
import pandas as pd

def generate_datasets():
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "samples")
    os.makedirs(output_dir, exist_ok=True)
    np.random.seed(42)

    # 1. Customer Churn (Classification)
    n_churn = 1000
    tenure = np.random.randint(1, 72, size=n_churn)
    monthly_charges = np.random.uniform(20.0, 120.0, size=n_churn).round(2)
    total_charges = (tenure * monthly_charges + np.random.normal(0, 15, size=n_churn)).round(2)
    total_charges = np.maximum(total_charges, monthly_charges)
    contract = np.random.choice(["Month-to-month", "One year", "Two year"], size=n_churn, p=[0.55, 0.25, 0.20])
    internet_service = np.random.choice(["DSL", "Fiber optic", "No"], size=n_churn, p=[0.4, 0.45, 0.15])
    tech_support = np.random.choice(["Yes", "No"], size=n_churn, p=[0.35, 0.65])
    paperless_billing = np.random.choice(["Yes", "No"], size=n_churn, p=[0.6, 0.4])
    payment_method = np.random.choice(["Electronic check", "Mailed check", "Bank transfer", "Credit card"], size=n_churn)
    
    # Churn probability influenced by contract, monthly charges, tenure
    churn_logit = -1.5 + (0.02 * monthly_charges) - (0.04 * tenure) + (1.2 * (contract == "Month-to-month")) + (0.6 * (internet_service == "Fiber optic")) - (0.8 * (tech_support == "Yes"))
    churn_prob = 1 / (1 + np.exp(-churn_logit))
    churn = (np.random.rand(n_churn) < churn_prob).astype(int)

    df_churn = pd.DataFrame({
        "customer_id": [f"CUST-{10000 + i}" for i in range(n_churn)],
        "tenure_months": tenure,
        "monthly_charges": monthly_charges,
        "total_charges": total_charges,
        "contract": contract,
        "internet_service": internet_service,
        "tech_support": tech_support,
        "paperless_billing": paperless_billing,
        "payment_method": payment_method,
        "churn": churn
    })
    churn_path = os.path.join(output_dir, "customer_churn.csv")
    df_churn.to_csv(churn_path, index=False)
    print(f"Generated Churn dataset: {churn_path} ({len(df_churn)} rows)")

    # 2. Housing Prices (Regression)
    n_house = 800
    sqft = np.random.randint(600, 4500, size=n_house)
    bedrooms = np.random.choice([1, 2, 3, 4, 5], size=n_house, p=[0.1, 0.25, 0.4, 0.2, 0.05])
    bathrooms = (bedrooms * 0.75 + np.random.choice([0, 0.5, 1], size=n_house)).round(1)
    location_tier = np.random.choice(["Suburban", "Urban", "Downtown", "Rural"], size=n_house, p=[0.4, 0.3, 0.2, 0.1])
    age_years = np.random.randint(0, 50, size=n_house)
    has_garage = np.random.choice(["Yes", "No"], size=n_house, p=[0.75, 0.25])
    
    tier_mult = {"Downtown": 1.45, "Urban": 1.2, "Suburban": 1.0, "Rural": 0.75}
    mult_col = np.array([tier_mult[t] for t in location_tier])
    
    price = (80000 + (sqft * 160) + (bedrooms * 18000) + (bathrooms * 14000) - (age_years * 1200) + ((has_garage == "Yes") * 22000)) * mult_col
    price = np.round(price + np.random.normal(0, 15000, size=n_house), -2)
    price = np.maximum(price, 50000)

    df_house = pd.DataFrame({
        "property_id": [f"PROP-{20000 + i}" for i in range(n_house)],
        "square_feet": sqft,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "location_tier": location_tier,
        "age_years": age_years,
        "has_garage": has_garage,
        "price_usd": price
    })
    house_path = os.path.join(output_dir, "housing_prices.csv")
    df_house.to_csv(house_path, index=False)
    print(f"Generated Housing Prices dataset: {house_path} ({len(df_house)} rows)")

    # 3. Customer Segmentation (Clustering)
    n_clusters_pts = 600
    ages = np.random.randint(18, 70, size=n_clusters_pts)
    annual_income_k = np.random.randint(15, 140, size=n_clusters_pts)
    spending_score = np.random.randint(1, 100, size=n_clusters_pts)
    loyalty_years = np.random.randint(1, 10, size=n_clusters_pts)
    gender = np.random.choice(["Male", "Female"], size=n_clusters_pts)

    df_cluster = pd.DataFrame({
        "customer_id": [f"SEG-{30000 + i}" for i in range(n_clusters_pts)],
        "age": ages,
        "gender": gender,
        "annual_income_k": annual_income_k,
        "spending_score": spending_score,
        "loyalty_years": loyalty_years
    })
    cluster_path = os.path.join(output_dir, "customer_segmentation.csv")
    df_cluster.to_csv(cluster_path, index=False)
    print(f"Generated Customer Segmentation dataset: {cluster_path} ({len(df_cluster)} rows)")

    # 4. Financial Transaction Fraud (Anomaly Detection)
    n_fraud = 1200
    n_anomalies = 60
    
    amount_normal = np.random.exponential(scale=65.0, size=n_fraud - n_anomalies).round(2)
    p_hours = np.array([0.02]*6 + [0.05]*12 + [0.04]*6)
    p_hours = p_hours / np.sum(p_hours)
    hour_normal = np.random.choice(range(24), size=n_fraud - n_anomalies, p=p_hours)
    trans_type_normal = np.random.choice(["Purchase", "Transfer", "Payment", "Cash-Out"], size=n_fraud - n_anomalies, p=[0.6, 0.15, 0.2, 0.05])
    distance_normal = np.random.exponential(scale=12.0, size=n_fraud - n_anomalies).round(1)
    
    amount_anom = np.random.uniform(1500.0, 9500.0, size=n_anomalies).round(2)
    hour_anom = np.random.choice([1, 2, 3, 4], size=n_anomalies)
    trans_type_anom = np.random.choice(["Transfer", "Cash-Out"], size=n_anomalies)
    distance_anom = np.random.uniform(150.0, 2500.0, size=n_anomalies).round(1)

    amounts = np.concatenate([amount_normal, amount_anom])
    hours = np.concatenate([hour_normal, hour_anom])
    trans_types = np.concatenate([trans_type_normal, trans_type_anom])
    distances = np.concatenate([distance_normal, distance_anom])
    is_fraud = np.array([0] * (n_fraud - n_anomalies) + [1] * n_anomalies)

    indices = np.arange(n_fraud)
    np.random.shuffle(indices)

    df_fraud = pd.DataFrame({
        "transaction_id": [f"TXN-{40000 + i}" for i in range(n_fraud)],
        "amount": amounts[indices],
        "hour_of_day": hours[indices],
        "transaction_type": trans_types[indices],
        "distance_from_home_miles": distances[indices],
        "is_fraud": is_fraud[indices]
    })
    fraud_path = os.path.join(output_dir, "transaction_fraud.csv")
    df_fraud.to_csv(fraud_path, index=False)
    print(f"Generated Transaction Fraud dataset: {fraud_path} ({len(df_fraud)} rows)")

    # 5. Technical Research Document for RAG
    rag_doc_content = """# Deep Learning and Retrieval-Augmented Generation Architecture Report

## 1. Executive Summary
This document provides an in-depth technical analysis of Retrieval-Augmented Generation (RAG), local large language model (LLM) execution, and automated machine learning (AutoML) pipelines. Modern enterprise AI requires high-precision semantic retrieval paired with verifiable reasoning to eliminate hallucinations and protect proprietary information.

## 2. RAG Methodology & Embedding Architecture
The RAG pipeline operates through a multi-stage process:
1. Document Ingestion and Preprocessing: Source documents (PDFs, Markdown, TXT) are normalized, removing artifacts and boilerplate.
2. Text Chunking: Content is split into chunks of approximately 500 characters with a 10% sliding window overlap to maintain contextual continuity across chunk boundaries.
3. Dense Vector Embeddings: Each chunk is encoded using open-source transformer models such as Sentence-Transformers (all-MiniLM-L6-v2), producing 384-dimensional dense vectors.
4. Vector Storage and Similarity Search: Embeddings are indexed into a local FAISS (Facebook AI Similarity Search) index utilizing L2 Euclidean distance or Inner Product cosine similarity.
5. Grounded Prompt Synthesis: The top-K retrieved chunks (typically K=3 to 5) are injected into the system context window of the local LLM with strict instructions to answer strictly based on provided context.

## 3. Local Model Inference & Privacy
By employing local inference engines like Ollama running models such as Llama 3.2, Mistral 7B, or Phi-3 Mini, organizations retain 100% data sovereignty. No proprietary data or customer queries leave the local host or enterprise network.

## 4. Automated Machine Learning (AutoML) Standards
The automated machine learning system implements:
- Problem Detection: Evaluates target cardinality and data types to dynamically route between Binary Classification, Multiclass Classification, and Continuous Regression.
- Feature Preprocessing: Imputes missing numerical values with median strategies and categorical values with mode strategies, followed by One-Hot Encoding for low cardinality and Standard Scaling for numerical distributions.
- Model Training & Cross-Validation: Evaluates diverse algorithmic families including Random Forest, Gradient Boosting, XGBoost, and Logistic Regression with 5-fold cross-validation.
- Explainability with SHAP: Uses Shapley Additive Explanations to compute Shapley values for individual predictions, decomposing complex black-box model decisions into clear positive and negative feature attributions.

## 5. Key Findings and Conclusions
Our benchmarks demonstrate that:
1. Local RAG architectures achieve 96.4% factual accuracy when grounded with dense chunk retrieval.
2. Gradient Boosting and XGBoost achieve superior F1-scores on tabular structured data compared to uncalibrated deep neural networks.
3. Zero external cloud API calls are required to achieve state-of-the-art predictive performance, ensuring cost-effectiveness, zero vendor lock-in, and full offline resilience.
"""
    doc_path = os.path.join(output_dir, "ai_architecture_guide.txt")
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(rag_doc_content)
    print(f"Generated RAG sample document: {doc_path}")

if __name__ == "__main__":
    generate_datasets()
