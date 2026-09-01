#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generates the category pages and the services hub page for the Depaneo site
from a single shared header/footer template, so all pages stay consistent."""

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEAD = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title}</title>
<meta name="description" content="{description}" />
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
<script>
  tailwind.config = {{
    theme: {{
      extend: {{
        fontFamily: {{
          sans: ['Inter', 'sans-serif'],
          display: ['Plus Jakarta Sans', 'sans-serif'],
        }},
        colors: {{
          brand: {{
            50:  '#f4f9e8',
            100: '#e5f2c8',
            200: '#cde496',
            300: '#b0d363',
            400: '#98c53d',
            500: '#83bd1d',
            600: '#699917',
            700: '#527811',
            800: '#3f5c0f',
            900: '#334c10',
          }}
        }}
      }}
    }}
  }}
</script>
<style>
  html {{ scroll-behavior: smooth; }}
  .font-display {{ letter-spacing: -0.02em; }}
  .bg-grid {{
    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 24px 24px;
  }}
  .card-hover {{ transition: transform .2s ease, box-shadow .2s ease; }}
  .card-hover:hover {{ transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15); }}
  @keyframes float {{
    0%, 100% {{ transform: translateY(0) translateX(0); }}
    50% {{ transform: translateY(-24px) translateX(10px); }}
  }}
  .animate-float {{ animation: float 7s ease-in-out infinite; }}
  .animate-float-slow {{ animation: float 11s ease-in-out infinite; animation-delay: -4s; }}
  @keyframes spin-slow {{
    from {{ transform: rotate(0deg); }}
    to {{ transform: rotate(360deg); }}
  }}
  .animate-spin-slow {{ animation: spin-slow 50s linear infinite; }}
  .bg-glow-up {{
    background: radial-gradient(ellipse 95% 80% at 50% 100%, rgba(131,189,29,0.7) 0%, rgba(131,189,29,0.3) 40%, rgba(131,189,29,0.08) 65%, transparent 85%);
  }}
  @keyframes glow-pulse {{
    0%, 100% {{ opacity: 0.85; transform: scale(1); }}
    50% {{ opacity: 1; transform: scale(1.06); }}
  }}
  .animate-glow-pulse {{ animation: glow-pulse 6s ease-in-out infinite; }}
</style>
</head>
<body class="font-sans text-neutral-900 bg-white antialiased">

  <!-- Top info bar -->
  <div class="bg-neutral-950 text-slate-300 text-sm">
    <div class="max-w-7xl mx-auto px-6 py-2 flex flex-wrap items-center justify-between gap-2">
      <p class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-brand-500"></span>
        Étiquettes prépayées disponibles — expédition gratuite de vos boîtiers vers nos ateliers
      </p>
      <a href="tel:0299008500" class="font-semibold text-white hover:text-brand-400 transition">02 99 00 85 00</a>
    </div>
  </div>

  <!-- Header -->
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-6 h-20 lg:h-36 flex items-center justify-between">
      <a href="index.html" class="flex items-center">
        <img src="images/logo.png" alt="Depaneo Electronics" class="h-12 w-auto" />
      </a>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
        <a href="services.html" class="hover:text-neutral-900">Nos services</a>
        <a href="index.html#process" class="hover:text-neutral-900">Comment ça marche</a>
        <a href="index.html#apropos" class="hover:text-neutral-900">Qui sommes-nous</a>
        <a href="index.html#realisations" class="hover:text-neutral-900">Réalisations</a>
        <a href="index.html#contact" class="hover:text-neutral-900">Contact</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="index.html#demande" class="hidden sm:inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-neutral-950 font-semibold px-5 py-2.5 rounded-full text-sm transition">
          Demande de dépannage
        </a>
        <button id="menu-btn" class="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <nav id="mobile-menu" class="hidden md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-3 text-sm font-medium text-slate-700">
      <a href="services.html" class="block">Nos services</a>
      <a href="index.html#process" class="block">Comment ça marche</a>
      <a href="index.html#apropos" class="block">Qui sommes-nous</a>
      <a href="index.html#realisations" class="block">Réalisations</a>
      <a href="index.html#contact" class="block">Contact</a>
      <a href="index.html#demande" class="block bg-brand-500 text-neutral-950 font-semibold px-4 py-2.5 rounded-full text-center">Demande de dépannage</a>
    </nav>
  </header>
  <script>
    document.getElementById('menu-btn').addEventListener('click', () => {{
      document.getElementById('mobile-menu').classList.toggle('hidden');
    }});
  </script>
"""

