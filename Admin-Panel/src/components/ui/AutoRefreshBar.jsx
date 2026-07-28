import React from 'react';
import { RefreshCw, Wifi } from 'lucide-react';
import './AutoRefreshBar.css';

/**
 * AutoRefreshBar
 * Shows: live pulse dot + "Live" label + last updated time + countdown + refresh button
 *
 * Props:
 *   countdown    {number}  seconds until next auto-refresh
 *   lastUpdated  {Date}    timestamp of last successful fetch
 *   refreshing   {boolean} true while background poll is in progress
 *   onRefresh    {Function} manual refresh callback
 *   interval     {number}  total interval in seconds (for progress bar)
 *   label        {string}  optional page label (default "Data")
 */
export default function AutoRefreshBar({
  countdown,
  lastUpdated,
  refreshing,
  onRefresh,
  interval = 30,
  label = 'Data',
}) {
  const progress = ((interval - countdown) / interval) * 100;

  const formatTime = (date) => {
    if (!date) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="arb">
      {/* Progress bar at top */}
      <div className="arb__progress-track">
        <div
          className="arb__progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="arb__content">
        {/* Live indicator */}
        <div className="arb__live">
          <span className={`arb__pulse ${refreshing ? 'arb__pulse--refreshing' : ''}`} />
          <span className="arb__live-label">Live</span>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <span className="arb__updated">
            Last updated: <strong>{formatTime(lastUpdated)}</strong>
          </span>
        )}

        {/* Countdown */}
        <span className="arb__countdown">
          <Wifi size={12} />
          Next refresh in <strong>{countdown}s</strong>
        </span>

        {/* Manual refresh button */}
        <button
          className={`arb__btn ${refreshing ? 'arb__btn--spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh now"
        >
          <RefreshCw size={13} />
          <span>{refreshing ? 'Updating…' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}
