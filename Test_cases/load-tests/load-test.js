const autocannon = require('autocannon');
const path = require('path');
const fs = require('fs');

// Target Backend Endpoint
const TARGET_URL = process.env.API_URL || 'http://localhost:8085/api/v1/hospitals/nearby?lat=13.6288&lon=79.4192';
const CONNECTIONS = parseInt(process.env.VIRTUAL_USERS || '100', 10);
const DURATION_SECONDS = parseInt(process.env.DURATION || '60', 10);

async function runLoadTest() {
  console.log('================================================================');
  console.log('  MediPredict AI Backend - Baseline Load Testing Execution');
  console.log('================================================================\n');

  console.log(`-> Target Endpoint : ${TARGET_URL}`);
  console.log(`-> Virtual Users   : ${CONNECTIONS} concurrent connections`);
  console.log(`-> Duration        : ${DURATION_SECONDS} seconds (1 minute)`);
  console.log('-> Benchmarking in progress... Please wait 1 minute.\n');

  const instance = autocannon(
    {
      url: TARGET_URL,
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
      headers: {
        'content-type': 'application/json',
      },
    },
    (err, result) => {
      if (err) {
        console.error('Load testing error:', err);
        return;
      }
      displayAndSaveResults(result);
    }
  );

  autocannon.track(instance, { renderProgressBar: true, renderLatencyTable: true });
}

function displayAndSaveResults(result) {
  console.log('\n================================================================');
  console.log('  LOAD TEST RESULTS SUMMARY');
  console.log('================================================================\n');

  const rps = Math.round(result.requests.average);
  const minLatency = result.latency.min;
  const avgLatency = Math.round(result.latency.average);
  const maxLatency = result.latency.max;
  const p95Latency = result.latency.p95;
  const p99Latency = result.latency.p99;
  const totalRequests = result.requests.total;
  const total2xx = result['2xx'];
  const non2xx = result.non2xx;

  console.log(`• Requests Per Second (RPS) : ${rps} req/sec`);
  console.log(`• Total Requests Sent       : ${totalRequests.toLocaleString()} requests`);
  console.log(`• Successful Responses (2xx): ${total2xx.toLocaleString()}`);
  console.log(`• Failed Responses (Non-2xx): ${non2xx.toLocaleString()}`);
  console.log('\n• Response Time (Latency Breakdown):');
  console.log(`   - Minimum (Fastest)      : ${minLatency} ms`);
  console.log(`   - Average                : ${avgLatency} ms`);
  console.log(`   - Maximum (Slowest)      : ${maxLatency} ms`);
  console.log(`   - 95th Percentile (p95)  : ${p95Latency} ms`);
  console.log(`   - 99th Percentile (p99)  : ${p99Latency} ms`);
  console.log('\n================================================================\n');

  // Trigger Excel Report Generation
  const generatorPath = path.join(__dirname, 'generate_load_test_report.js');
  if (fs.existsSync(generatorPath)) {
    const generateReport = require('./generate_load_test_report');
    generateReport({
      rps,
      minLatency,
      avgLatency,
      maxLatency,
      p95Latency,
      p99Latency,
      totalRequests,
      total2xx,
      non2xx,
      connections: CONNECTIONS,
      duration: DURATION_SECONDS,
      targetUrl: TARGET_URL
    });
  }
}

if (require.main === module) {
  runLoadTest();
}

module.exports = { runLoadTest };
