import mongoose from "mongoose";
import puppeteer from "puppeteer";
import { getDateRange } from "../utils/dateRange.util.js";
import {
    PERIOD_LABEL,
    capitalize,
    formatDate,
    getEquipmentRows,
    getLivestockRows,
    getFarmRows,
} from "./analyticsReportData.service.js";

/* ---------------- Helpers ---------------- */
function escapeHtml(s) {
    return String(s).replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[c],
    );
}

/* ---------------- HTML rendering ---------------- */

const REPORT_STYLES = `
  body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; padding: 24px; }
  h1 { font-size: 18px; margin-bottom: 2px; }
  .subtitle { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #e2e8f0; padding: 4px 6px; font-size: 10px; text-align: left; }
  th { background: #f1f5f9; text-transform: uppercase; letter-spacing: 0.03em; font-size: 9px; color: #475569; }
  tr:nth-child(even) { background: #f8fafc; }
`;

function renderTable(headers, rows) {
    if (!rows.length) {
        return `<p style="font-size:11px;color:#64748b;">No records for this period.</p>`;
    }
    const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = rows
        .map(
            (row) =>
                `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? "")}</td>`).join("")}</tr>`,
        )
        .join("");
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderEquipmentSection(rows) {
    const headers = ["Property #", "Name", "Condition", "Status", "Association", "Assigned Farmer", "Date Added"];
    const body = rows.map((e) => [
        e.propertyNumber,
        e.name,
        capitalize(e.condition),
        capitalize(e.status),
        e.association,
        e.assignedFarmer,
        formatDate(e.dateAdded),
    ]);
    return `<h2>Equipment</h2>${renderTable(headers, body)}`;
}

function renderLivestockSection(rows) {
    const headers = [
        "Property #", "Animal", "Breed", "Gender", "Birth Date",
        "Color", "Weight", "Condition", "Status", "Association", "Assigned Farmer", "Date Added",
    ];
    const body = rows.map((l) => [
        l.propertyNumber,
        l.animal,
        l.breed,
        capitalize(l.gender),
        formatDate(l.birthDate),
        l.color,
        l.weight,
        capitalize(l.condition),
        capitalize(l.status),
        l.association,
        l.assignedFarmer,
        formatDate(l.dateAdded),
    ]);
    return `<h2>Livestock</h2>${renderTable(headers, body)}`;
}

function renderFarmSection(rows) {
    const headers = ["Farm", "Crop", "Planted", "Growing", "Withered", "Damaged", "Harvested", "Planted Date", "Harvested Date"];
    const body = rows.map((r) => [
        r.farm,
        r.crop,
        r.planted,
        r.growing,
        r.withered,
        r.damaged,
        r.harvested,
        formatDate(r.plantedDate),
        formatDate(r.harvestedDate),
    ]);
    return `<h2>Farm</h2>${renderTable(headers, body)}`;
}

/* ---------------- Main entry point ---------------- */

export const generateAnalyticsPdf = async ({ section = "all", association, period = "month" }) => {
    const associationId = association ? new mongoose.Types.ObjectId(association) : null;
    const { start, end } = getDateRange(period);

    const sectionsToInclude = section === "all" ? ["equipment", "livestock", "farm"] : [section];

    const htmlParts = [];

    if (sectionsToInclude.includes("equipment")) {
        const rows = await getEquipmentRows({ associationId, start, end });
        htmlParts.push(renderEquipmentSection(rows));
    }
    if (sectionsToInclude.includes("livestock")) {
        const rows = await getLivestockRows({ associationId, start, end });
        htmlParts.push(renderLivestockSection(rows));
    }
    if (sectionsToInclude.includes("farm")) {
        const rows = await getFarmRows({ associationId, start, end });
        htmlParts.push(renderFarmSection(rows));
    }

    const fullHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>${REPORT_STYLES}</style>
        </head>
        <body>
          <h1>AgriCentral Analytics Report</h1>
          <p class="subtitle">${PERIOD_LABEL[period]} &bull; ${formatDate(start)} &ndash; ${formatDate(end)}</p>
          ${htmlParts.join("")}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: "networkidle0" });
        return await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
        });
    } finally {
        await browser.close();
    }
};