FOOTER = """
  <!-- CTA / Demande de dépannage -->
  <section id="demande-cta" class="relative bg-neutral-950 text-white overflow-hidden">
    <div class="absolute inset-0 bg-grid opacity-30"></div>
    <div class="relative max-w-4xl mx-auto px-6 py-10 sm:py-24 text-center">
      <h2 class="font-display text-3xl sm:text-4xl font-bold mb-4">Une panne électronique à traiter ?</h2>
      <p class="text-slate-300 mb-8 max-w-xl mx-auto">Envoyez-nous votre équipement, nous vous établissons un devis gratuit sous 48h. Étiquettes prépayées disponibles sur simple demande.</p>
      <div class="flex flex-wrap justify-center gap-4">
        <a href="tel:0299008500" class="bg-brand-500 hover:bg-brand-600 text-neutral-950 font-semibold px-7 py-3.5 rounded-full transition">
          Appeler le 02 99 00 85 00
        </a>
        <a href="index.html#contact" class="border border-white/20 hover:border-white/40 px-7 py-3.5 rounded-full font-semibold transition">
          Nous écrire
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-neutral-950 text-slate-400 text-sm">
    <div class="max-w-7xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img src="images/logo.png" alt="Depaneo Electronics" class="h-8 w-auto bg-white rounded-lg px-2 py-1.5" />
        <p>© 2026 DEPANEO Electronics — AMC CONCEPT INDUSTRIE.</p>
      </div>
      <p>SIRET 531 527 257 00012 — APE 7112B</p>
    </div>
  </footer>

  <script>
    (function () {
      function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
      function smoothScrollTo(targetY, duration) {
        var startY = window.scrollY;
        var diff = targetY - startY;
        var startTime = performance.now();
        var html = document.documentElement;
        var previousBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        function step(now) {
          var progress = Math.min((now - startTime) / duration, 1);
          window.scrollTo(0, startY + diff * easeInOutQuad(progress));
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            html.style.scrollBehavior = previousBehavior;
          }
        }
        requestAnimationFrame(step);
      }
      document.querySelectorAll('[data-smooth-scroll]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          var target = document.querySelector(link.getAttribute('href'));
          if (!target) return;
          e.preventDefault();
          target.style.transition = 'opacity 1.6s ease';
          target.style.opacity = '0.15';
          var y = target.getBoundingClientRect().top + window.scrollY - 20;
          smoothScrollTo(y, 1600);
          setTimeout(function () { target.style.opacity = '1'; }, 300);
        });
      });
    })();
  </script>
</body>
</html>
"""


def breadcrumb(current):
    return f"""
  <div class="bg-slate-50 border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-6 py-4 text-sm text-slate-500 flex items-center gap-2">
      <a href="index.html" class="hover:text-brand-600">Accueil</a>
      <span>/</span>
      <a href="services.html" class="hover:text-brand-600">Nos services</a>
      <span>/</span>
      <span class="text-neutral-800 font-medium">{current}</span>
    </div>
  </div>
"""


def brand_chips(brands):
    chips = "\n".join(
        f'        <span class="inline-flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm">{b}</span>'
        for b in brands
    )
    return f"""
      <div class="flex flex-wrap gap-3">
{chips}
      </div>"""


PLACEHOLDER_ICON = """<svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="text-slate-400">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M9 4v16M15 4v16M4 9h16M4 15h16" stroke="currentColor" stroke-width="1.5"/>
            </svg>"""


