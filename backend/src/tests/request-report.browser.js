import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { preview } from "../../../frontend/node_modules/vite/dist/node/index.js";

// Run after the frontend production build. All API traffic is intercepted;
// this smoke test never connects to the configured backend/database.
const server = await preview({
    root: fileURLToPath(new URL("../../../frontend", import.meta.url)),
    configFile: false,
    preview: { host: "127.0.0.1", port: 0 },
});
let browser;
let role = "far";
let submittedReport;
const itemId = "000000000000000000000001";
const associationId = "000000000000000000000002";
const reportAges = ["49m", "1hr", "2d", "Just now"];
const reportRows = [49, 60, 2880, 0].map((minutes, index) => ({
    _id: String(index + 10).padStart(24, "0"), title: `Report ${index + 1}`, entityType: "equipment",
    itemIds: [itemId], condition: "damaged", severity: "medium",
    createdAt: new Date(Date.now() - minutes * 60000).toISOString(),
    approvalStatus: { aew: { status: ["pending", "approved", "denied", "pending"][index] } },
}));
const request = {
    _id: "000000000000000000000003", title: "Browser request", entityType: "equipment", severity: "medium",
    details: "Equipment required for the harvest", lines: [{ key: "Tractor", quantity: 1 }], entityIds: [],
    releaseStatus: "pending", createdAt: "2026-10-25T07:56:55.343Z",
    approvalStatus: { coordinator: { status: "approved" }, governor: { status: "denied" } },
    history: [{
        date: "2026-10-25T09:46:15.153Z",
        message: 'Governor changed their decision. Previous decision: by Juan Governor at 2026-10-25T09:46:15.153Z; remarks: "".',
    }],
};

