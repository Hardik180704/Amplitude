use crate::mixer::{Clip, Track};

pub struct Scheduler {
    pub sample_rate: f64,
    pub current_sample: u64,
}

impl Scheduler {
    pub fn new(sample_rate: f64) -> Self {
        Self {
            sample_rate,
            current_sample: 0,
        }
    }
    
    // Advance time by N samples
    pub fn tick(&mut self, samples: u64) {
        self.current_sample += samples;
    }
    
    // Check if a clip should be playing at the current time
    pub fn is_clip_active(&self, clip: &Clip, offset: u64) -> bool {
        let now = self.current_sample + offset;
        now >= clip.start_time && now < (clip.start_time + clip.duration)
    }
    
    // Get signal from track's clips
    // This function would be called by Track::process
    pub fn get_active_clips<'a>(&self, track: &'a Track) -> Vec<&'a Clip> {
        track.clips.iter()
            .filter(|c| self.is_clip_active(c, 0)) // Simply check start of block
            .collect()
    }
}
