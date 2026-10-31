# WIND INTELLIGENCE — Video Demonstration & Pitch Scripts
**Target Total Duration**: Under 10 minutes (Split into two ~4:30 to 5:00 minute segments)

---

## PART 1 — CLIENT PITCH: UK UTILITY ENERGY PROCUREMENT TEAM
**Role**: Product Lead & Quantitative Energy Analyst pitching the pilot application to the UK utility power purchasing desk.  
**Target Duration**: ~4 minutes 45 seconds

---

### [00:00 – 00:45] The Commercial Business Problem & Stake
> *"Good morning everyone. Thank you for joining us today for the pilot presentation of **WIND INTELLIGENCE**.*
>
> *As an energy utility operating in the UK electricity wholesale market, your core mandate is ensuring that consumer electricity demand is reliably served at optimal procurement costs.*
>
> *Every single day before 11:00 AM, your procurement desk must make binding day-ahead purchase commitments. To determine how much thermal power—or flexible capacity—you need to buy in the day-ahead auction, you must subtract weather-dependent renewable generation like wind from your forecasted consumer demand.*
>
> *However, wind generation is inherently volatile. Forecasts are revised repeatedly leading up to delivery. If you procure too little because the forecast was overoptimistic, you face punitive imbalances in the UK Balancing Mechanism at peak system cash-out prices. If you over-procure because the forecast underestimated wind, you hold expensive surplus power. Today, we are proud to present **WIND INTELLIGENCE**: a workstation purpose-built to quantify forecast reliability and eliminate look-ahead bias from your procurement decisions."*

---

### [00:45 – 01:30] Introducing WIND INTELLIGENCE & Market Overview
> *(Screen Share: Navigate to Market Overview tab)*
>
> *"Here is your **Market Overview** workstation for the entire month of January 2026. Every data point you see is sourced directly from official Elexon BMRS feeds—specifically **FUELHH** for actual generation and **WINDFOR** for forecast publications.*
>
> *Immediately at the top, you see the macro picture for January 2026:*
> - *Total delivered wind generation was **8.62 Million MWh**.*
> - *The cumulative day-ahead forecast at your 11:00 AM cutoff predicted **9.99 Million MWh**.*
> - *The overall Mean Absolute Error (MAE) across all 1,488 half-hourly settlement periods was **2,126 MW**, with a Root Mean Squared Error of **2,621 MW**.*
> - *Derived Weighted Absolute Percentage Error (WAPE) was **18.4%**, representing an overall forecast accuracy of **81.6%**.*
>
> *Notice our dynamic insights cards: the workstation automatically identifies that **January 20th** delivered the highest accuracy, while also alerting your team to a structural **+1,840 MW Mean Bias Error**, meaning wind forecasts systematically over-predicted generation during 84.4% of the monthly intervals."*

---

### [01:30 – 02:30] Forecast Explorer: Settlement Period Granularity
> *(Screen Share: Navigate to Forecast Explorer tab, select Jan 15, SP 24)*
>
> *"Let's look at how your trading desk uses this on a daily operational basis in the **Forecast Explorer**.*
>
> *Traders can select any delivery date in January 2026. Here, on January 15th, you see all 48 half-hourly settlement periods. The green bars depict actual delivered generation, while the bright blue step line shows the exact forecast that was available to your team at the 11:00 AM day-ahead cutoff.*
>
> *When you select a specific settlement period—for instance, Settlement Period 24 (11:30 to 12:00 UTC)—our audit table displays the complete publication history.*
>
> *Notice that National Grid ESO issued multiple forecast versions for this single interval. Our platform highlights the exact version published prior to the 11:00 AM cutoff—here, published at 09:30 AM—and flags later revisions as 'Ineligible for Day-Ahead'. This guarantees that your team evaluates past decisions solely on information that was genuinely accessible when commitments were locked in."*

---

