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
    // For now, this just processes the generic "graph" or built-in chain
    pub fn process(&mut self, output: &mut [&mut [f32]]) {
        if self.muted {
            for channel in output.iter_mut() {
                channel.fill(0.0);
            }
            return;
        }

        // 1. Generate Source Signal (from Clips) - TODO
        // For now, assume silence or pass-through if we had inputs
        
        // 2. Apply Gain
        use crate::graph::AudioNode;
        // Mock input of all ones for testing flow if connected, but here we just process inplace?
        // GainNode expecting inputs.
        // Complex graph routing needed here. 
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
