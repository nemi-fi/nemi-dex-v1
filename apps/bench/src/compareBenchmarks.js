import { GasDimensions } from "@aztec-labs/stdlib/gas";
import fs from "fs";
import path from "path";

// Read command-line arguments
const [
  baseBranchName,
  newSizesBenchPath,
  baseSizesBenchPath,
  newCommit,
  baseCommit,
] = process.argv.slice(2);

// Load the JSON files
/** @type {import('./utils.js').SizesProfileReport} */
const newSizesBench = JSON.parse(fs.readFileSync(newSizesBenchPath, "utf-8"));
/** @type {import('./utils.js').SizesProfileReport} */
const baseSizesBench = JSON.parse(fs.readFileSync(baseSizesBenchPath, "utf-8"));

// Generate comparison table in Markdown
const tableRows = Object.entries(newSizesBench.summary)
  .map(([name, totalGateCount]) => {
    const gatesCmp = compare(baseSizesBench.summary[name] || 0, totalGateCount);
    const gasCmp = compare(
      baseSizesBench.gasSummary?.[name] || 0,
      newSizesBench.gasSummary[name],
    );

    const gatesDetails = gateCountsDetailsTable(
      newSizesBench.results.find((result) => result.name === name)?.gateCounts,
    );
    const baseGatesDetails = gateCountsDetailsTable(
      baseSizesBench.results.find((result) => result.name === name)?.gateCounts,
    );

    const gasDetails = gasDetailsTable(
      newSizesBench.results.find((result) => result.name === name)?.gas,
    );
    const baseGasDetails = gasDetailsTable(
      baseSizesBench.results.find((result) => result.name === name)?.gas,
    );

    return `| ${name} | ${totalGateCount} (${gatesCmp.diff}) ${gatesCmp.emoji} | ${
      gatesCmp.percentDiff
    } | <details><summary>Show</summary><pre>${gatesDetails}</pre></details> | <details><summary>Show</summary><pre>${baseGatesDetails}</pre></details> | ${newSizesBench.gasSummary[name]} (${gasCmp.diff}) ${gasCmp.emoji} | ${
      gasCmp.percentDiff
    } | <details><summary>Show</summary><pre>${gasDetails}</pre></details> | <details><summary>Show</summary><pre>${baseGasDetails}</pre></details> |`;
  })
  .join("\n");

// Generate Markdown comment
const comment = `
## Changes to Gate Counts & Gas compared to ${baseBranchName}

Generated at commit: ${newCommit}, compared to commit: ${baseCommit}

| Name         | Gates (+/-)      | % Change | Details | Details (${baseBranchName}) | Gas (+/-) | % Change | Details | Details (${baseBranchName}) |
|--------------|------------------|----------|---------|----------------|-----------|----------|---------|----------------|
${tableRows}
`.trim();

// Write the comment to a file
fs.writeFileSync(path.join(process.cwd(), "comment.md"), comment);

function withPlus(value) {
  return value > 0 ? `+${value}` : value;
}

/**
 * @param {import("./utils.js").SizesProfileReport['results'][number]['gateCounts'] | undefined} value
 */
function gateCountsDetailsTable(value) {
  if (value == null) {
    return "N/A";
  }
  return `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Gates</th>
        </tr>
      </thead>
      <tbody>
        ${value
          .map(
            ({ functionName, gateCount }) =>
              `<tr><td>${functionName}</td><td>${gateCount}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `
    .replace(/\n/g, "")
    .replace(/"/g, '\\"');
}

/**
 * @param {import("./utils.js").SizesProfileReport['results'][number]['gas'] | undefined} value
 */
function gasDetailsTable(value) {
  if (value == null) {
    return "N/A";
  }
  // rows: gasLimits, teardownGasLimits
  // cols: l2Gas, daGas
  return `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          ${GasDimensions.map((dimension) => `<th>${dimension}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${Object.entries(value)
          .map(([type, gas]) => {
            return `
              <tr>
                <td>${type}</td>
                ${GasDimensions.map(
                  (dimension) => `<td>${gas[`${dimension}Gas`]}</td>`,
                ).join("")}
              </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `
    .replace(/\n/g, "")
    .replace(/"/g, '\\"');
}

/**
 * @param {number} oldValue
 * @param {number} newValue
 */
function compare(oldValue, newValue) {
  const diff = newValue - oldValue;
  const percentDiff = oldValue > 0 ? diff / oldValue : undefined;
  const emoji = diff === 0 ? "" : diff > 0 ? "❌" : "✅";
  return {
    diff: withPlus(diff),
    percentDiff: formatPercentDiff(percentDiff),
    emoji,
  };
}

/**
 * @param {number | undefined} pct
 */
function formatPercentDiff(pct) {
  if (pct == null) {
    return "N/A";
  }
  if (pct === 0) {
    return "0";
  }
  return withPlus((pct * 100).toFixed(2)) + "%";
}
