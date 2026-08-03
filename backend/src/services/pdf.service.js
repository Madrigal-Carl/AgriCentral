import mongoose from "mongoose";
import puppeteer from "puppeteer";
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Farm from "../models/farm.model.js";
import Harvest from "../models/harvest.model.js";
import { getDateRange } from "../utils/dateRange.util.js";

const PERIOD_LABEL = { week: "This Week", month: "This Month", year: "This Year" };

/* ---------------- Helpers ---------------- */
function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

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

function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/* ---------------- Data fetchers ---------------- */

// Shared by Equipment and Livestock: exclude deletedAt/reservedBy from
// output, blank out association/assignedFarmer when null, scope by
// association + createdAt within the selected period.
const buildEntityMatch = ({ associationId, start, end }) => ({
    deletedAt: null,
    ...(associationId && { association: associationId }),
    createdAt: { $gte: start, $lte: end },
});

const ENTITY_POPULATE = [
    { path: "association", select: "name" },
    { path: "assignedFarmer", select: "firstName lastName" },
];

async function getEquipmentRows({ associationId, start, end }) {
    const docs = await Equipment.find(buildEntityMatch({ associationId, start, end }))
        .populate(ENTITY_POPULATE)
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((e) => ({
        propertyNumber: e.propertyNumber,
        name: e.name,
        condition: e.condition,
        status: e.status,
        association: e.association?.name ?? "",
        assignedFarmer: e.assignedFarmer
            ? `${e.assignedFarmer.firstName} ${e.assignedFarmer.lastName}`
            : "",
        dateAdded: e.createdAt,
    }));
}

async function getLivestockRows({ associationId, start, end }) {
    const docs = await Livestock.find(buildEntityMatch({ associationId, start, end }))
        .populate(ENTITY_POPULATE)
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((l) => ({
        propertyNumber: l.propertyNumber,
        animal: l.animal,
        breed: l.breed,
        gender: l.gender,
        birthDate: l.birthDate,
        color: l.color,
        weight: l.weight,
        condition: l.condition,
        status: l.status,
        association: l.association?.name ?? "",
        assignedFarmer: l.assignedFarmer
            ? `${l.assignedFarmer.firstName} ${l.assignedFarmer.lastName}`
            : "",
        dateAdded: l.createdAt,
    }));
}

// One row per farm+crop entry. "Harvested" and "Harvested Date" come from
// the Harvest log (real per-event dates), scoped to the period — not the
// farm's cumulative quantities.harvested field. A crop entry is included
// if its lifecycle was touched in the period (crops.updatedAt, same filter
// the dashboard's crop-status chart uses) OR it had a harvest event in the
// period, so a crop harvested this period still shows up even if nothing
// else about it changed recently.
async function getFarmRows({ associationId, start, end }) {
    const farmMatch = {
        deletedAt: null,
        ...(associationId && { association: associationId }),
    };

    const farms = await Farm.find(farmMatch)
        .populate({ path: "crops.crop", select: "name" })
        .lean();

    const farmIds = farms.map((f) => f._id);

    const harvestRows = await Harvest.aggregate([
        {
            $match: {
                farm: { $in: farmIds },
                harvestedAt: { $gte: start, $lte: end },
                ...(associationId && { association: associationId }),
            },
        },
        {
            $group: {
                _id: { farm: "$farm", crop: "$crop" },
                harvested: { $sum: "$quantity" },
                lastHarvestedAt: { $max: "$harvestedAt" },
            },
        },
    ]);

    const harvestByKey = new Map(
        harvestRows.map((r) => [
            `${r._id.farm}:${r._id.crop}`,
            { harvested: r.harvested, lastHarvestedAt: r.lastHarvestedAt },
        ]),
    );

    const rows = [];
    for (const farm of farms) {
        for (const c of farm.crops ?? []) {
            const updatedAt = c.updatedAt ? new Date(c.updatedAt) : null;
            const inPeriod = updatedAt && updatedAt >= start && updatedAt <= end;
            const key = `${farm._id}:${c.crop?._id}`;
            const harvestInfo = harvestByKey.get(key);

            if (!inPeriod && !harvestInfo) continue;

            rows.push({
                farm: `${farm.tag} - ${farm.address}`,
                crop: c.crop?.name ?? "Unknown crop",
                planted: c.quantities?.planted ?? 0,
                growing: c.quantities?.growing ?? 0,
                withered: c.quantities?.withered ?? 0,
                damaged: c.quantities?.damaged ?? 0,
                harvested: harvestInfo?.harvested ?? 0,
                plantedDate: c.createdAt,
                harvestedDate: harvestInfo?.lastHarvestedAt ?? null,
            });
        }
    }

    return rows;
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