def example_cards(examples):
    cards = []
    has_photos = any(isinstance(ex, dict) and ex.get("image") for ex in examples)
    for ex in examples:
        name = ex["name"] if isinstance(ex, dict) else ex
        brand = ex.get("brand", "") if isinstance(ex, dict) else ""
        image = ex.get("image") if isinstance(ex, dict) else None
        visual = (
            f'<img src="{image}" alt="{name}" class="w-full h-full object-contain p-4" />'
            if image else PLACEHOLDER_ICON
        )
        cards.append(f"""        <div class="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden card-hover">
          <div class="aspect-video sm:aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            {visual}
          </div>
          <div class="p-2.5 sm:p-5">
            <p class="text-[10px] sm:text-xs text-brand-600 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">{brand}</p>
            <h3 class="text-xs sm:text-base font-semibold text-neutral-900 leading-snug">{name}</h3>
          </div>
        </div>""")

    caption = "Exemples réels de réparations effectuées." if has_photos else "Exemples réels de réparations effectuées — photos à venir."
    return f"""
      <p class="text-sm text-slate-500 mb-6">{caption}</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
{chr(10).join(cards)}
      </div>"""


BOX_ICON = """<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="2" class="w-full h-full">
  <path d="M100 14 L182 58 L182 142 L100 186 L18 142 L18 58 Z" />
  <path d="M18 58 L100 100 L182 58" />
  <path d="M100 100 L100 186" />
</svg>"""


def category_hero(title, intro):
    return f"""
  <section class="relative bg-neutral-950 text-white overflow-hidden">
    <div class="absolute inset-0 bg-glow-up animate-glow-pulse"></div>
    <div class="absolute inset-0 bg-grid opacity-30"></div>
    <div class="absolute right-6 top-1/2 -translate-y-1/2 w-56 h-56 text-white/5 hidden lg:block animate-spin-slow">
      {BOX_ICON}
    </div>
    <div class="relative max-w-6xl mx-auto px-6 pt-10 pb-20">
      <div class="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <a href="index.html" class="hover:text-white transition">Accueil</a>
        <span>/</span>
        <a href="services.html" class="hover:text-white transition">Nos services</a>
        <span>/</span>
        <span class="text-white font-medium">{title}</span>
      </div>
      <div class="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:items-center">
        <div>
          <h1 class="font-display text-4xl sm:text-5xl font-bold mb-6">{title}</h1>
          <p class="text-slate-300 text-lg max-w-xl">{intro}</p>
        </div>
        <div class="bg-white/10 border border-white/10 backdrop-blur rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 lg:max-w-sm lg:justify-self-end">
          <p class="text-sm font-medium text-slate-100">Votre boîtier n'apparaît pas dans cette liste ? Pas de souci, nous nous adaptons à tous les modèles.</p>
          <a href="#demande-cta" data-smooth-scroll class="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-neutral-950 font-semibold px-4 py-2 rounded-full text-xs sm:text-sm transition">
            Contactez-nous
          </a>
        </div>
      </div>
    </div>
  </section>"""


def category_page(slug, title, intro, brands, examples):
    html = HEAD.format(
        title=f"{title} — Dépannage électronique | Depaneo Electronics",
        description=f"Dépannage et réparation de {title.lower()} pour le machinisme agricole et le TP. {intro}",
    )
    html += category_hero(title, intro)
    html += f"""
{"" if not examples else f'''
  <section class="bg-slate-50 border-y border-slate-200">
    <div class="max-w-4xl mx-auto px-6 py-16">
      <h2 class="font-display text-xl font-bold text-neutral-900 mb-6">Exemples de réparations</h2>
{example_cards(examples)}
    </div>
  </section>
'''}"""
    html += FOOTER
    path = os.path.join(ROOT, slug)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", slug)


