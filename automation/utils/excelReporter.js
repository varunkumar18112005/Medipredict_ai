const path = require('path');
const XLSX = require('xlsx');

function generateExcelReport(results, summaryMetrics, filePath) {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryData = [
    ["MEDIPREDICT AI - ENTERPRISE ANDROID APPIUM E2E TEST REPORT"],
    ["Generated At", summaryMetrics.timestamp],
    ["Target Platform", "Android (UiAutomator2) / Mobile App"],
    ["Framework", "Page Object Model + Appium + WebdriverIO"],
    [""],
    ["EXECUTION SUMMARY METRICS"],
    ["Metric", "Value"],
    ["Total Test Cases Executed", summaryMetrics.total],
    ["Total Passed", summaryMetrics.passed],
    ["Total Failed", summaryMetrics.failed],
    ["Pass Percentage", summaryMetrics.passRate],
    ["Total Execution Time", summaryMetrics.executionTime],
    [""],
    ["MODULE BREAKDOWN SUMMARY"],
    ["Module / Feature Area", "Test Count", "Passed", "Failed", "Pass Rate"]
  ];

  const modules = [...new Set(results.map(r => r.module))];
  modules.forEach(m => {
    const modResults = results.filter(r => r.module === m);
    const modPassed = modResults.filter(r => r.status === "PASS").length;
    const modFailed = modResults.filter(r => r.status === "FAIL").length;
    const modPassRate = `${((modPassed / modResults.length) * 100).toFixed(1)}%`;
    summaryData.push([m, modResults.length, modPassed, modFailed, modPassRate]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

  // 2. Test Details Sheet
  const detailHeaders = [
    "Test ID",
    "Module / Feature",
    "Test Case Name",
    "Description",
    "Input Data",
    "Expected Result",
    "Actual Result",
    "Duration (ms)",
    "Status"
  ];

  const detailRows = results.map(r => [
    r.testId,
    r.module,
    r.name,
    r.description,
    r.inputData,
    r.expected,
    r.actual,
    r.durationMs,
    r.status
  ]);

  const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  wsDetails['!cols'] = [
    { wch: 12 },
    { wch: 38 },
    { wch: 45 },
    { wch: 55 },
    { wch: 45 },
    { wch: 55 },
    { wch: 55 },
    { wch: 15 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, wsDetails, "Test Details");

  XLSX.writeFile(wb, filePath);
  console.log(` -> Excel Test Report generated successfully: ${filePath}`);
}

module.exports = { generateExcelReport };