try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.emulateTimezone("Asia/Manila");
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setRequestInterception(true);
    const origin = server.resolvedUrls.local[0];
    page.on("request", async (httpRequest) => {
        if (!["xhr", "fetch"].includes(httpRequest.resourceType()) && httpRequest.method() !== "OPTIONS") {
            await httpRequest.continue();
            return;
        }
        const path = new URL(httpRequest.url()).pathname;
        let data = {};
        if (path.endsWith("/auth/me")) data = { user: { _id: itemId, fullname: "Browser Reviewer", role, association: associationId } };
        else if (path.endsWith("/equipments/availability")) data = [{ name: "Tractor", available: 3 }];
        else if (path.endsWith("/livestocks/availability")) data = [];
        else if (path.endsWith("/equipments")) data = { equipments: [{ _id: itemId, name: "Tractor", propertyNumber: "EQP-001" }] };
        else if (path.endsWith("/livestocks")) data = { livestocks: [{ _id: itemId, animal: "Carabao", propertyNumber: "LVS-001" }] };
        else if (path.endsWith("/farms")) data = { farms: [] };
        else if (path.endsWith("/reports") && httpRequest.method() === "POST") {
            submittedReport = JSON.parse(httpRequest.postData());
            data = { report: { _id: itemId, ...submittedReport, itemIds: submittedReport.items.map((item) => item.itemId) } };
        } else if (path.endsWith("/reports")) data = { reports: reportRows, pagination: null };
        else if (path.endsWith("/approval/revert") && httpRequest.method() === "PATCH") {
            const { status, reason } = JSON.parse(httpRequest.postData());
            request.approvalStatus.governor = { status, remarks: reason };
            if (status === "approved") request.approvalStatus.head = { status: "pending" };
            else delete request.approvalStatus.head;
            data = { request };
        } else if (path.endsWith("/requests")) data = { requests: role === "governor" ? [request] : [], pagination: null };
        await httpRequest.respond({
            status: httpRequest.method() === "OPTIONS" ? 204 : 200,
            contentType: "application/json",
            headers: {
                "Access-Control-Allow-Origin": httpRequest.headers().origin ?? new URL(origin).origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify(data),
        });
    });

    const clickText = async (selector, text) => {
        await page.waitForFunction((selector, text) => [...document.querySelectorAll(selector)].some((button) => button.offsetParent !== null && button.textContent.trim() === text), {}, selector, text);
        await page.evaluate((selector, text) => [...document.querySelectorAll(selector)].find((button) => button.offsetParent !== null && button.textContent.trim() === text).click(), selector, text);
    };

    await page.goto(new URL("far/reports", origin).href);
    await page.waitForFunction(() => document.querySelectorAll("tbody tr").length === 4);
    const submittedIndex = await page.$$eval("thead th", (headers) => headers.findIndex((header) => header.textContent.trim() === "Submitted"));
    assert.ok(submittedIndex >= 0, "Reports table must include a Submitted column");
    const reportSubmitted = await page.$$eval("tbody tr", (rows, index) => Object.fromEntries(rows.map((row) => {
        const cells = row.querySelectorAll("td");
        return [cells[0].textContent.trim(), cells[index].textContent.trim()];
    })), submittedIndex);
    assert.deepEqual(reportSubmitted, Object.fromEntries(reportRows.map((report, index) => [report.title, reportAges[index]])));
    console.log("PASS: reports show Submitted ages as 49m, 1hr, 2d, and Just now across all statuses");
    await clickText("button", "Add Report");
    await page.type('#report-form input[name="title"]', "Tractor inspection");
    await page.type('#report-form textarea[name="details"]', "Individual findings after checking the tractor.");
    await page.evaluate(() => [...document.querySelectorAll("#report-form label")].find((label) => label.textContent === "Type").parentElement.querySelector("button").click());
    await clickText("#report-form button", "Equipment");
    await clickText("#report-form button", "Select items…");
    await clickText("#report-form button", "Tractor (EQP-001)");
    await page.click('#report-form input[name="title"]');
    await page.waitForFunction(() => document.querySelector('[aria-label="Item condition"] button')?.textContent.trim() === "Damaged");
    assert.equal(await page.$eval("#report-form", (form) => /Select a (valid )?condition|Select at least one item/.test(form.textContent)), false);
    await page.click('[aria-label="Item condition"] button');
    await clickText('[aria-label="Item condition"] button', "Good");
    await page.waitForFunction(() => !/Select a (valid )?condition|Select at least one item/.test(document.querySelector("#report-form").textContent));
    await page.click('[aria-label="Item severity"] button');
    await clickText('[aria-label="Item severity"] button', "High");
    for (const label of ["Item condition", "Item severity"]) {
        const inline = await page.$eval(`[aria-label="${label}"]`, (group) => {
            const text = group.querySelector("span").getBoundingClientRect();
            const input = group.querySelector("button").getBoundingClientRect();
            return text.right <= input.left && Math.abs((text.top + text.height / 2) - (input.top + input.height / 2)) < 2;
        });
        assert.equal(inline, true, `${label} label should precede its select inline`);
    }
    await page.click('button[form="report-form"]');
    await page.waitForFunction(() => !document.querySelector("#report-form"));
    assert.deepEqual(submittedReport.items, [{ itemId, condition: "good", severity: "high" }]);
    console.log("PASS: equipment defaults to Damaged, remains editable, and submits without condition errors");

    await clickText("button", "Add Report");
    await page.type('#report-form input[name="title"]', "Carabao inspection");
    await page.type('#report-form textarea[name="details"]', "Health findings after inspecting the carabao.");
    await page.evaluate(() => [...document.querySelectorAll("#report-form label")].find((label) => label.textContent === "Type").parentElement.querySelector("button").click());
    await clickText("#report-form button", "Livestock");
    await clickText("#report-form button", "Select items…");
    await clickText("#report-form button", "Carabao (LVS-001)");
    await page.click('#report-form input[name="title"]');
    await page.waitForFunction(() => document.querySelector('[aria-label="Item condition"] button')?.textContent.trim() === "Sick");
    await page.click('button[form="report-form"]');
    await page.waitForFunction(() => !document.querySelector("#report-form"));
    assert.deepEqual(submittedReport.items, [{ itemId, condition: "sick", severity: "medium" }]);
    console.log("PASS: livestock defaults to Sick and submits without requiring a condition change");

    await page.goto(new URL("far/requests", origin).href);
    await clickText("button", "Add Request");
    await clickText("#request-form button", "Select equipment names/types…");
    await clickText("#request-form button", "Tractor — 3 available");
    await page.click('#request-form input[name="title"]');
    const quantityDesign = await page.$eval("#request-form", (form) => {
        const label = form.querySelector('label[for="request-quantity-0"]').getBoundingClientRect();
        const input = form.querySelector("#request-quantity-0").getBoundingClientRect();
        return { inline: label.right <= input.left && Math.abs((label.top + label.height / 2) - (input.top + input.height / 2)) < 2, hint: /of \d+ available/.test(form.textContent) };
    });
    assert.deepEqual(quantityDesign, { inline: true, hint: false });
    console.log("PASS: quantity label precedes the input inline and the availability hint is removed");

    role = "governor";
    await page.goto(new URL("governor/requests", origin).href);
    for (const status of ["Approved", "Denied"]) {
        await page.waitForSelector('button[aria-label="Change decision"]');
        await page.click('button[aria-label="Change decision"]');
        assert.deepEqual(await page.$$eval("#decision-form strong", (labels) => labels.map((label) => label.textContent)), [status === "Approved" ? "Denied" : "Approved", status]);
        await page.type('#decision-form textarea[name="reason"]', "Reviewed the available stock");
        await page.click('button[form="decision-form"]');
        await page.waitForFunction((status) => !document.querySelector("#decision-form") && [...document.querySelectorAll("tbody tr")].some((row) => row.querySelectorAll("td")[4]?.textContent.trim() === status), {}, status);
        assert.match(await page.$eval("tbody tr", (row) => row.querySelectorAll("td")[5].textContent), /^(?:\d+(?:m|hr|d)|Just now)$/);
    }
    console.log("PASS: governor status switches Denied → Approved → Denied without showing Pending");

    await page.click('button[aria-label="View"]');
    await page.waitForFunction(() => document.querySelector("aside") && document.body.textContent.includes("by Juan Governor at October 25, 2026"));
    await page.click('aside button[aria-label="Close"]');
    request.approvalStatus.governor = { status: "pending" };
    delete request.approvalStatus.head;
    request.createdAt = new Date().toISOString();
    await page.reload();
    await page.waitForFunction(() => [...document.querySelectorAll("tbody tr")].some((row) => row.querySelectorAll("td")[5]?.textContent === "Just now"));
    assert.equal(await page.$eval("thead", (head) => head.textContent.includes("Submitted") && !head.textContent.includes("Pending For") && !head.textContent.includes("Requested At")), true);
    await page.click('button[aria-label="Deny"]');
    await page.waitForSelector('[aria-label="Suggested denial reasons"]');
    for (const width of [1440, 390]) {
        await page.setViewport({ width, height: 1000 });
        const layout = await page.$eval('[aria-label="Suggested denial reasons"]', (group) => {
            const style = getComputedStyle(group);
            const [first, second] = [...group.querySelectorAll("button")].map((button) => button.getBoundingClientRect());
            return { display: style.display, wrap: style.flexWrap, sideBySide: Math.abs(first.top - second.top) < 2 && first.right < second.left };
        });
        assert.deepEqual(layout, { display: "flex", wrap: "wrap", sideBySide: true });
    }
    await clickText('[aria-label="Suggested denial reasons"] button', "Out of Stock");
    await page.waitForFunction(() => document.querySelector('textarea[placeholder="e.g., Out of Stock"]')?.value === "Out of Stock");
    assert.deepEqual(errors, []);
    console.log("PASS: long audit dates, capitalized decisions, compact Submitted ages, and wrapping denial suggestions on desktop/mobile");
} finally {
    await browser?.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
}
