import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Activity,
  Pause,
  Play,
  RotateCcw,
  Zap,
  Thermometer,
  Radio,
  Eye,
  EyeOff
} from 'lucide-react';

export interface RoverTelemetrySample {
  time: string;
  timestamp: number;
  batterySoc: number; // 0 - 100%
  batteryVoltage: number; // Volts (e.g. 32.4V)
  batteryDrainRate: number; // %/hr
  motorTemp: number; // -10 to 50 °C
  signalStrengthDbm: number; // dBm (e.g. -70.7)
  signalQuality: number; // 0 - 100%
  snrDb: number; // dB (e.g. +26.8)
}

// Initial 9-point time series baseline (-40s to NOW)
const INITIAL_TELEMETRY_SERIES: RoverTelemetrySample[] = [
  {
    time: '-40s',
    timestamp: Date.now() - 40000,
    batterySoc: 89.2,
    batteryVoltage: 32.5,
    batteryDrainRate: -1.1,
    motorTemp: 19.5,
    signalStrengthDbm: -72.4,
    signalQuality: 62.0,
    snrDb: 25.4
  },
  {
    time: '-35s',
    timestamp: Date.now() - 35000,
    batterySoc: 89.1,
    batteryVoltage: 32.5,
    batteryDrainRate: -1.2,
    motorTemp: 20.1,
    signalStrengthDbm: -71.9,
    signalQuality: 63.5,
    snrDb: 25.8
  },
  {
    time: '-30s',
    timestamp: Date.now() - 30000,
    batterySoc: 89.0,
    batteryVoltage: 32.4,
    batteryDrainRate: -1.2,
    motorTemp: 20.8,
    signalStrengthDbm: -71.2,
    signalQuality: 64.0,
    snrDb: 26.1
  },
  {
    time: '-25s',
    timestamp: Date.now() - 25000,
    batterySoc: 88.9,
    batteryVoltage: 32.4,
    batteryDrainRate: -1.1,
    motorTemp: 21.2,
    signalStrengthDbm: -71.5,
    signalQuality: 63.0,
    snrDb: 25.9
  },
  {
    time: '-20s',
    timestamp: Date.now() - 20000,
    batterySoc: 88.8,
    batteryVoltage: 32.4,
    batteryDrainRate: -1.3,
    motorTemp: 21.6,
    signalStrengthDbm: -70.9,
    signalQuality: 64.8,
    snrDb: 26.5
  },
  {
    time: '-15s',
    timestamp: Date.now() - 15000,
    batterySoc: 88.7,
    batteryVoltage: 32.4,
    batteryDrainRate: -1.2,
    motorTemp: 21.9,
    signalStrengthDbm: -71.0,
    signalQuality: 64.2,
    snrDb: 26.3
  },
  {
    time: '-10s',
    timestamp: Date.now() - 10000,
    batterySoc: 88.6,
    batteryVoltage: 32.4,
    batteryDrainRate: -1.2,
    motorTemp: 22.1,
    signalStrengthDbm: -70.8,
    signalQuality: 65.0,
    snrDb: 26.7
  },
  {
    time: '-5s',
    timestamp: Date.now() - 5000,
    batterySoc: 88.5,
    batteryVoltage: 32.4,
    batteryDrainRate: -1.2,
    motorTemp: 22.0,
    signalStrengthDbm: -70.7,
    signalQuality: 65.2,
    snrDb: 26.8
  },
  {
    time: 'NOW',
    timestamp: Date.now(),
    batterySoc: 88.5,
    batteryVoltage: 32.4,
    batteryDrainRate: -1.2,
    motorTemp: 22.0,
    signalStrengthDbm: -70.7,
    signalQuality: 65.0,
    snrDb: 26.8
  }
];

interface RoverTelemetryPanelProps {
  className?: string;
  streamingIntervalMs?: number;
}

