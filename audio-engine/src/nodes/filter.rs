use crate::graph::AudioNode;
use std::f32::consts::PI;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum FilterType {
    LowPass,
    HighPass,
}

#[derive(Clone, Copy, Default)]
struct BiquadState {
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

pub struct FilterNode {
    pub filter_type: FilterType,
    pub cutoff: f32,
    pub resonance: f32,
    pub sample_rate: f32,
    
    // Stereo State
    state_l: BiquadState,
    state_r: BiquadState,
}

impl FilterNode {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            filter_type: FilterType::LowPass,
            cutoff: 20000.0,
            resonance: 0.0,
            sample_rate,
            state_l: BiquadState::default(),
            state_r: BiquadState::default(),
        }
    }

    pub fn set_params(&mut self, cutoff: f32, resonance: f32, filter_type: FilterType) {
        self.cutoff = cutoff;
        self.resonance = resonance;
        self.filter_type = filter_type;
    }
    
    fn process_biquad(state: &mut BiquadState, input: f32, b0: f32, b1: f32, b2: f32, a1: f32, a2: f32) -> f32 {
         let out = b0 * input + b1 * state.x1 + b2 * state.x2 - a1 * state.y1 - a2 * state.y2;
         
         // Shift
         state.x2 = state.x1;
         state.x1 = input;
         state.y2 = state.y1;
         state.y1 = out;
         
         // Denormal
         if state.y1.abs() < 1e-20 { state.y1 = 0.0; }
         if state.y2.abs() < 1e-20 { state.y2 = 0.0; }
         
         out
    }
}

impl AudioNode for FilterNode {
    fn process(&mut self, _inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        // In our Mixer track chain, "inputs" are usually empty because we write directly to outputs?
        // Wait, looking at mixer.rs calls: 
        // For effects: effect.process(&inputs, output); 
        // Inputs are scratch buffers in mixer.rs.
        
        // Calculate Coeffs once per block
        let cutoff_clamped = self.cutoff.clamp(20.0, self.sample_rate / 2.0 - 100.0);
        let omega = 2.0 * PI * cutoff_clamped / self.sample_rate;
        let alpha = omega.sin() / (2.0 * 0.707); 
        let cos_w = omega.cos();
        
        let (b0, b1, b2, a0, a1, a2) = match self.filter_type {
            FilterType::LowPass => {
                let norm = 1.0 + alpha;
                (
                    (1.0 - cos_w) / 2.0 / norm,
                    (1.0 - cos_w) / norm,
                    (1.0 - cos_w) / 2.0 / norm,
                    1.0,
                    -2.0 * cos_w / norm,
                    (1.0 - alpha) / norm
                )
            },
            FilterType::HighPass => {
                let norm = 1.0 + alpha;
                (
                    (1.0 + cos_w) / 2.0 / norm,
                    -(1.0 + cos_w) / norm,
                    (1.0 + cos_w) / 2.0 / norm,
                    1.0,
                    -2.0 * cos_w / norm,
                    (1.0 - alpha) / norm
                )
            }
        };

        // If inputs provided, read from them. If not, process in-place on outputs?
        // The trait signature allows both. 
        // If inputs is empty, we assume in-place on outputs (Track::process style).
        // But mixer.rs passes inputs for effects. 
        // Let's support: if inputs provided, read inputs write outputs. 
        // If inputs empty, read outputs write outputs (in-place).
        
        let in_place = _inputs.is_empty();
        
        // Left Channel
        if let Some(out_l) = outputs.get_mut(0) {
            let samples = out_l.len();
            for i in 0..samples {
                let sample = if in_place { out_l[i] } else { _inputs[0][i] };
                out_l[i] = Self::process_biquad(&mut self.state_l, sample, b0, b1, b2, a1, a2);
            }
        }
        
        // Right Channel
        if let Some(out_r) = outputs.get_mut(1) {
            let samples = out_r.len();
            for i in 0..samples {
                 let sample = if in_place { out_r[i] } else { _inputs[1][i] };
                 out_r[i] = Self::process_biquad(&mut self.state_r, sample, b0, b1, b2, a1, a2);
            }
        }
        
        true
    }
}