CATEGORIES = [
    dict(
        slug="boitiers-de-gestion.html",
        title="Boîtiers de gestion",
        intro="Dépannage de boîtiers de gestion pour tracteurs et automoteurs agricoles : diagnostic complet sur banc de test et devis gratuit avant toute réparation.",
        brands=["Claas", "Deutz-Fahr", "Drivetronic", "Fendt", "Hydac", "John Deere", "Manitou", "New Holland", "Renault", "Sparex", "Vansco"],
        examples=[
            {"name": "Boîte de vitesse Massey Ferguson Auto 2", "brand": "Massey Ferguson", "image": "images/examples/boitiers-de-gestion/auto2-massey-ferguson.jpg"},
            {"name": "Boîte de vitesse Claas Drivetronic 3", "brand": "Claas", "image": "images/examples/boitiers-de-gestion/drivetronic-3-claas.jpg"},
            {"name": "Boîte de vitesse Claas Drivetronic 2", "brand": "Claas", "image": "images/examples/boitiers-de-gestion/drivetronic-2-claas.jpg"},
            {"name": "Boîtier Tractonic", "brand": "Renault", "image": "images/examples/boitiers-de-gestion/tractonic-renault.jpg"},
            {"name": "EMU New Holland", "brand": "New Holland", "image": "images/examples/boitiers-de-gestion/emu-new-holland.jpg"},
            {"name": "Moteur Claas DE10", "brand": "Claas", "image": "images/examples/boitiers-de-gestion/moteur-de10-claas.jpg"},
            {"name": "E-Box Fendt", "brand": "Fendt", "image": "images/examples/boitiers-de-gestion/ibox-fendt.jpg"},
            {"name": "Boîtier de gestion NH G170", "brand": "New Holland", "image": "images/examples/boitiers-de-gestion/g170-new-holland.jpg"},
            {"name": "Radar de vitesse", "brand": "Vansco", "image": "images/examples/boitiers-de-gestion/radar-vansco.jpg"},
        ],
    ),
    dict(
        slug="moissonneuses.html",
        title="Moissonneuses-batteuses",
        intro="Réparation de terminaux et boîtiers électroniques de moissonneuses-batteuses, toutes marques confondues.",
        brands=["Case", "Case IH", "Claas", "Deutz-Fahr", "Fahr", "Fendt", "Fiatagri", "John Deere", "Laverda", "Massey Ferguson", "New Holland"],
        examples=[{"name": "Terminal Contrôle System 4080 HTS", "brand": "Deutz-Fahr"}],
    ),
    dict(
        slug="boitiers-de-pesee.html",
        title="Boîtiers de pesée",
        intro="Dépannage de boîtiers de pesée embarqués pour l'agriculture et l'élevage.",
        brands=["DigiStar", "Farm Scale", "Kuhn - PTM", "Seko"],
        examples=[],
    ),
    dict(
        slug="presses.html",
        title="Presses",
        intro="Réparation de boîtiers électroniques de presses à balles rondes et carrées, toutes marques.",
        brands=["Case IH", "Claas", "Deutz-Fahr", "Feraboli", "Fiatagri", "Gallignani", "Greenland", "Hesston", "John Deere", "Krone", "Laverda", "Massey Ferguson", "New Holland", "Rivierre", "Rivierre Casalis", "Vicon", "Toute marque"],
        examples=[],
    ),
    dict(
        slug="boitiers-de-relevage.html",
        title="Boîtiers de relevage",
        intro="Dépannage de boîtiers de relevage et de transmission pour matériel agricole.",
        brands=["Bosch", "Claas", "Deutz-Fahr", "Drivetronic", "New Holland"],
        examples=[],
    ),
    dict(
        slug="compteurs-et-compte-tours.html",
        title="Compteurs et compte-tours",
        intro="Réparation de compteurs et compte-tours pour engins agricoles et de travaux publics.",
        brands=["Case IH", "Claas - Gaspardo", "JCB", "Mc Electronica", "Mc Hale", "VDO"],
        examples=[],
    ),
    dict(
        slug="enrubanneuses.html",
        title="Enrubanneuses",
        intro="Dépannage de boîtiers électroniques d'enrubanneuses.",
        brands=["Elho Sideliner", "Mc Electronica - Mc Hale", "Zambelli"],
        examples=[],
    ),
    dict(
        slug="epandeurs.html",
        title="Épandeurs",
        intro="Réparation de boîtiers de commande d'épandeurs.",
        brands=["Bucher", "Fluitronic", "Rolland"],
        examples=[],
    ),
    dict(
        slug="irrigation.html",
        title="Irrigation",
        intro="Dépannage de boîtiers électroniques d'irrigateurs.",
        brands=["Bauer"],
        examples=[],
    ),
    dict(
        slug="pailleuses.html",
        title="Pailleuses",
        intro="Réparation de boîtiers électroniques de pailleuses.",
        brands=["Lucas"],
        examples=[],
    ),
    dict(
        slug="pulverisateurs.html",
        title="Pulvérisateurs",
        intro="Réparation de commandes et boîtiers électroniques de pulvérisateurs agricoles.",
        brands=["Amazone", "Arag - Berthoud", "Blanchard", "Caruelle - Dickey John", "Evrard", "Hardi", "John Deere", "Kuhn", "Matrot - Muller Elektronik", "Nodet - Raven", "RDS - Seguip - Tecnoma", "Teejet - Vicon"],
        examples=[{"name": "Commande de Pulvé EL-4", "brand": "John Deere"}],
    ),
    dict(
        slug="semoirs.html",
        title="Semoirs",
        intro="Dépannage de boîtiers électroniques de semoirs.",
        brands=["Accord - Amazone", "Bogballe - Dickey John - Gaspardo - Kuhn", "LH Agro - Nodet", "Sulky Burel", "Väderstad"],
        examples=[],
    ),
    dict(
        slug="tableaux-de-bord.html",
        title="Tableaux de bord",
        intro="Réparation de tableaux de bord et terminaux d'affichage pour tracteurs et engins agricoles, y compris les terminaux de guidage GPS.",
        brands=["Case IH", "Claas", "Deutz-Fahr", "Divers", "Fendt", "JCB", "John Deere", "Massey Ferguson", "Mc Cormick", "New Holland", "Same Rubin", "Valtra"],
        examples=[{"name": "Boîtier CFX-750", "brand": "Trimble"}],
    ),
    dict(
        slug="verins-moteurs-poignees.html",
        title="Vérins, moteurs et poignées",
        intro="Dépannage de vérins électroniques, moteurs et poignées de commande / joysticks pour matériel agricole.",
        brands=["Case IH", "Claas", "Limack"],
        examples=[{"name": "Joystick Monolevier Scorpion", "brand": "Claas"}],
    ),
    dict(
        slug="travaux-publics.html",
        title="Engins de travaux publics",
        intro="Réparation de boîtiers électroniques et commandes pour engins de travaux publics.",
        brands=["JCB", "Manitou"],
        examples=[{"name": "Joystick Monolevier", "brand": "JCB"}],
    ),
    dict(
        slug="autres-equipements.html",
        title="Autres équipements agricoles",
        intro="Dépannage d'autres équipements électroniques agricoles : capteurs, boîtiers spécifiques et matériel sur-mesure, y compris nos propres solutions conçues en atelier comme le capteur de vitesse GPS.",
        brands=["Deutz-Fahr", "Manitou", "New Holland", "Sparex", "Walvoil"],
        examples=[],
    ),
]

