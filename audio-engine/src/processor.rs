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
        self.mixer.set_sample_rate(rate);
        web_sys::console::log_1(&format!("WasmAudioProcessor: Sample Rate updated to {}", rate).into());
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
    
    pub fn set_track_gain(&mut self, track_id: u32, db: f32) {
        self.mixer.set_track_gain(track_id, db);
    }

    pub fn set_track_pan(&mut self, track_id: u32, pan: f32) {
        self.mixer.set_track_pan(track_id, pan);
    }
    
    pub fn set_track_eq(&mut self, track_id: u32, low: f32, mid: f32, high: f32) {
        self.mixer.set_track_eq(track_id, low, mid, high);
    }
    
    pub fn update_track_effects(&mut self, track_id: u32, effects_json: &str) {
         match serde_json::from_str::<Vec<shared::Effect>>(effects_json) {
            Ok(effects) => {
                self.mixer.update_track_effects(track_id, effects);
            },
            Err(e) => {
                 web_sys::console::log_1(&format!("Failed to parse effects JSON: {:?}", e).into());
            }
        }
    }

    pub fn set_track_filter(&mut self, track_id: u32, val: f32) {
        self.mixer.set_track_filter(track_id, val);
    }

    pub fn set_crossfader_position(&mut self, pos: f32) {
        self.mixer.set_crossfader_position(pos);
    }

    pub fn set_track_crossfader_group(&mut self, track_id: u32, group_idx: i32) {
        self.mixer.set_track_crossfader_group(track_id, group_idx);
    }

    pub fn set_track_playback_rate(&mut self, track_id: u32, rate: f32) {
        self.mixer.set_track_playback_rate(track_id, rate);
    }

    pub fn set_track_scratch(&mut self, track_id: u32, velocity: f32) {
        self.mixer.set_track_scratch(track_id, velocity);
    }
    
    pub fn set_track_fx_stutter(&mut self, track_id: u32, enabled: bool) {
        self.mixer.set_track_fx_stutter(track_id, enabled);
    }

    pub fn set_track_fx_tape_stop(&mut self, track_id: u32, enabled: bool) {
        self.mixer.set_track_fx_tape_stop(track_id, enabled);
    }

    pub fn set_track_loop(&mut self, track_id: u32, enabled: bool, start: f64, end: f64) {
        self.mixer.set_track_loop(track_id, enabled, start, end);
    }

    pub fn start_track_loop_seconds(&mut self, track_id: u32, length_seconds: f32) {
        self.mixer.start_loop_seconds(track_id, length_seconds);
    }

    pub fn trigger_sample(&mut self, asset_id: String) {
        web_sys::console::log_1(&format!("WASM: trigger_sample called for {}", asset_id).into());
        self.mixer.trigger_sample(asset_id);
    }

    /// Fills the output array with peak values for each track.
    /// Expected size: num_tracks
    /// Returns the number of tracks written.
    pub fn read_track_meters(&self, output: &mut [f32]) -> usize {
        let count = self.mixer.tracks.len().min(output.len());
        for i in 0..count {
            output[i] = self.mixer.tracks[i].current_peak;
        }
        count
    }
}
