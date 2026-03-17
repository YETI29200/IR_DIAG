import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import io
import base64
import sys
import os
import json
import argparse
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright

# Configuration des couleurs Images & Réseaux
COLOR_PRIMARY = '#00B1E6'      # Cyan I&R
COLOR_PRIMARY_DARK = '#0093C0'
COLOR_SECONDARY = '#FFDC00'    # Jaune I&R
COLOR_TEXT = '#1e293b'
COLOR_TEXT_LIGHT = '#64748b'
COLOR_TABLE_HEADER = '#00B1E6'
COLOR_BG_LIGHT = '#f8fafc'
COLOR_BORDER = '#e2e8f0'
COLOR_SUCCESS = '#10b981'
COLOR_WARNING = '#f59e0b'
COLOR_DANGER = '#ef4444'

def get_score_color(score):
    """Retourne une couleur selon le score."""
    if score >= 70:
        return COLOR_SUCCESS
    elif score >= 40:
        return COLOR_WARNING
    else:
        return COLOR_DANGER

def generate_radar_chart_base64(data_values, labels, organization_name):
    """Génère un graphique radar (spider chart) en Base64."""
    scores = [float(x) for x in data_values]
    N = len(labels)

    # Angles pour chaque dimension
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    scores_plot = scores + [scores[0]]  # Fermer le polygone
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))

    # Style du graphique
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)

    # Grille et labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontsize=10, fontweight='600', color=COLOR_TEXT)
    ax.set_ylim(0, 100)
    ax.set_yticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(['20', '40', '60', '80', '100'], fontsize=8, color=COLOR_TEXT_LIGHT)
    ax.yaxis.grid(True, color='#e2e8f0', linestyle='-', linewidth=0.5)
    ax.xaxis.grid(True, color='#e2e8f0', linestyle='-', linewidth=0.5)

    # Tracer le polygone
    ax.plot(angles, scores_plot, 'o-', linewidth=2.5, color=COLOR_PRIMARY, markersize=8)
    ax.fill(angles, scores_plot, alpha=0.15, color=COLOR_PRIMARY)

    # Ajouter les valeurs sur chaque point
    for angle, score in zip(angles[:-1], scores):
        ax.annotate(f'{int(score)}%',
                     xy=(angle, score),
                     xytext=(0, 14),
                     textcoords='offset points',
                     ha='center',
                     fontsize=10,
                     fontweight='bold',
                     color=COLOR_PRIMARY_DARK)

    ax.spines['polar'].set_color('#e2e8f0')

    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=200, transparent=True)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64


def generate_bar_chart_base64(data_values, labels, organization_name):
    """Génère un graphique à barres horizontales en Base64."""
    scores = [float(x) for x in data_values]

    fig, ax = plt.subplots(figsize=(9, 4))

    labels_rev = labels[::-1]
    scores_rev = scores[::-1]
    y_pos = range(len(labels))

    colors = [get_score_color(s) for s in scores_rev]
    bars = ax.barh(y_pos, scores_rev, color=colors, height=0.55, alpha=0.85, edgecolor='white', linewidth=0.5)

    # Fond gris pour 100%
    ax.barh(y_pos, [100]*len(labels), color='#f1f5f9', height=0.55, zorder=0)
    # Re-draw colored bars on top
    ax.barh(y_pos, scores_rev, color=colors, height=0.55, alpha=0.85, zorder=1)

    for i, v in enumerate(scores_rev):
        ax.text(v + 2, i, f"{int(v)}%", color=COLOR_TEXT, fontweight='bold', va='center', fontsize=11)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels_rev, fontsize=11, color=COLOR_TEXT, fontweight='600')
    ax.set_xlim(0, 110)
    ax.set_xlabel('')

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.set_axisbelow(True)

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=200, transparent=True)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64


async def render_pdf_with_playwright(html_content, output_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_content(html_content, wait_until='networkidle')
        await page.emulate_media(media="print")
        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "0px", "bottom": "0px", "left": "0px", "right": "0px"}
        )
        await browser.close()