for cat in CATEGORIES:
    category_page(**cat)

# --- services.html hub page ---
cards_html = []
for cat in CATEGORIES:
    brand_preview = ", ".join(cat["brands"][:4]) + ("…" if len(cat["brands"]) > 4 else "")
    cards_html.append(f"""      <a href="{cat['slug']}" class="block bg-white rounded-2xl p-6 border border-slate-200 card-hover">
        <h3 class="font-semibold text-lg mb-1">{cat['title']}</h3>
        <p class="text-sm text-slate-500">{brand_preview}</p>
      </a>""")

services_html = HEAD.format(
    title="Nos services — Toutes nos catégories de dépannage | Depaneo Electronics",
    description="Toutes les catégories d'équipements électroniques agricoles et de travaux publics dépannés par Depaneo Electronics.",
)
services_html += breadcrumb("Nos services")
services_html += f"""
  <section class="max-w-7xl mx-auto px-6 py-16">
    <h1 class="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Nos domaines d'intervention</h1>
    <p class="text-slate-600 text-lg mb-12 max-w-2xl">Toutes cartes électroniques sans schéma. Sélectionnez une catégorie pour voir le détail des marques dépannées.</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
{chr(10).join(cards_html)}
    </div>
  </section>
"""
services_html += FOOTER
with open(os.path.join(ROOT, "services.html"), "w", encoding="utf-8") as f:
    f.write(services_html)
print("wrote services.html")
