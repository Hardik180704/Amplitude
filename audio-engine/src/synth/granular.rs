use std::sync::Arc;
use crate::dsp::dynamics::EnvelopeFollower; // Reuse or use simple window

#[derive(Clone, Debug)]
pub struct Grain {
    pub active: bool,
    pub start_pos_in_buffer: f64,
    pub current_pos: f64,
    pub speed: f32,
    pub duration_samples: usize,
    pub age: usize,
    pub pan: f32,
    pub amp: f32,
}

impl Grain {
    pub fn new() -> Self {
        Self {
            active: false,
            start_pos_in_buffer: 0.0,
            current_pos: 0.0,
            speed: 1.0,
            duration_samples: 0,
            age: 0,
            pan: 0.0,
            amp: 1.0,
        }
    }
    
    // Process one sample
    // Returns (L, R) tuple
    pub fn process(&mut self, buffer: &[f32]) -> (f32, f32) {
        if !self.active { return (0.0, 0.0); }
        
        let idx = self.current_pos as usize;
        
        // Bounds check
        if idx >= buffer.len() || self.age >= self.duration_samples {
            self.active = false;
            return (0.0, 0.0);
        }
        
        // Linear Interpolation
        let idx_f = self.current_pos;
        let idx_i = idx_f.floor() as usize;
        let frac = (idx_f - idx_i as f64) as f32;
        
        let s0 = buffer.get(idx_i).unwrap_or(&0.0);
        let s1 = buffer.get(idx_i + 1).unwrap_or(&0.0);
        let raw = s0 * (1.0 - frac) + s1 * frac;
        
        // Windowing (Hanning)
        // 0.5 * (1 - cos(2*pi*n/N))
        let progress = self.age as f32 / self.duration_samples as f32;
        let window = 0.5 * (1.0 - (2.0 * std::f32::consts::PI * progress).cos());
        
        let signal = raw * window * self.amp;
        
        // Pan
        // -1 (L) to 1 (R)
        let pan_l = (1.0 - self.pan) * 0.5;
        let pan_r = (1.0 + self.pan) * 0.5;
        // Or constant power? keeping it simple linear for grains
        
        self.age += 1;
        self.current_pos += self.speed as f64;
        
        (signal * pan_l, signal * pan_r)
    }
}

pub struct GranularSynth {
    pub grains: Vec<Grain>,
    pub buffer: Arc<Vec<f32>>, // Mono buffer for now
    pub sample_rate: f32,
    
    // Params
    pub density: f32, // Grains per second
    pub size_ms: f32, // Grain size
    pub spray_ms: f32, // Random start offset
    pub playback_pos: f64, // Where we are scanning from
    
    // Scheduler state
    grain_spawn_accum: f32,
}

impl GranularSynth {
    pub fn new(sample_rate: f32, max_grains: usize) -> Self {
        let mut grains = Vec::with_capacity(max_grains);
        for _ in 0..max_grains {
            grains.push(Grain::new());
        }
        
        Self {
            grains,
            buffer: Arc::new(vec![0.0; 1024]), // Placeholder
            sample_rate,
            density: 10.0,
            size_ms: 50.0,
            spray_ms: 0.0,
            playback_pos: 0.0,
            grain_spawn_accum: 0.0,
        }
    }
    
    pub fn set_buffer(&mut self, buffer: Vec<f32>) {
        self.buffer = Arc::new(buffer);
    }
    
    pub fn process(&mut self) -> (f32, f32) {
        let mut out_l = 0.0;
        let mut out_r = 0.0;
        
        // Spawn Grains logic
        // density = 10 -> spawns every 1/10th second = samplerate/10 samples
        let samples_per_grain = self.sample_rate / self.density.max(0.1);
        self.grain_spawn_accum += 1.0;
        
        if self.grain_spawn_accum >= samples_per_grain {
            self.grain_spawn_accum -= samples_per_grain;
            self.spawn_grain();
        }
        
        // Process Grains
        let active_count = self.grains.iter().filter(|g| g.active).count();
        let gain_comp = if active_count > 0 { 1.0 / (active_count as f32).sqrt() } else { 1.0 };
        
        for grain in &mut self.grains {
            let (l, r) = grain.process(&self.buffer);
            out_l += l;
            out_r += r;
        }
        
        (out_l * gain_comp, out_r * gain_comp)
    }
    
    fn spawn_grain(&mut self) {
        // Find inactive grain
        if let Some(grain) = self.grains.iter_mut().find(|g| !g.active) {
            grain.active = true;
            grain.age = 0;
            
            // Randomness
            let rnd_pos = (rand::random::<f32>() * 2.0 - 1.0) * self.spray_ms * 0.001 * self.sample_rate;
            let start = self.playback_pos + rnd_pos as f64;
            
            // Limit to buffer
            let buf_len = self.buffer.len();
            grain.current_pos = start.clamp(0.0, (buf_len - 1) as f64);
            
            grain.duration_samples = ((self.size_ms * 0.001) * self.sample_rate) as usize;
            grain.speed = 1.0; // Pitch jitter could go here
            grain.pan = (rand::random::<f32>() * 2.0) - 1.0;
            grain.amp = 0.8;
        }
    }
}
