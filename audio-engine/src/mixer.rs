use crate::nodes::{GainNode, SynthNode};
use crate::graph::AudioNode;
use crate::midi::{MidiClip, MidiEvent};

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
    pub midi_clips: Vec<PlacedMidiClip>, // MIDI Clips with placement
    pub synth: Option<SynthNode>,  // Optional Synth
    pub gain_node: GainNode,
    pub pan: f32, // -1.0 to 1.0
    pub muted: bool,
    pub soloed: bool,
    pub sample_rate: f32,
}

impl Track {
    pub fn new(id: u32, sample_rate: f32) -> Self {
        Self {
            id,
            clips: Vec::new(),
            midi_clips: Vec::new(),
            synth: None,
            gain_node: GainNode::new(1.0),
            pan: 0.0,
            muted: false,
            soloed: false,
            sample_rate,
        }
    }
    
    pub fn enable_synth(&mut self) {
        if self.synth.is_none() {
            self.synth = Some(SynthNode::new(self.sample_rate, 8)); // 8 Voice Polyphony
        }
    }

    // Process a block of audio for this track
    pub fn process(&mut self, output: &mut [&mut [f32]], current_time: u64, asset_cache: &std::collections::HashMap<String, (Vec<f32>, Vec<f32>)>) {
        if self.muted {
             for channel in output.iter_mut() {
                 channel.fill(0.0);
             }
             return;
        }

        let samples = output[0].len();
        
        // Clear output first as we generate/mix
        for channel in output.iter_mut() {
            channel.fill(0.0);
        }

        // 1. Generate Signal
        if let Some(synth) = &mut self.synth {
            // MIDI / Synth Path
            let block_start = current_time;
            let block_end = current_time + samples as u64;
            
            for clip in &self.midi_clips {
                let clip_start_abs = clip.start_time;
                let clip_end_abs = clip.start_time + clip.inner.duration;
                
                if clip_end_abs <= block_start || clip_start_abs >= block_end {
                    continue;
                }
                
                for event in &clip.inner.events {
                    let event_abs_time = clip.start_time + event.timestamp;
                    if event_abs_time >= block_start && event_abs_time < block_end {
                        synth.event_queue.push(*event);
                    }
                }
            }
             synth.process(&[], output);
             
        } else {
            // Audio Path
            for clip in &self.clips {
                let clip_start = clip.start_time;
                let clip_end = clip.start_time + clip.duration;

                // Check intersection
                if clip_start < current_time + samples as u64 && clip_end > current_time {
                    if let Some((l_source, r_source)) = asset_cache.get(&clip.asset_id) {
                        for i in 0..samples {
                            let absolute_sample = current_time + i as u64;
                            if absolute_sample >= clip_start && absolute_sample < clip_end {
                                let offset_in_clip = absolute_sample - clip_start;
                                let source_index = (clip.offset + offset_in_clip) as usize;
                                
                                if source_index < l_source.len() {
                                    output[0][i] += l_source[source_index];
                                }
                                if source_index < r_source.len() {
                                    output[1][i] += r_source[source_index];
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // 2. Apply Gain
        self.gain_node.process(&[], output);
        
        // 3. Apply Pan
        let pan_clamped = self.pan.clamp(-1.0, 1.0);
        let angle = (pan_clamped + 1.0) * std::f32::consts::PI / 4.0;
        let gain_l = angle.cos();
        let gain_r = angle.sin();
        
        for i in 0..samples {
             output[0][i] *= gain_l;
             output[1][i] *= gain_r;
        }
    }
}

#[derive(Clone)]
pub struct PlacedMidiClip {
    pub start_time: u64,
    pub inner: MidiClip,
}

use std::collections::HashMap;

pub struct Mixer {
    pub tracks: Vec<Track>,
    pub master_gain: GainNode,
    pub sample_rate: f32,
    pub current_time: u64,
    pub is_playing: bool,
    pub samples: HashMap<String, (Vec<f32>, Vec<f32>)>, // Asset ID -> (L, R)
}

impl Mixer {

    pub fn new(sample_rate: f32) -> Self {
        Self {
            tracks: Vec::new(),
            master_gain: GainNode::new(1.0),
            sample_rate,
            current_time: 0,
            is_playing: false,
            samples: HashMap::new(),
        }
    }
    
    pub fn add_sample(&mut self, id: String, left: Vec<f32>, right: Vec<f32>) {
        self.samples.insert(id, (left, right));
    }

    pub fn set_playing(&mut self, playing: bool) {
        self.is_playing = playing;
    }
    
    pub fn seek(&mut self, time_samples: u64) {
        self.current_time = time_samples;
        for track in &mut self.tracks {
             if let Some(synth) = &mut track.synth {
                 // synth.all_notes_off(); 
             }
        }
    }
    
    pub fn add_track(&mut self) -> u32 {
        let id = self.tracks.len() as u32;
        self.tracks.push(Track::new(id, self.sample_rate));
        id
    }

    /// Process mixer into stereo output
    pub fn process(&mut self, output: &mut [&mut [f32]]) {
        // Zero out master output
        for channel in output.iter_mut() {
            channel.fill(0.0);
        }

        if !self.is_playing {
            return;
        }

        let samples = output[0].len();
        
        // --- TEST SINE WAVE (440Hz) ---
        // Verify audio path is working
        
        static mut PHASE: f32 = 0.0;
        let phase_inc = 2.0 * std::f32::consts::PI * 440.0 / self.sample_rate;
        unsafe {
            for i in 0..samples {
                let val = PHASE.sin() * 0.05; // Audible but safe
                output[0][i] += val;
                output[1][i] += val;
                PHASE += phase_inc;
            }
        }
        
        
        // Temporary buffer for track processing
        let mut track_buf_l = vec![0.0; samples];
        let mut track_buf_r = vec![0.0; samples];

        for track in &mut self.tracks {
            track_buf_l.fill(0.0);
            track_buf_r.fill(0.0);
            
            let mut track_io = vec![&mut track_buf_l[..], &mut track_buf_r[..]];
            
            // Process track with current time and asset cache
            track.process(&mut track_io, self.current_time, &self.samples);
            
            // Sum into master
            for i in 0..samples {
                output[0][i] += track_buf_l[i]; // Left
                output[1][i] += track_buf_r[i]; // Right
            }
        }
        
        // Update Time
        self.current_time += samples as u64;
        
        // Apply Master Gain
        self.master_gain.process(&[], output);
    }
}

use shared::{Project, ClipData};

impl Mixer {
     pub fn load_project(&mut self, project: &Project, sample_rate: f32) {
        self.tracks.clear();
        
        for track_data in &project.tracks {
            let mut track = Track::new(track_data.id, sample_rate);
            track.gain_node.set_gain(shared::db_to_linear(track_data.gain_db));
            track.pan = track_data.pan;
            track.muted = track_data.muted;
            track.soloed = track_data.soloed;
            
            // Hydrate Clips
            for clip_data in &track_data.clips {
                match clip_data {
                    ClipData::Audio { start, duration, offset, asset_id, .. } => {
                       track.clips.push(Clip {
                           start_time: *start,
                           duration: *duration,
                           offset: *offset,
                           asset_id: asset_id.clone(),
                       });
                    },
                    ClipData::Midi { start, duration, notes, .. } => {
                        track.enable_synth();
                        
                        let mut midi_clip = MidiClip::new("Midi Clip", *duration);
                        
                        for note in notes {
                            // Convert samples to u64
                            midi_clip.add_note(0, note.note, note.velocity, note.start, note.duration);
                        }
                        
                        track.midi_clips.push(PlacedMidiClip {
                            start_time: *start,
                            inner: midi_clip,
                        });
                    }
                }
            }
            
            self.tracks.push(track);
        }
    }
}
