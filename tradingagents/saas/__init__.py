"""SaaS worker for TradingAgents.

Polls Supabase for queued runs, executes the analysis graph, and streams
events back so the React frontend can render the desk working in real time.

Run with:
    python -m tradingagents.saas.worker
"""