### [02:30 – 03:30] Accuracy Analytics & Diurnal Error Profiles
> *(Screen Share: Navigate to Accuracy Analytics tab)*
>
> *"Turning to **Accuracy Analytics**, we move from descriptive tracking to statistical error quantification.*
>
> *Your trading risk managers can filter by delivery date windows and specific hours of the day. In our scatter plot, you observe the tight clustering between forecast and actual generation, along with the 20-bin error distribution histogram centered at positive error values.*
>
> *Crucially, examine our **Diurnal Error Profile**. Wind forecast errors are not uniform throughout the day: error magnitudes vary significantly between early morning low-demand periods and evening peak hours. By understanding these hourly vulnerability patterns, your procurement team can apply dynamic safety buffers rather than a naive flat margin."*

---

### [03:30 – 04:15] Forecast Evolution: The Value of Publication Lead Time
> *(Screen Share: Navigate to Forecast Evolution tab)*
>
> *"On the **Forecast Evolution** tab, we answer a critical operational question: 'How did the forecast mature as delivery approached?'*
>
> *For any delivery period, this chart tracks the forecast trajectory as lead time decreases from 72 hours down to real-time. You can compare the earliest forecast, your 11:00 AM decision baseline, and the latest pre-delivery revision against the dashed green actual outturn.*
>
> *This reveals whether numerical weather models converged towards reality or suffered abrupt forecast busts—giving your intraday desk the insight needed to trade out of day-ahead positions in the within-day market."*

---

### [04:15 – 04:45] Conclusion & Commercial ROI
> *"In summary, **WIND INTELLIGENCE** provides your energy utility with:*
> 1. *100% verified Elexon data with zero look-ahead bias.*
> 2. *Quantified forecasting errors to optimize reserve procurement.*
> 3. *Substantial cost reductions in balancing mechanism exposure.*
>
> *We are excited to partner with your team to transition this pilot into your daily operational stack. Thank you."*

---
---

## PART 2 — TECHNICAL ARCHITECTURE & CODE REVIEW
**Role**: Senior Software Engineer & Technical Lead presenting system architecture, data engineering, and testing to the Internal Technical Reviewer.  
**Target Duration**: ~4 minutes 45 seconds

---

### [00:00 – 00:50] Architectural Overview & Technology Choices
> *"Hello everyone. In this second half, I'll walk through the technical architecture, design patterns, data pipelines, and engineering practices behind **WIND INTELLIGENCE**.*
>
> *Our design prioritizes clean separation of concerns, high throughput, zero external dependencies beyond Elexon BMRS, and reproducible analytical pipelines.*
>
> *The technology stack comprises:*
> - **Backend**: *Python 3.11 with FastAPI, Pydantic v2 for strict type contracts, and PyArrow for high-performance Parquet columnar storage.*
> - **Frontend**: *React 19 with TypeScript, Vite 8, Tailwind CSS, Lucide icons, and Recharts for interactive quantitative charting.*
> - **Containerization**: *Docker & Docker Compose for isolated, one-command deployment.*
> - **Test Suite**: *Pytest covering data ingestion, look-ahead bias prevention, analytics math, and end-to-end API integration."*

---

### [00:50 – 01:45] Elexon BMRS Integration & Data Pipeline
> *(Code Review: Inspect `backend/app/services/elexon_client.py` and `ingestion_service.py`)*
>
> *"Let's look at the data ingestion pipeline in `backend/app/services/`.*
>
> *Per the challenge specifications, the platform consumes two Elexon streams:*
> 1. `FUELHH/stream`: *Filtered strictly by `fuelType=WIND`. This supplies 1,488 actual half-hourly generation records for January 2026 (31 days × 48 settlement periods).*
> 2. `WINDFOR/stream`: *National wind generation forecast versions published by National Grid ESO. We ingested 19,856 forecast records across 272 distinct publication batches.*
>
> *Our `ElexonClient` implements resilient HTTP sessions configured with urllib3 exponential backoff and retry adapters for transient network faults.*
>
> *Crucially, we persist raw payloads as JSON archives in `data/raw/` and transform cleaned, deduplicated records into Apache Parquet files in `data/processed/`. Columnar Parquet enables sub-5-millisecond analytical aggregations across the entire month without burdening disk I/O or repeating remote API calls on startup."*

---