async def generate_pdf_report(data_values, labels, recommendations_data, organization_name="Votre Organisation", output_path=None, contact_info=None):
    try:
        if not output_path:
            output_path = f"Rapport_Flash_{organization_name.replace(' ', '_')}.pdf"

        radar_base64 = generate_radar_chart_base64(data_values, labels, organization_name)
        bar_base64 = generate_bar_chart_base64(data_values, labels, organization_name)

        avg_score = int(sum(data_values) / len(data_values)) if data_values else 0
        level = "Débutant"
        level_emoji = "🔴"
        if avg_score >= 75:
            level = "Expert"
            level_emoji = "🟢"
        elif avg_score >= 50:
            level = "Avancé"
            level_emoji = "🟢"
        elif avg_score >= 25:
            level = "Initié"
            level_emoji = "🟡"

        now = datetime.now().strftime("%d/%m/%Y")
        now_full = datetime.now().strftime("%d/%m/%Y à %H:%M")

        # Build recommendations rows
        table_rows_1 = ""
        table_rows_2 = ""
        for i, (label, score) in enumerate(zip(labels, data_values)):
            rec = recommendations_data[i] if i < len(recommendations_data) else {"title": "", "description": "", "actions": []}

            score_color = get_score_color(score)
            actions = rec.get('actions', [])
            actions_html = ""
            if actions:
                items = "".join([f'<li>{a}</li>' for a in actions])
                actions_html = f'<ul class="action-list">{items}</ul>'

            description = rec.get('description', '') or rec.get('synthesis', '')

            row_html = f"""
            <tr>
                <td class="col-dim">
                    <div class="dim-name">{label}</div>
                </td>
                <td class="col-score">
                    <div class="score-circle" style="border-color: {score_color}; color: {score_color};">
                        {int(score)}
                    </div>
                    <div class="score-label">/ 100</div>
                </td>
                <td class="col-rec">
                    <div class="rec-title">{rec.get('title', '')}</div>
                    <div class="rec-desc">{description}</div>
                    {actions_html}
                </td>
            </tr>
            """
            if i < 3:
                table_rows_1 += row_html
            else:
                table_rows_2 += row_html

        # Logo Images & Réseaux
        logo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'client', 'public', 'logo.png')
        logo_base64 = ""
        print(f"[PDF] Looking for logo at: {logo_path}", file=sys.stderr)
        print(f"[PDF] Logo exists: {os.path.exists(logo_path)}", file=sys.stderr)
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as image_file:
                logo_base64 = base64.b64encode(image_file.read()).decode('utf-8')
            print(f"[PDF] Logo loaded, size: {len(logo_base64)} chars", file=sys.stderr)

        # Cover page image
        cover_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'client', 'public', 'report-cover.png')
        cover_base64 = ""
        if os.path.exists(cover_path):
            with open(cover_path, "rb") as image_file:
                cover_base64 = base64.b64encode(image_file.read()).decode('utf-8')

        # Contact info rows
        contact_rows = ""
        if contact_info:
            if contact_info.get('nom_de_l_entreprise'):
                contact_rows += f'<tr><td class="info-label">Entreprise</td><td class="info-value">{contact_info["nom_de_l_entreprise"]}</td></tr>'
            if contact_info.get('nom_du_participant'):
                contact_rows += f'<tr><td class="info-label">Participant</td><td class="info-value">{contact_info["nom_du_participant"]}</td></tr>'
            if contact_info.get('role_du_participant'):
                contact_rows += f'<tr><td class="info-label">Fonction</td><td class="info-value">{contact_info["role_du_participant"]}</td></tr>'
            if contact_info.get('secteur_d_activite'):
                contact_rows += f'<tr><td class="info-label">Secteur</td><td class="info-value">{contact_info["secteur_d_activite"]}</td></tr>'
            if contact_info.get('code_postal'):
                contact_rows += f'<tr><td class="info-label">Code postal</td><td class="info-value">{contact_info["code_postal"]}</td></tr>'
            if contact_info.get('email_un_rapport_vous_sera_automatiquement_envoye_a_cette_ad'):
                contact_rows += f'<tr><td class="info-label">Email</td><td class="info-value">{contact_info["email_un_rapport_vous_sera_automatiquement_envoye_a_cette_ad"]}</td></tr>'
            if contact_info.get('telephone'):
                contact_rows += f'<tr><td class="info-label">Téléphone</td><td class="info-value">{contact_info["telephone"]}</td></tr>'

        # Score gauge SVG
        score_arc_length = avg_score / 100 * 251.2  # circumference of radius 40
        score_color = get_score_color(avg_score)

        html_template = f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <style>
                @page {{ size: A4; margin: 0; }}
                * {{ box-sizing: border-box; }}
                body {{
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: {COLOR_TEXT};
                    margin: 0;
                    padding: 0;
                    background-color: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    font-size: 10pt;
                    line-height: 1.5;
                }}

                /* ========== PAGE DE COUVERTURE ========== */
                .cover-page {{
                    width: 210mm;
                    height: 297mm;
                    position: relative;
                    overflow: hidden;
                    page-break-after: always;
                    display: flex;
                    flex-direction: column;
                }}
                .cover-top {{
                    background: linear-gradient(135deg, {COLOR_PRIMARY} 0%, {COLOR_PRIMARY_DARK} 100%);
                    height: 45%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 50px 60px;
                    position: relative;
                }}
                .cover-top::after {{
                    content: '';
                    position: absolute;
                    bottom: -40px;
                    left: 0;
                    right: 0;
                    height: 80px;
                    background: white;
                    clip-path: polygon(0 50%, 100% 0, 100% 100%, 0% 100%);
                }}
                .cover-logo {{
                    margin-bottom: 40px;
                }}
                .cover-logo img {{
                    height: 65px;
                    background: white;
                    padding: 8px 14px;
                    border-radius: 8px;
                }}
                .cover-title {{
                    color: white;
                    font-size: 32pt;
                    font-weight: 800;
                    line-height: 1.15;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .cover-subtitle {{
                    color: rgba(255,255,255,0.9);
                    font-size: 16pt;
                    margin-top: 12px;
                    font-weight: 400;
                }}
                .cover-bottom {{
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 60px;
                }}
                .cover-org-name {{
                    font-size: 22pt;
                    font-weight: 700;
                    color: {COLOR_PRIMARY};
                    margin-bottom: 15px;
                }}
                .cover-date {{
                    font-size: 12pt;
                    color: {COLOR_TEXT_LIGHT};
                }}
                .cover-score-box {{
                    margin-top: 30px;
                    text-align: center;
                }}
                .cover-score-value {{
                    font-size: 58pt;
                    font-weight: 800;
                    color: {COLOR_PRIMARY};
                    line-height: 1;
                }}
                .cover-score-suffix {{
                    font-size: 20pt;
                    color: {COLOR_TEXT_LIGHT};
                    font-weight: 600;
                }}
                .cover-level {{
                    display: inline-block;
                    background: {COLOR_PRIMARY};
                    color: white;
                    padding: 6px 24px;
                    border-radius: 20px;
                    font-size: 13pt;
                    font-weight: 700;
                    margin-top: 10px;
                }}
                .cover-edih {{
                    position: absolute;
                    bottom: 30px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 9pt;
                    color: {COLOR_TEXT_LIGHT};
                }}

                /* ========== PAGES DE CONTENU ========== */
                .content-page {{
                    padding: 30px 45px 60px 45px;
                    position: relative;
                    min-height: 297mm;
                }}

                /* En-tête de page */
                .page-header {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 15px;
                    border-bottom: 3px solid {COLOR_PRIMARY};
                    margin-bottom: 25px;
                }}
                .page-header img {{
                    height: 40px;
                }}
                .page-header-right {{
                    text-align: right;
                    font-size: 9pt;
                    color: {COLOR_TEXT_LIGHT};
                }}

                /* Section titles */
                .section-title {{
                    font-size: 16pt;
                    color: {COLOR_PRIMARY};
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 25px 0 18px 0;
                    padding-bottom: 8px;
                    border-bottom: 2px solid {COLOR_BORDER};
                    position: relative;
                }}
                .section-title::after {{
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 80px;
                    height: 2px;
                    background: {COLOR_PRIMARY};
                }}

                /* Score summary */
                .summary-grid {{
                    display: flex;
                    gap: 20px;
                    margin-bottom: 25px;
                }}
                .summary-card {{
                    flex: 1;
                    background: {COLOR_BG_LIGHT};
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    border: 1px solid {COLOR_BORDER};
                }}
                .summary-card.highlight {{
                    background: linear-gradient(135deg, {COLOR_PRIMARY}10, {COLOR_PRIMARY}05);
                    border-color: {COLOR_PRIMARY}40;
                }}
                .summary-card-label {{
                    font-size: 9pt;
                    font-weight: 600;
                    color: {COLOR_TEXT_LIGHT};
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                }}
                .summary-card-value {{
                    font-size: 28pt;
                    font-weight: 800;
                    color: {COLOR_PRIMARY};
                    line-height: 1;
                }}
                .summary-card-sub {{
                    font-size: 9pt;
                    color: {COLOR_TEXT_LIGHT};
                    margin-top: 4px;
                }}

                /* Charts */
                .chart-container {{
                    text-align: center;
                    margin: 15px 0 20px 0;
                }}
                .chart-container img {{
                    max-width: 85%;
                }}

                /* Contact info */
                .info-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0 20px 0;
                }}
                .info-table td {{
                    padding: 6px 12px;
                    border-bottom: 1px solid {COLOR_BORDER};
                    font-size: 9.5pt;
                }}
                .info-label {{
                    font-weight: 600;
                    color: {COLOR_TEXT_LIGHT};
                    width: 120px;
                }}
                .info-value {{
                    color: {COLOR_TEXT};
                }}

                /* Recommendations table */
                table.results-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 9.5pt;
                }}
                table.results-table thead tr {{
                    background-color: {COLOR_TABLE_HEADER};
                }}
                table.results-table th {{
                    color: white;
                    padding: 10px 12px;
                    text-align: left;
                    font-weight: 700;
                    font-size: 9pt;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    border: none;
                }}
                table.results-table th:nth-child(2) {{
                    text-align: center;
                    width: 70px;
                }}
                table.results-table td {{
                    padding: 14px 12px;
                    border-bottom: 1px solid {COLOR_BORDER};
                    vertical-align: top;
                }}
                table.results-table tr:nth-child(even) td {{
                    background: {COLOR_BG_LIGHT};
                }}
                .col-dim {{
                    width: 18%;
                }}
                .dim-name {{
                    font-weight: 700;
                    color: {COLOR_PRIMARY};
                    font-size: 10pt;
                }}
                .col-score {{
                    width: 70px;
                    text-align: center;
                }}
                .score-circle {{
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    border: 3px solid;
                    font-weight: 800;
                    font-size: 13pt;
                }}
                .score-label {{
                    font-size: 8pt;
                    color: {COLOR_TEXT_LIGHT};
                    margin-top: 2px;
                }}
                .col-rec {{
                    width: auto;
                    line-height: 1.5;
                }}
                .rec-title {{
                    font-weight: 700;
                    color: {COLOR_TEXT};
                    font-size: 10pt;
                    margin-bottom: 4px;
                }}
                .rec-desc {{
                    font-style: italic;
                    color: {COLOR_TEXT_LIGHT};
                    font-size: 9pt;
                    margin-bottom: 6px;
                    line-height: 1.4;
                }}
                .action-list {{
                    margin: 4px 0 0 0;
                    padding-left: 18px;
                    font-size: 9pt;
                    color: {COLOR_TEXT};
                }}
                .action-list li {{
                    margin-bottom: 3px;
                    line-height: 1.35;
                }}

                /* Footer */
                .page-footer {{
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 12px 45px;
                    font-size: 7.5pt;
                    color: {COLOR_TEXT_LIGHT};
                    text-align: center;
                    border-top: 1px solid {COLOR_BORDER};
                    background: white;
                }}
                .page-footer a {{
                    color: {COLOR_PRIMARY};
                    text-decoration: none;
                }}

                /* Page break helper */
                .page-break {{
                    page-break-before: always;
                }}
            </style>
        </head>
        <body>
            <!-- ========== PAGE DE COUVERTURE ========== -->
            <div class="cover-page">
                <div class="cover-top">
                    <div class="cover-logo">
                        {'<img src="data:image/png;base64,' + logo_base64 + '" alt="Images & Réseaux">' if logo_base64 else '<div style="color:white;font-size:20pt;font-weight:800;">Images & Réseaux</div>'}
                    </div>
                    <h1 class="cover-title">Diagnostic Flash<br>IA & Data</h1>
                    <div class="cover-subtitle">Rapport de maturité numérique</div>
                </div>
                <div class="cover-bottom">
                    <div class="cover-org-name">{organization_name}</div>
                    <div class="cover-date">{now}</div>
                    <div class="cover-score-box">
                        <div class="cover-score-value">{avg_score}<span class="cover-score-suffix"> / 100</span></div>
                        <div class="cover-level">{level}</div>
                    </div>
                </div>
                <div class="cover-edih">
                    EDIH Bretagne & Pays de la Loire — European Digital Innovation Hub
                </div>
            </div>

            <!-- ========== PAGE SYNTHÈSE ========== -->
            <div class="content-page">
                <div class="page-header">
                    {'<img src="data:image/png;base64,' + logo_base64 + '" alt="I&R">' if logo_base64 else '<div style="font-weight:800;color:' + COLOR_PRIMARY + ';">I&R</div>'}
                    <div class="page-header-right">
                        Diagnostic Flash IA & Data<br>
                        <strong>{organization_name}</strong> — {now}
                    </div>
                </div>

                <div class="section-title">Synthèse</div>

                <div class="summary-grid">
                    <div class="summary-card highlight">
                        <div class="summary-card-label">Score Global</div>
                        <div class="summary-card-value">{avg_score}%</div>
                        <div class="summary-card-sub">{level}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-label">Dimensions évaluées</div>
                        <div class="summary-card-value">{len(labels)}</div>
                        <div class="summary-card-sub">sur 5</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-label">Meilleur score</div>
                        <div class="summary-card-value">{int(max(data_values))}%</div>
                        <div class="summary-card-sub">{labels[data_values.index(max(data_values))]}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-label">Progression prioritaire</div>
                        <div class="summary-card-value">{int(min(data_values))}%</div>
                        <div class="summary-card-sub">{labels[data_values.index(min(data_values))]}</div>
                    </div>
                </div>

                {'<div class="section-title">Informations</div><table class="info-table">' + contact_rows + '</table>' if contact_rows else ''}
            </div>

            <!-- ========== PAGE PROFIL DE MATURITÉ ========== -->
            <div class="content-page page-break">
                <div class="page-header">
                    {'<img src="data:image/png;base64,' + logo_base64 + '" alt="I&R">' if logo_base64 else '<div style="font-weight:800;color:' + COLOR_PRIMARY + ';">I&R</div>'}
                    <div class="page-header-right">
                        Diagnostic Flash IA &amp; Data<br>
                        <strong>{organization_name}</strong> — {now}
                    </div>
                </div>

                <div class="section-title">Profil de maturité</div>
                <div class="chart-container">
                    <img src="data:image/png;base64,{radar_base64}">
                </div>

                <div class="chart-container" style="margin-top: 10px;">
                    <img src="data:image/png;base64,{bar_base64}" style="max-width: 95%;">
                </div>
            </div>

            <!-- ========== PAGE RECOMMANDATIONS 1 ========== -->
            <div class="content-page page-break">
                <div class="page-header">
                    {'<img src="data:image/png;base64,' + logo_base64 + '" alt="I&R">' if logo_base64 else '<div style="font-weight:800;color:' + COLOR_PRIMARY + ';">I&R</div>'}
                    <div class="page-header-right">
                        Diagnostic Flash IA & Data<br>
                        <strong>{organization_name}</strong> — {now}
                    </div>
                </div>

                <div class="section-title">Scores par dimension et recommandations</div>
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Dimension</th>
                            <th style="text-align: center;">Score</th>
                            <th>Recommandations et Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows_1}
                    </tbody>
                </table>
            </div>

            {f'''
            <!-- ========== PAGE RECOMMANDATIONS 2 ========== -->
            <div class="content-page page-break">
                <div class="page-header">
                    {'<img src="data:image/png;base64,' + logo_base64 + '" alt="I&R">' if logo_base64 else '<div style="font-weight:800;color:' + COLOR_PRIMARY + ';">I&R</div>'}
                    <div class="page-header-right">
                        Diagnostic Flash IA & Data<br>
                        <strong>{organization_name}</strong> — {now}
                    </div>
                </div>

                <div class="section-title">Scores par dimension et recommandations (suite)</div>
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Dimension</th>
                            <th style="text-align: center;">Score</th>
                            <th>Recommandations et Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows_2}
                    </tbody>
                </table>
            </div>
            ''' if table_rows_2 else ''}

            <!-- ========== FOOTER ========== -->
            <div class="page-footer">
                <strong>Images & Réseaux</strong> — Pôle de Compétitivité Numérique Bretagne & Pays de la Loire<br>
                EDIH Bretagne / EDIH Pays de la Loire — Accompagnement à la transformation numérique<br>
                Document généré le {now_full} par la plateforme IR-DIAG-IA
            </div>
        </body>
        </html>
        """

        await render_pdf_with_playwright(html_template, output_path)
        return output_path

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR: {str(e)}", file=sys.stderr)
        return None


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', help='JSON data')
    parser.add_argument('--out', help='Output path')
    args = parser.parse_args()

    if args.json:
        try:
            if os.path.exists(args.json):
                with open(args.json, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)
            else:
                data = json.loads(args.json)

            result_path = await generate_pdf_report(
                data.get('scores', []),
                data.get('labels', []),
                data.get('recommendations_data', []),
                data.get('organization', 'Organisation'),
                args.out,
                data.get('contact_info', None)
            )
            if result_path:
                print(f"SUCCESS:{os.path.abspath(result_path)}")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"FAILURE:{str(e)}")
    else:
        # Test mode
        print("Running in test mode...")
        await generate_pdf_report(
            [83, 38, 56, 50, 32],
            ["Usages de l'IA", "Data", "Compétences & Culture", "Infrastructure", "Stratégie & Vision"],
            [
                {"title": "Optimisation continue des cas d'usage existants", "description": "Bien que l'adoption soit élevée, une optimisation continue peut générer plus de valeur.", "actions": ["Mettre en place un cycle d'amélioration continue", "Définir des KPIs clairs"]},
                {"title": "Mettre en place une gouvernance des données robuste", "description": "Définir des politiques claires pour la collecte, le stockage, l'utilisation et le partage des données.", "actions": ["Créer un comité de gouvernance des données", "Définir des rôles et responsabilités clairs"]},
                {"title": "Renforcer la culture axée sur les données", "description": "Développer une culture basée sur les données probantes.", "actions": ["Proposer des formations data", "Encourager le partage de bonnes pratiques"]},
                {"title": "Moderniser l'infrastructure technique", "description": "Adapter l'infrastructure pour supporter les projets IA.", "actions": ["Audit de l'infrastructure", "Planifier la migration cloud"]},
                {"title": "Définir une vision stratégique IA", "description": "Inscrire l'IA dans la stratégie globale de l'entreprise.", "actions": ["Rédiger une feuille de route IA", "Définir les objectifs à 12 mois"]}
            ],
            output_path="test_rapport_pdf.pdf"
        )

if __name__ == "__main__":
    asyncio.run(main())
