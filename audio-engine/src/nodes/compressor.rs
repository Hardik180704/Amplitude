use crate::graph::AudioNode;
use crate::dsp::dynamics::EnvelopeFollower;
use crate::dsp::{linear_to_db, db_to_linear};

pub struct CompressorNode {
    follower: EnvelopeFollower,
    
    // Params
    pub threshold_db: f32,
    pub ratio: f32,
    pub attack_ms: f32,
    pub release_ms: f32,
    pub makeup_gain_db: f32,
    
    sample_rate: f32,
}

impl CompressorNode {
    pub fn new(sample_rate: f32) -> Self {
        let mut follower = EnvelopeFollower::new(sample_rate);
        follower.set_params(10.0, 100.0); // Default A/R
        
        Self {
            follower,
            threshold_db: -20.0,
            ratio: 4.0,
            attack_ms: 10.0,
            release_ms: 100.0,
            makeup_gain_db: 0.0,
            sample_rate,
        }
    }
    
    pub fn set_params(&mut self, threshold: f32, ratio: f32, attack: f32, release: f32, makeup: f32) {
        self.threshold_db = threshold;
        self.ratio = ratio;
        self.attack_ms = attack;
        self.release_ms = release;
        self.makeup_gain_db = makeup;
        
        self.follower.set_params(attack, release);
    }
}

impl AudioNode for CompressorNode {
    fn process(&mut self, inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        if inputs.is_empty() { return false; }
        
        // Stereo handling: Link channels or dual mono? 
        // Let's do linked stereo (max of L/R drives reduction)
        let in_l = inputs[0];
        let in_r = inputs.get(1).unwrap_or(&inputs[0]);
        
        let out_l = &mut outputs[0];
        let out_r = &mut outputs[1];
        
        let makeup_linear = db_to_linear(self.makeup_gain_db);
        
        for i in 0..out_l.len() {
            let abs_l = in_l[i].abs();
            let abs_r = in_r[i].abs();
            let max_input = abs_l.max(abs_r);
            
            // 1. Envelope Detection
            let env_linear = self.follower.process(max_input);
            let env_db = linear_to_db(env_linear + 1e-6); // Avoid log(0)
            
            // 2. Gain Calculation
            let mut gain_change_db = 0.0;
            if env_db > self.threshold_db {
                let overshoot = env_db - self.threshold_db;
                // Ratio 4:1 means output rises 1dB for every 4dB input
                // So reduction is 3dB for every 4dB input
                // reduction = overshoot * (1 - 1/ratio)
                gain_change_db = -overshoot * (1.0 - 1.0 / self.ratio);
            }
            
            let gain_linear = db_to_linear(gain_change_db) * makeup_linear;
            
            // 3. Apply Gain
            out_l[i] = in_l[i] * gain_linear;
            out_r[i] = in_r[i] * gain_linear;
        }
        
        true
    }
}
