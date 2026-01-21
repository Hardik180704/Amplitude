# Browser DAW Architecture

## 1. High-Level Architecture

The system is a hybrid Rust/TypeScript application.

```mermaid
graph TD
    subgraph Browser
        UI[React UI (Main Thread)]
        Worker[Web Worker (Heavy Lifting)]
        Audio[AudioWorklet (Real-time Audio)]
        
        UI -- Commands --> Audio
        UI -- Commands --> Worker
        Audio -- Analysis Data --> UI
        Worker -- Waveform Data --> UI
    end
    
    subgraph Server
        API[Rust Backend (Axum)]
        DB[(PostgreSQL)]
        S3[Object Storage]
        
        UI -- REST/WS --> API
        API --> DB
        API --> S3
    end
```

## 2. Thread Model

### A. Main Thread (UI)
- **Responsibility**: Rendering UI, handling user input, managing WebSocket connections, scheduling high-level events.
- **Constraints**: Must not block. Heavy computation (like waveform generation) offloaded to Workers.

### B. Audio Thread (AudioWorklet)
- **Responsibility**: DSP signal processing, mixing, scheduling sample-accurate events.
- **Constraints**:
    - **REAL-TIME CRITICAL**.
    - **NO** memory allocations (malloc/free) in the hot path.
    - **NO** locks (Mutex/RwLock) that could block.
    - **NO** garbage collection (handled by using Rust/WASM).

### C. Worker Threads
- **Responsibility**: Decoding audio files, calculating waveform peaks for visualization, simple offline rendering.

## 3. Data Flow & Memory Strategy

To communicate between the Main Thread (UI) and the Audio Thread (WASM) without blocking or garbage collection, we use a **Shared Memory** strategy.

### SharedArrayBuffer (SPSC Ring Buffer)
We implement a Lock-Free Single-Producer Single-Consumer (SPSC) Ring Buffer backed by a `SharedArrayBuffer`.

- **Control Messages (UI -> Audio)**: Parameter changes, Play/Stop commands.
    - The UI writes commands to the ring buffer.
    - The Audio thread reads commands at the start of each render quantum (128 samples).
- **Analysis Data (Audio -> UI)**: Metering levels, playhead position.
    - The Audio thread writes atomics or small structs to a shared state buffer.
    - The UI polls this via `requestAnimationFrame`.

## 4. Scalability & Constraints

- **Latency**: Target < 20ms roundtrip. Achieved by minimal buffering and WASM performance.
- **Voices**: Target 64+ concurrent synth voices. Achieved via SIMD optimizations in Rust.
- **Memory**: WASM memory is linear. We will pre-allocate standard buffers (pools) to avoid growing memory during playback.