export const RoverTelemetryPanel: React.FC<RoverTelemetryPanelProps> = ({
  className = '',
  streamingIntervalMs = 1800
}) => {
  // Chart Visibility Toggles
  const [showBattery, setShowBattery] = useState<boolean>(true);
  const [showMotorTemp, setShowMotorTemp] = useState<boolean>(true);
  const [showSignal, setShowSignal] = useState<boolean>(true);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [telemetryData, setTelemetryData] = useState<RoverTelemetrySample[]>(INITIAL_TELEMETRY_SERIES);

  // Latest Sample for KPI Displays
  const latestSample = useMemo(() => {
    return telemetryData[telemetryData.length - 1] || INITIAL_TELEMETRY_SERIES[INITIAL_TELEMETRY_SERIES.length - 1];
  }, [telemetryData]);

  // Real-time generator function
  const generateNextSample = useCallback((prev: RoverTelemetrySample[]): RoverTelemetrySample[] => {
    const last = prev[prev.length - 1];

    // Subtle realistic fluctuations
    const deltaSoc = -Number((0.01 + Math.random() * 0.02).toFixed(2));
    const nextSoc = Number(Math.max(10, Math.min(100, last.batterySoc + deltaSoc)).toFixed(1));
    const nextVoltage = Number((32.2 + (nextSoc / 100) * 0.3 + (Math.random() * 0.06 - 0.03)).toFixed(1));
    const nextDrain = Number((-1.1 - Math.random() * 0.25).toFixed(1));

    // Motor temp slight fluctuation around 22°C
    const tempDelta = (Math.random() - 0.48) * 0.4;
    const nextTemp = Number(Math.max(12, Math.min(42, last.motorTemp + tempDelta)).toFixed(1));

    // Signal fluctuation around -70.7 dBm (60 - 72%)
    const sigDelta = (Math.random() - 0.5) * 0.8;
    const nextDbm = Number(Math.max(-85, Math.min(-60, last.signalStrengthDbm + sigDelta)).toFixed(1));
    const nextQuality = Number(Math.max(50, Math.min(80, last.signalQuality + (Math.random() - 0.5) * 1.5)).toFixed(1));
    const nextSnr = Number((26.0 + (nextQuality / 100) * 1.5 + (Math.random() * 0.3 - 0.15)).toFixed(1));

    const newSample: RoverTelemetrySample = {
      time: 'NOW',
      timestamp: Date.now(),
      batterySoc: nextSoc,
      batteryVoltage: nextVoltage,
      batteryDrainRate: nextDrain,
      motorTemp: nextTemp,
      signalStrengthDbm: nextDbm,
      signalQuality: nextQuality,
      snrDb: nextSnr
    };

    // Re-label time offsets backwards from NOW
    const newHistory = [...prev.slice(1), newSample];
    const len = newHistory.length;
    return newHistory.map((s, idx) => {
      const offsetSeconds = (len - 1 - idx) * 5;
      return {
        ...s,
        time: offsetSeconds === 0 ? 'NOW' : `-${offsetSeconds}s`
      };
    });
  }, []);

  // Interval timer for real-time streaming
  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      setTelemetryData((prev) => generateNextSample(prev));
    }, streamingIntervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, streamingIntervalMs, generateNextSample]);

  // Reset function
  const handleReset = () => {
    setTelemetryData(INITIAL_TELEMETRY_SERIES);
    setIsStreaming(true);
  };

  return (
    <div
      className={`bg-[#0b0f17]/95 border border-cyan-950/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 ${className}`}
    >
      {/* 1. Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
        {/* Left: Title, Pulse Icon & Streaming Badge */}
        <div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
            <h2 className="font-['Orbitron'] font-extrabold text-sm sm:text-base tracking-wider text-slate-100 uppercase">
              ROVER REAL-TIME D3 TELEMETRY
            </h2>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-full flex items-center space-x-1.5 transition-all shadow-sm ${
                isStreaming
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isStreaming ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>{isStreaming ? 'STREAMING 1.8s' : 'PAUSED'}</span>
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1 tracking-tight">
            Perseverance (Mars 2020) • Multi-Axis Actuator & Power Stream
          </p>
        </div>

        {/* Right: Pause & Reset Controls */}
        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsStreaming((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isStreaming
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                : 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
            }`}
            title={isStreaming ? 'Pause Real-Time Telemetry Stream' : 'Resume Telemetry Stream'}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 text-cyan-400" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>RESUME</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 rounded-lg transition-colors cursor-pointer"
            title="Reset telemetry buffer & series"
            aria-label="Reset Telemetry"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Three KPI Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {/* Card 1: Battery (SOC) - Cyan / Teal */}
        <button
          type="button"
          onClick={() => setShowBattery((prev) => !prev)}
          className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between ${
            showBattery
              ? 'bg-cyan-950/20 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-cyan-800/60'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-cyan-300">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>[⚡] BATTERY (SOC)</span>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              NOMINAL
            </span>
          </div>

          {/* Card Body: Values */}
          <div className="flex items-baseline space-x-2 my-1">
            <span className="font-['Orbitron'] font-black text-2xl sm:text-3xl text-slate-100 tracking-tight">
              {latestSample.batterySoc.toFixed(1)}%
            </span>
            <span className="font-mono text-xs font-semibold text-cyan-400">
              {latestSample.batteryVoltage.toFixed(1)}V
            </span>
          </div>

          {/* Card Footer: Subtext & Toggle Status */}
          <div className="flex items-center justify-between text-[11px] font-mono mt-1 pt-1.5 border-t border-slate-800/60">
            <span className="text-slate-400">Drain: {latestSample.batteryDrainRate.toFixed(1)}%/hr</span>
            <span className="text-cyan-400 font-semibold flex items-center space-x-1">
              {showBattery ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{showBattery ? 'Click to Hide' : 'Click to Show'}</span>
            </span>
          </div>
        </button>

        {/* Card 2: Motor Temp - Orange / Amber */}
        <button
          type="button"
          onClick={() => setShowMotorTemp((prev) => !prev)}
          className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between ${
            showMotorTemp
              ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-amber-800/60'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-amber-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>[🌡️] MOTOR TEMP</span>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
              SAFE
            </span>
          </div>

          {/* Card Body: Values */}
          <div className="flex items-baseline space-x-2 my-1">
            <span className="font-['Orbitron'] font-black text-2xl sm:text-3xl text-slate-100 tracking-tight">
              {Math.round(latestSample.motorTemp)}°C
            </span>
            <span className="font-mono text-xs font-semibold text-amber-400">
              Max: +45°C
            </span>
          </div>

          {/* Card Footer: Subtext & Toggle Status */}
          <div className="flex items-center justify-between text-[11px] font-mono mt-1 pt-1.5 border-t border-slate-800/60">
            <span className="text-slate-400">Actuator #3</span>
            <span className="text-amber-400 font-semibold flex items-center space-x-1">
              {showMotorTemp ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{showMotorTemp ? 'Click to Hide' : 'Click to Show'}</span>
            </span>
          </div>
        </button>

        {/* Card 3: Signal (UHF) - Light Blue */}
        <button
          type="button"
          onClick={() => setShowSignal((prev) => !prev)}
          className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between ${
            showSignal
              ? 'bg-sky-950/20 border-sky-500/50 hover:border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:shadow-[0_0_20px_rgba(14,165,233,0.25)]'
              : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-sky-800/60'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-sky-300">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>[((o))] SIGNAL (UHF)</span>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-sky-950/80 border border-sky-500/40 text-sky-300">
              LOCKED
            </span>
          </div>

          {/* Card Body: Values */}
          <div className="flex items-baseline space-x-2 my-1">
            <span className="font-['Orbitron'] font-black text-2xl sm:text-3xl text-slate-100 tracking-tight">
              {latestSample.signalStrengthDbm.toFixed(1)} dBm
            </span>
            <span className="font-mono text-xs font-semibold text-sky-400">
              ({Math.round(latestSample.signalQuality)}%)
            </span>
          </div>

          {/* Card Footer: Subtext & Toggle Status */}
          <div className="flex items-center justify-between text-[11px] font-mono mt-1 pt-1.5 border-t border-slate-800/60">
            <span className="text-slate-400">SNR: +{latestSample.snrDb.toFixed(1)} dB</span>
            <span className="text-sky-400 font-semibold flex items-center space-x-1">
              {showSignal ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{showSignal ? 'Click to Hide' : 'Click to Show'}</span>
            </span>
          </div>
        </button>
      </div>

      {/* 3. The Recharts Graph Area */}
      <div className="w-full bg-[#080c14]/90 border border-slate-800/80 rounded-xl p-3 sm:p-4 shadow-inner relative">
        <div className="w-full h-[260px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={telemetryData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              {/* Gradient Fill Definitions */}
              <defs>
                {/* Battery Cyan Gradient */}
                <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>

                {/* Motor Temp Amber Gradient */}
                <linearGradient id="motorTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>

                {/* Signal Sky Blue Gradient */}
                <linearGradient id="signalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              {/* X-Axis (-40s to NOW) */}
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
              />

              {/* Left Y-Axis: SOC / SIGNAL % (0% to 100%) */}
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke="#06b6d4"
                tick={{ fill: '#67e8f9', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#0e7490' }}
                tickFormatter={(val) => `${val}%`}
                label={{
                  value: 'SOC / SIGNAL %',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#67e8f9',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  offset: 20
                }}
              />

              {/* Right Y-Axis: MOTOR TEMP (°C) (-10°C to 50°C) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[-10, 50]}
                stroke="#f59e0b"
                tick={{ fill: '#fcd34d', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#b45309' }}
                tickFormatter={(val) => `${val}°C`}
                label={{
                  value: 'MOTOR TEMP (°C)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#fcd34d',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  offset: 20
                }}
              />

              {/* Custom Tooltip */}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as RoverTelemetrySample;
                    return (
                      <div className="bg-[#070b13]/95 border border-cyan-500/60 p-2.5 rounded-lg shadow-xl font-mono text-xs backdrop-blur-md space-y-1.5">
                        <div className="text-cyan-300 font-bold border-b border-slate-800 pb-1 flex justify-between items-center gap-4">
                          <span>TIME OFFSET: {label}</span>
                          <span className="text-[10px] text-slate-400">PERSEVERANCE</span>
                        </div>
                        {showBattery && (
                          <div className="flex items-center justify-between text-cyan-300 space-x-3">
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              <span>BATTERY SOC:</span>
                            </span>
                            <span className="font-bold">{data.batterySoc.toFixed(1)}% ({data.batteryVoltage.toFixed(1)}V)</span>
                          </div>
                        )}
                        {showMotorTemp && (
                          <div className="flex items-center justify-between text-amber-300 space-x-3">
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>MOTOR TEMP:</span>
                            </span>
                            <span className="font-bold">{data.motorTemp.toFixed(1)}°C</span>
                          </div>
                        )}
                        {showSignal && (
                          <div className="flex items-center justify-between text-sky-300 space-x-3">
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              <span>SIGNAL (UHF):</span>
                            </span>
                            <span className="font-bold">{data.signalStrengthDbm.toFixed(1)} dBm ({data.signalQuality.toFixed(0)}%)</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Area 1: Battery SOC (%) */}
              {showBattery && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="batterySoc"
                  stroke="#06b6d4"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#batteryGrad)"
                  name="Battery SOC (%)"
                  isAnimationActive={false}
                />
              )}

              {/* Area 2: Motor Temp (°C) */}
              {showMotorTemp && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="motorTemp"
                  stroke="#f59e0b"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#motorTempGrad)"
                  name="Motor Temp (°C)"
                  isAnimationActive={false}
                />
              )}

              {/* Area 3: Signal Quality (%) */}
              {showSignal && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="signalQuality"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  fillOpacity={1}
                  fill="url(#signalGrad)"
                  name="Signal Quality (%)"
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Footer: Legend on bottom left, sample prompt on bottom right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80 font-mono text-[11px]">
          {/* Bottom Left Legend */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap gap-y-1">
            <button
              type="button"
              onClick={() => setShowBattery((prev) => !prev)}
              className={`flex items-center space-x-1.5 cursor-pointer transition-opacity ${
                showBattery ? 'opacity-100 text-cyan-300' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              <span className="font-semibold">Battery SOC (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMotorTemp((prev) => !prev)}
              className={`flex items-center space-x-1.5 cursor-pointer transition-opacity ${
                showMotorTemp ? 'opacity-100 text-amber-300' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="font-semibold">Motor Temp (°C)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSignal((prev) => !prev)}
              className={`flex items-center space-x-1.5 cursor-pointer transition-opacity ${
                showSignal ? 'opacity-100 text-sky-300' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#0ea5e9]" />
              <span className="font-semibold">Signal Quality (%)</span>
            </button>
          </div>

          {/* Bottom Right Prompt */}
          <div className="text-slate-400 text-[10px] sm:text-[11px] italic shrink-0">
            Hover cursor across chart to inspect time-series samples
          </div>
        </div>
      </div>
    </div>
  );
};
