import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { getDateRange } from "../utils/dateRange.util.js";
import {
    PERIOD_LABEL,
    capitalize,
    formatDate,
    getEquipmentRows,
    getLivestockRows,
    getFarmRows,
} from "./analyticsReportData.service.js";

const BORDER_STYLE = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
};

const HEADER_FILL = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
};

const HEADER_FONT = {
    name: "Arial",
    size: 9,
    bold: true,
    color: { argb: "FF475569" },
};

const DATA_FONT = {
    name: "Arial",
    size: 9.5,
    color: { argb: "FF0F172A" },
};

const ZEBRA_FILL = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
};

function autoFitColumns(worksheet) {
    worksheet.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            // Ignore main title and subtitle rows when calculating column width
            if (rowNumber <= 3) return;
            const cellValue = cell.value ? String(cell.value) : "";
            if (cellValue.length > maxLen) {
                maxLen = cellValue.length;
            }
        });
        column.width = Math.min(Math.max(maxLen + 4, 14), 45);
    });
}

function addSectionHeader(worksheet, title) {
    const row = worksheet.addRow([title]);
    row.height = 24;
    const cell = row.getCell(1);
    cell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "bottom", horizontal: "left" };
}

function renderTableToWorksheet(worksheet, headers, rows) {
    const headerRow = worksheet.addRow(headers.map((h) => h.toUpperCase()));
    headerRow.height = 20;

    headerRow.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.border = BORDER_STYLE;
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
    });

    if (!rows.length) {
        const emptyRow = worksheet.addRow(["No records for this period."]);
        emptyRow.height = 18;
        const cell = emptyRow.getCell(1);
        cell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        worksheet.addRow([]);
        return;
    }

    rows.forEach((rowData, idx) => {
        const row = worksheet.addRow(rowData);
        row.height = 18;
        const isEven = idx % 2 === 1;

        row.eachCell((cell) => {
            cell.font = DATA_FONT;
            cell.border = BORDER_STYLE;
            cell.alignment = { vertical: "middle", horizontal: "left" };
            if (isEven) {
                cell.fill = ZEBRA_FILL;
            }
        });
    });

    worksheet.addRow([]); // Blank spacing row
}

export const generateAnalyticsExcel = async ({ section = "all", association, period = "month" }) => {
    const associationId = association ? new mongoose.Types.ObjectId(association) : null;
    const { start, end } = getDateRange(period);

    const sectionsToInclude = section === "all" ? ["equipment", "livestock", "farm"] : [section];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AgriCentral";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Analytics Report", {
        views: [{ showGridLines: true }],
    });

    // Main Title
    const titleRow = worksheet.addRow(["AgriCentral Analytics Report"]);
    titleRow.height = 26;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF0F172A" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    // Subtitle
    const subtitleText = `${PERIOD_LABEL[period] || "Period"} • ${formatDate(start)} – ${formatDate(end)}`;
    const subtitleRow = worksheet.addRow([subtitleText]);
    subtitleRow.height = 18;
    const subtitleCell = subtitleRow.getCell(1);
    subtitleCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "left" };

    worksheet.addRow([]); // Spacer

    // Equipment Section
    if (sectionsToInclude.includes("equipment")) {
        const rows = await getEquipmentRows({ associationId, start, end });
        addSectionHeader(worksheet, "Equipment");
        const headers = [
            "Property #",
            "Name",
            "Condition",
            "Status",
            "Association",
            "Assigned Farmer",
            "Date Added",
        ];
        const body = rows.map((e) => [
            e.propertyNumber,
            e.name,
            capitalize(e.condition),
            capitalize(e.status),
            e.association,
            e.assignedFarmer,
            formatDate(e.dateAdded),
        ]);
        renderTableToWorksheet(worksheet, headers, body);
    }

    // Livestock Section
    if (sectionsToInclude.includes("livestock")) {
        const rows = await getLivestockRows({ associationId, start, end });
        addSectionHeader(worksheet, "Livestock");
        const headers = [
            "Property #",
            "Animal",
            "Breed",
            "Gender",
            "Birth Date",
            "Color",
            "Weight",
            "Condition",
            "Status",
            "Association",
            "Assigned Farmer",
            "Date Added",
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
        renderTableToWorksheet(worksheet, headers, body);
    }

    // Farm Section
    if (sectionsToInclude.includes("farm")) {
        const rows = await getFarmRows({ associationId, start, end });
        addSectionHeader(worksheet, "Farm");
        const headers = [
            "Farm",
            "Crop",
            "Planted",
            "Growing",
            "Withered",
            "Damaged",
            "Harvested",
            "Planted Date",
            "Harvested Date",
        ];
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
        renderTableToWorksheet(worksheet, headers, body);
    }

    autoFitColumns(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};