### [01:45 – 02:40] Eliminating Look-Ahead Bias: The Selection Algorithm
> *(Code Review: Inspect `backend/app/services/forecast_selection.py`)*
>
> *"The most critical engineering requirement is the **Forecast Version Selection Engine** in `forecast_selection.py`.*
>
> *In real-world energy trading, using a forecast published after gate closure to evaluate a day-ahead decision is a catastrophic look-ahead bias.*
>
> *Here is our selection algorithm:*
> 1. *For each delivery date $D$, we compute the preceding calendar day's cutoff timestamp: $(D - 1\text{ day})$ at the user-configured cutoff time (defaulting to 11:00 Europe/London, which is GMT in January).*
> 2. *We filter all forecast records targeting date $D$ to only those where `publish_time <= decision_cutoff`.*
> 3. *For each delivery interval, we identify the version with `max(publish_time)` among the eligible subset.*
> 4. *We preserve both the selected publication timestamp and its lead time.*
>
> *Additionally, we discovered a key domain nuance: Elexon BMRS publishes FUELHH at half-hourly intervals (`:00` and `:30`), whereas WINDFOR forecasts are published at hourly resolution (`:00`).*
>
> *Our engine supports two distinct matching modes: `mapped` (mapping the hourly forecast to both settlement periods of that hour, yielding 1,488 evaluated periods) and `exact` (evaluating only intervals with exact timestamp alignment, yielding 744 periods). Both modes are verified and switchable via API parameters."*

---

### [02:40 – 03:30] Analytics Engine Formulation & Precision
> *(Code Review: Inspect `backend/app/services/analytics_service.py`)*
>
> *"The analytical engine in `analytics_service.py` implements mathematically rigorous metrics using only valid, matched pairs:*
> - **Error Definition**: $\text{error} = \text{forecast} - \text{actual}$
> - **Mean Absolute Error (MAE)**: $\frac{1}{n} \sum |\text{forecast} - \text{actual}|$
> - **Root Mean Squared Error (RMSE)**: $\sqrt{\frac{1}{n} \sum (\text{forecast} - \text{actual})^2}$
> - **Mean Bias Error (MBE)**: $\frac{1}{n} \sum (\text{forecast} - \text{actual})$, where positive values denote overforecasting.
> - **Weighted Absolute Percentage Error (WAPE)**: $\frac{\sum |\text{forecast} - \text{actual}|}{\sum |\text{actual}|} \times 100\%$
> - **Derived Accuracy Indicator**: $\max(0, 100\% - \text{WAPE})$
>
> *We specifically adhere to the requirement of computing aggregated WAPE using total sums rather than averaging daily percentages, and we handle zero actual generation safely without divide-by-zero exceptions.*
> *Energy is explicitly converted to MWh using half-hourly factors ($\text{MW} \times 0.5\text{h}$)."*

---

### [03:30 – 04:15] Automated Test Suite & Code Quality
> *(Code Review: Inspect `backend/tests/`)*
>
> *"Testing is fundamental to our delivery. Our Pytest suite consists of 18 automated tests:*
> - `test_timestamps.py`: *Validates UK settlement period calculations (SP 1 to 48), timezone normalization, and D-1 cutoff computations.*
> - `test_analytics.py`: *Validates MAE, RMSE, MBE, and WAPE against manually calculated mathematical fixtures, plus edge cases for zero actuals and empty datasets.*
> - `test_forecast_selection.py`: *Tests version selection across 4 synthetic scenarios: single eligible version, multiple eligible versions, cutoff exact match, and strictly rejecting versions published after cutoff.*
> - `test_data_quality.py`: *Verifies 100% completeness, zero duplicates, and live API connectivity.*
> - `test_api.py`: *Tests all REST endpoints, query parameters, and CSV export streaming.*
>
> *All 18 tests execute in sub-second time and pass with zero failures."*

---

### [04:15 – 04:45] Docker, Deployment & Handover
> *"Finally, deployment is streamlined:*
> - `docker-compose.yml` *builds the multi-container environment with healthcheck dependencies: backend on port 8000 and frontend on port 5173.*
> - *The frontend compiles cleanly via Vite with zero TypeScript errors into optimized static bundles.*
> - *For cloud hosting, the frontend deploys on Vercel with SPA routing, and the backend deploys on Render/Heroku via Docker.*
>
> *The entire codebase is structured cleanly, fully documented in the README, and ready for code review. Thank you."*
