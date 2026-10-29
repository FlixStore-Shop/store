/**
 * Neon Realtime Integration Module
 * Exposes realtime configuration, live WebSocket endpoint details, and connectivity status.
 */

const hasRealtimeConfig = !!(
  process.env.NEON_REALTIME_URL &&
  process.env.NEON_REALTIME_SECRET
);

function getRealtimeConfig() {
  return {
    enabled: hasRealtimeConfig,
    endpoint: process.env.NEON_REALTIME_URL || null,
    branch: process.env.NEON_BRANCH || 'production',
  };
}

async function checkRealtimeHealth() {
  if (!hasRealtimeConfig) {
    return {
      status: 'disabled',
      configured: false,
      message: 'NEON_REALTIME_URL or NEON_REALTIME_SECRET not set'
    };
  }

  try {
    const url = new URL(process.env.NEON_REALTIME_URL);
    return {
      status: 'ready',
      configured: true,
      protocol: url.protocol,
      host: url.hostname,
      branch: process.env.NEON_BRANCH || 'production'
    };
  } catch (err) {
    return {
      status: 'error',
      configured: true,
      error: err.message
    };
  }
}

module.exports = {
  getRealtimeConfig,
  checkRealtimeHealth,
  hasRealtimeConfig
};
