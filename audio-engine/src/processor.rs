use wasm_bindgen::prelude::*;
use crate::mixer::Mixer;
use shared::Project;
use js_sys::Float32Array;

// Placeholder for the extensive AudioWorkletProcessor trait
#[wasm_bindgen]
pub struct WasmAudioProcessor {
    mixer: Mixer,
    sample_rate: f32,
    l_buf: Vec<f32>,
    r_buf: Vec<f32>,
    interleaved: Vec<f32>,
}

#[wasm_bindgen]
impl WasmAudioProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // Initialize logging/panic hook
        web_sys::console::log_1(&"WasmAudioProcessor created (Explicit JS-Sync)".into());
        
        let sample_rate = 44100.0; // Default, should be passed in ideally
        
        Self {
            mixer: Mixer::new(sample_rate),
            sample_rate,
            l_buf: vec![0.0; 4096],
            r_buf: vec![0.0; 4096],
            interleaved: vec![0.0; 8192],
        }
    }

    pub fn process(&mut self, output: &Float32Array) -> bool {
        let len = output.length() as usize;
        let frames = len / 2;
        
        // Resize if host buffer size changed
        if self.l_buf.len() < frames {
            self.l_buf.resize(frames, 0.0);
            self.r_buf.resize(frames, 0.0);
            self.interleaved.resize(len, 0.0);
        }

        // Process in Rust
        {
            let mut rust_outputs = vec![&mut self.l_buf[..frames], &mut self.r_buf[..frames]];
            self.mixer.process(&mut rust_outputs);
        }
        
        // Interleave into our internal buffer
        for i in 0..frames {
            self.interleaved[i*2] = self.l_buf[i];
            self.interleaved[i*2+1] = self.r_buf[i];
        }
        
        // COPY TO JS!! This is the key to ensure the data reaches the frontend.
        output.copy_from(&self.interleaved[..len]);
        
        true
    }
    
    pub fn load_project(&mut self, json: &str) {
        match Project::from_json(json) {
            Ok(project) => {
                web_sys::console::log_1(&"Project Loaded into Engine".into());
                self.mixer.load_project(&project, self.sample_rate);
            },
            Err(e) => {
                web_sys::console::log_1(&format!("Failed to parse project: {:?}", e).into());
            }
        }
    }
    
    pub fn set_sample_rate(&mut self, rate: f32) {
        self.sample_rate = rate;
        // Re-init mixer? Or update it? Mixer needs sample rate for filters/synth.
        // For MVP, assume fixed or reload project.
    }
    
    pub fn add_sample(&mut self, asset_id: String, left_channel: &[f32], right_channel: &[f32]) {
        // Clone ID for logging because add_sample consumes it
        let id_log = asset_id.clone();
        self.mixer.add_sample(asset_id, left_channel.to_vec(), right_channel.to_vec());
        web_sys::console::log_1(&format!("Sample loaded: {}, {} frames", id_log, left_channel.len()).into());
    }
    
    pub fn seek_to_sample(&mut self, sample: u64) {
        self.mixer.seek(sample);
    }

    pub fn set_playing(&mut self, playing: bool) {
        self.mixer.set_playing(playing);
    }
}
