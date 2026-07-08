# -*- coding: utf-8 -*-
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.lines import Line2D

fig, ax = plt.subplots(figsize=(9.2, 5.6), dpi=200)
ax.set_xlim(0, 100); ax.set_ylim(0, 64); ax.axis("off")

EDGE = "#222222"
def box(x, y, w, h, title, sub="", fc="#ffffff", fs=11, subfs=8.2):
    p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4,rounding_size=1.6",
                       linewidth=1.4, edgecolor=EDGE, facecolor=fc, zorder=3)
    ax.add_patch(p)
    if sub:
        ax.text(x+w/2, y+h*0.60, title, ha="center", va="center", fontsize=fs,
                fontweight="bold", zorder=4)
        ax.text(x+w/2, y+h*0.27, sub, ha="center", va="center", fontsize=subfs,
                color="#333333", zorder=4)
    else:
        ax.text(x+w/2, y+h/2, title, ha="center", va="center", fontsize=fs,
                fontweight="bold", zorder=4)

def arrow(p1, p2, style="-|>", color=EDGE, lw=1.4, ls="-", rad=0.0, mut=12):
    a = FancyArrowPatch(p1, p2, arrowstyle=style, mutation_scale=mut,
                        lw=lw, color=color, linestyle=ls,
                        connectionstyle=f"arc3,rad={rad}", zorder=2)
    ax.add_patch(a)

def label(x, y, t, fs=7.8, color="#1f3a5f", rot=0):
    ax.text(x, y, t, ha="center", va="center", fontsize=fs, color=color,
            style="italic", rotation=rot, zorder=5,
            bbox=dict(boxstyle="round,pad=0.18", fc="white", ec="none", alpha=0.9))

# ---- Clients (top) ----
box(6, 50, 36, 11, "Teacher's Browser", "Monitoring dashboard / Projector view", fc="#eef4fb")
box(58, 50, 36, 11, "Students' Browsers / Tablets", "Join via 6-digit code or QR", fc="#eef4fb")

# ---- Frontend ----
box(20, 33, 60, 11, "Frontend  (Next.js 16 / React 19)",
    "App Router  +  Next.js API Routes", fc="#f3eefb")

# ---- Backend ----
box(20, 16, 60, 11, "Backend  (Node.js / Express 5 + Socket.IO 4.8)",
    "Auth (JWT) - Quiz CRUD - Live session engine", fc="#fbf1ee")

# ---- Data stores (bottom) ----
box(3, 1.5, 26, 10.5, "MongoDB", "Quizzes, results, logs", fc="#eaf6ee")
box(37, 1.5, 26, 10.5, "Redis", "Live session state (+ in-memory fallback)", fc="#fdeeee")
box(71, 1.5, 26, 10.5, "Ollama", "Local LLM (qwen3)", fc="#fef6e6")

# ---- Arrows: clients <-> frontend ----
arrow((24, 50), (35, 44), rad=0.15)
arrow((76, 50), (65, 44), rad=-0.15)

# Frontend <-> Backend channels
arrow((42, 33), (42, 27), rad=0.0)
label(34.5, 30, "REST / JWT")
arrow((50, 27), (50, 33), rad=0.0)
label(57.5, 30, "Socket.IO\n(live answers)")
arrow((62, 33), (62, 27), style="-|>", ls=(0,(4,2)))
label(70, 30, "SSE\n(AI tokens)")

# Backend <-> data
arrow((38, 16), (20, 12), rad=0.1)
label(26, 14.6, "Mongoose")
arrow((50, 16), (50, 12.5))
label(56.5, 14.4, "Redis client")

# Frontend (Next API) -> Ollama  (long curved arrow on the right)
arrow((80, 36), (84, 12), rad=-0.35, ls=(0,(4,2)))
label(92.5, 24, "Next.js API\nRoute -> LLM", rot=0)

# Backend -> Ollama (SSE streaming)
arrow((68, 16), (80, 12), rad=-0.1, ls=(0,(4,2)))

# Title
ax.text(50, 63, "Figure 1.  System Architecture", ha="center", va="center",
        fontsize=12.5, fontweight="bold")

plt.tight_layout(pad=0.3)
plt.savefig("fig1_architecture.png", dpi=200, bbox_inches="tight", facecolor="white")
print("saved fig1_architecture.png")
