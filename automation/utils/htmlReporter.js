const fs = require('fs');

function generateHtmlReport(results, summaryMetrics, filePath) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MediPredict AI - Android Appium E2E Automation Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e293b, #334155); padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
    h1 { margin: 0 0 10px 0; color: #38bdf8; font-size: 26px; }
    .metrics { display: flex; gap: 20px; margin-top: 20px; }
    .card { background: #1e293b; padding: 20px; border-radius: 10px; flex: 1; text-align: center; border: 1px solid #334155; }
    .card .val { font-size: 28px; font-weight: bold; margin-top: 8px; color: #4ade80; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 10px; overflow: hidden; margin-top: 20px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
    th { background-color: #334155; color: #94a3b8; text-transform: uppercase; font-size: 12px; }
    .badge-pass { background: #166534; color: #4ade80; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📱 MediPredict AI - Android Appium E2E Automation Report</h1>
    <p style="color:#94a3b8;margin:0;">Generated At: ${summaryMetrics.timestamp} | Platform: Android (UiAutomator2) | Target App: MediPredict AI</p>
    <div class="metrics">
      <div class="card"><div>Total Tests</div><div class="val" style="color:#38bdf8;">${summaryMetrics.total}</div></div>
      <div class="card"><div>Passed</div><div class="val" style="color:#4ade80;">${summaryMetrics.passed}</div></div>
      <div class="card"><div>Failed</div><div class="val" style="color:#f87171;">${summaryMetrics.failed}</div></div>
      <div class="card"><div>Pass Rate</div><div class="val" style="color:#a78bfa;">${summaryMetrics.passRate}</div></div>
      <div class="card"><div>Execution Duration</div><div class="val" style="color:#facc15;">${summaryMetrics.executionTime}</div></div>
    </div>
  </div>

  <h2>📊 Execution Details</h2>
  <table>
    <thead>
      <tr>
        <th>Test ID</th>
        <th>Module</th>
        <th>Test Name</th>
        <th>Input Data</th>
        <th>Expected Result</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${results.map(r => `
        <tr>
          <td><b>${r.testId}</b></td>
          <td>${r.module}</td>
          <td>${r.name}</td>
          <td><code>${r.inputData}</code></td>
          <td>${r.expected}</td>
          <td><span class="badge-pass">${r.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync(filePath, htmlContent, 'utf8');
  console.log(` -> HTML Test Report generated successfully: ${filePath}`);
}

module.exports = { generateHtmlReport };
