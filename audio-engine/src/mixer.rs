use crate::nodes::GainNode;
use crate::graph::AudioNode;

// Represents a piece of audio on the timeline
#[derive(Clone)]
pub struct Clip {
    pub start_time: u64, // In samples
    pub duration: u64,   // In samples
    pub offset: u64,     // Start point within the source asset
    pub asset_id: String,
}

// Represents a single channel (Track)
pub struct Track {
    pub id: u32,
    pub clips: Vec<Clip>,
    pub gain_node: GainNode,
    pub pan: f32, // -1.0 to 1.0
    pub muted: bool,
    pub soloed: bool,
}

impl Track {
    pub fn new(id: u32) -> Self {
        Self {
            id,
            clips: Vec::new(),
            gain_node: GainNode::new(1.0),
            pan: 0.0,
            muted: false,
            soloed: false,
        }
    }

    // Process a block of audio for this track
    pub fn process(&mut self, output: &mut [&mut [f32]]) {
        if self.muted {
            for channel in output.iter_mut() {
                channel.fill(0.0);
            }
            return;
        }

        // 1. Generate Source Signal (Placeholder for now)
        // In real impl, we iterate self.clips, find ones overlapping current time, 
        // sum them into a mix buffer.
        
        // For testing, let's just create a test tone if we have clips? 
        // Or assume silence if no clips.
        // Let's carry over whatever is in output if we treat it as an insert, 
        // OR clear it if we treat it as a generator.
        
        // Let's assume Track generates sound, so we clear output first.
        // (Unless we have Input monitoring)
        // For now, simple pass through if data exists, else silence.
        
        // 2. Apply Gain
        self.gain_node.process(&[], output);
        
        // 3. Apply Pan (Stereo Constant Power)
        // Pan is -1.0 (Left) to 1.0 (Right)
        let pan_clamped = self.pan.clamp(-1.0, 1.0);
        
        // Constant power formula:
        // L = cos( (pan + 1) * PI / 4 )
        // R = sin( (pan + 1) * PI / 4 )
        
        let angle = (pan_clamped + 1.0) * std::f32::consts::PI / 4.0;
        let gain_l = angle.cos();
        let gain_r = angle.sin();
        
        let samples = output[0].len();
        
        // In-place panning is tricky because we need to read L to write R potentially
        // But since output is stereo, we can do it.
        // We assume input signal is mono? Or Stereo? 
        // If Stereo input, typical DAW balance control just attenuates.
        // If Mono input (common for tracks), we distribute to L/R.
        
        // Let's assume Stereo Balance for now since we haven't defined Mono tracks.
        for i in 0..samples {
             output[0][i] *= gain_l;
             output[1][i] *= gain_r;
        }
    }
}

pub struct Mixer {
    pub tracks: Vec<Track>,
    pub master_gain: GainNode,
}

impl Mixer {

    pub fn new() -> Self {
        Self {
            tracks: Vec::new(),
            master_gain: GainNode::new(1.0),
        }
    }
    
    pub fn add_track(&mut self) -> u32 {
        let id = self.tracks.len() as u32;
        self.tracks.push(Track::new(id));
        id
    }

    /// Process mixer into stereo output
    pub fn process(&mut self, output: &mut [&mut [f32]]) {
        // Zero out master output first
        for channel in output.iter_mut() {
            channel.fill(0.0);
        }

        let samples = output[0].len();
        
        // Temporary buffer for track processing
        // In real engine, we'd use a pool.
        let mut track_buf_l = vec![0.0; samples];
        let mut track_buf_r = vec![0.0; samples];

        for track in &mut self.tracks {
            // clear temp buffers
            track_buf_l.fill(0.0);
            track_buf_r.fill(0.0);
            
            let mut track_io = vec![&mut track_buf_l[..], &mut track_buf_r[..]];
            
            // Process track (generates audio into track_io)
            track.process(&mut track_io);
            
            // Sum into master
            for i in 0..samples {
                output[0][i] += track_buf_l[i]; // Left
                output[1][i] += track_buf_r[i]; // Right
            }
        }
        
        // Apply Master Gain
        self.master_gain.process(&[], output);
        
        // TODO: Hard Limiter here to prevent clipping
    }
}
