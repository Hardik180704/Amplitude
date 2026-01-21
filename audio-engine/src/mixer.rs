use crate::nodes::{GainNode, SynthNode, CompressorNode, DelayNode, EqNode, FilterNode};
use crate::graph::AudioNode;
use crate::midi::{MidiClip, MidiEvent};
use shared::{Project, ClipData, Effect};

// Represents a piece of audio on the timeline
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum CrossfaderGroup {
    A,
    B,
    Thru, // Unaffected by crossfader
}

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
    pub effects: Vec<Box<dyn AudioNode + Send>>, // Effect Chain
    pub eq_node: EqNode, // Dedicated 3-Band EQ
    pub gain_node: GainNode,
    pub filter_node: FilterNode, // DJ Filter (One-knob)
    pub pan: f32, // -1.0 to 1.0
    pub muted: bool,
    pub soloed: bool,
    pub sample_rate: f32,
    
    // Metering State
    pub current_rms: f32,
    pub current_peak: f32,
    
    // DJ Features
    pub crossfader_group: CrossfaderGroup,
    pub playback_rate: f32, // 1.0 = normal
    pub scratch_velocity: f32, // Additive velocity
    pub playhead_cursor: f64, // Fractional sample position
    
    // Party FX
    pub fx_stutter: bool,
    pub fx_tape_stop: bool,
    pub fx_filter_sweep: bool,
    
    // Looping
    pub loop_enabled: bool,
    pub loop_start: f64, // Absolute sample position
    pub loop_end: f64,   // Absolute sample position
}

impl Track {
    pub fn new(id: u32, sample_rate: f32) -> Self {
        Self {
            id,
            clips: Vec::new(),
            midi_clips: Vec::new(),
            synth: None,
            effects: Vec::new(),
            eq_node: EqNode::new(sample_rate),
            gain_node: GainNode::new(1.0),
            filter_node: FilterNode::new(sample_rate),
            pan: 0.0,
            muted: false,
            soloed: false,
            sample_rate,
            current_rms: 0.0,
            current_peak: 0.0,
            crossfader_group: CrossfaderGroup::Thru,
            playback_rate: 1.0,
            scratch_velocity: 0.0,
            playhead_cursor: 0.0,
            fx_stutter: false,
            fx_tape_stop: false,
            fx_filter_sweep: false,
            loop_enabled: false,
            loop_start: 0.0,
            loop_end: 0.0,
        }
    }
    
    pub fn enable_synth(&mut self) {
        if self.synth.is_none() {
            self.synth = Some(SynthNode::new(self.sample_rate, 8)); // 8 Voice Polyphony
        }
    }

    // Process a block of audio for this track
    pub fn process(&mut self, output: &mut [&mut [f32]], scratch_l: &mut [f32], scratch_r: &mut [f32], current_time: u64, asset_cache: &std::collections::HashMap<String, (Vec<f32>, Vec<f32>)>) {
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
            // Audio Path with Resampling (Variable Speed)
            for clip in &self.clips {
                let clip_start = clip.start_time;
                let clip_end = clip.start_time + clip.duration;
                
                // Effective Rate
                let rate = self.playback_rate + self.scratch_velocity;
                
                // If rate is tiny, effectively paused (or very slow), still process to maintain buffer
                if rate.abs() < 0.001 {
                    continue;
                }

                if let Some((l_source, r_source)) = asset_cache.get(&clip.asset_id) {
                     // LOG ONCE logic...
                     static mut LOG_PLAY_ONCE: bool = false;
                     unsafe {
                         if !LOG_PLAY_ONCE {
                             web_sys::console::log_1(&"Mixer: Playing Clip (Variable Speed)".into());
                             LOG_PLAY_ONCE = true;
                         }
                     }

                    for i in 0..samples {
                        // 1. Calculate Dynamic Playback Rate (FX)
                        let mut current_rate = rate;
                        
                        // FX: Tape Stop (Decelerate smoothly)
                        if self.fx_tape_stop {
                            // Simple linear deceleration simulation
                            // If we tracked 'tape_speed' state it would be better, 
                            // but for stateless stutter, let's just use a fixed low rate or modulation
                            // Actually, let's just behave like a "Brake" - gradually slow down.
                            // Since process is stateless per block, we need state. 
                            // For MVP Party Mode: Instant slow playback (0.5x) or complete stop?
                            // Let's do a "Brake" effect: map playhead_cursor decimal part to slow down? 
                            // No, let's just target 0.0 velocity over time. Be simple: Rate = 0.0 effectively.
                            // But user wants "Vinyl Break". 
                            // Let's rely on scratch_velocity being manipulated by the UI or set rate to decreasing.
                            // For now: Hard Replace Rate to slowly dropping.
                            // SIMPLIFICATION: User holds button -> Rate drops.
                            // But we only get one property update.
                            // Let's assume frontend drives the ramp? No, latency.
                            // Let's just set rate to very slow constant for now, or 0? 
                            current_rate = 0.0; // Instant Stop for now
                        }

                        // 2. Advance Cursor
                        // FX: Stutter (Repeat last section)
                        // If stutter is on, we wrap the cursor within a small window centered on where we engaged it.
                        // We need 'stutter_start' state. 
                        // For MVP: Stutter = Loop 1/16th note.
                        // We will use the loop logic below.

                        // Normal Advance
                        self.playhead_cursor += current_rate as f64;
                        
                        // 3. Handle Looping
                        if self.loop_enabled && self.loop_end > self.loop_start {
                             if self.playhead_cursor >= self.loop_end {
                                 let loop_len = self.loop_end - self.loop_start;
                                 self.playhead_cursor = self.loop_start + (self.playhead_cursor - self.loop_end) % loop_len;
                             } else if self.playhead_cursor < self.loop_start {
                                 self.playhead_cursor = self.loop_start;
                             }
                        } else if self.fx_stutter {
                             // Auto-Stutter: Loop 1 beat (approx 44100 / 2) relative to current time?
                             // Without 'start time' snapshot, this is hard.
                             // Alternative: Quantize cursor to grid.
                             // playhead_cursor % (44100/4) -> Sawtooth wave.
                             // This works! "Gating"
                             let beat_len = 11025.0; // ~1/4 beat at 44.1k
                             let window = self.playhead_cursor / beat_len;
                             let start_of_beat = window.floor() * beat_len;
                             self.playhead_cursor = start_of_beat + (self.playhead_cursor % (beat_len * 0.5)); // Repeat first half of beat
                        }
                        
                        // Map internal cursor to global timeline for clip check?
                        // Actually, playhead_cursor IS the timeline position (conceptually).
                        
                        let current_pos = self.playhead_cursor;
                        
                        if current_pos >= clip_start as f64 && current_pos < clip_end as f64 {
                            let offset_in_clip = current_pos - clip_start as f64;
                            let source_idx_f = clip.offset as f64 + offset_in_clip;
                            
                            // Linear Interpolation
                            let idx = source_idx_f.floor() as usize;
                            let frac = (source_idx_f - idx as f64) as f32;
                            
                            if idx + 1 < l_source.len() {
                                let l = l_source[idx] * (1.0 - frac) + l_source[idx+1] * frac;
                                output[0][i] += l;
                            } else if idx < l_source.len() {
                                output[0][i] += l_source[idx];
                            }
                            
                            if idx + 1 < r_source.len() {
                                let r = r_source[idx] * (1.0 - frac) + r_source[idx+1] * frac;
                                output[1][i] += r;
                            } else if idx < r_source.len() {
                                output[1][i] += r_source[idx];
                            }
                        }
                    }
                }
            }
        }
        
        
        // 2. Effects Chain
        for effect in &mut self.effects {
             // 1. Copy Output to Scratch
             scratch_l.copy_from_slice(output[0]);
             scratch_r.copy_from_slice(output[1]);
             
             // 2. Process (Input=Scratch, Output=Output)
             // Safety: We use disjoint slices here effectively
             let inputs = vec![&scratch_l[..], &scratch_r[..]];
             effect.process(&inputs, output);
        }

        // 3. Apply Dedicated EQ
        self.eq_node.process(&[], output);
         
        // 4. Apply DJ Filter (Stereo In-Place)
        self.filter_node.process(&[], output);

        // 4. Apply Gain
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
        
        for i in 0..samples {
             output[0][i] *= gain_l;
             output[1][i] *= gain_r;
        }
        
        // 5. Apply Crossfader (handled by Mixer::process master sum, 
        // OR we apply gain here based on mixer's crossfader position passed in?
        // Actually, Track doesn't know Mixer's crossfader position. 
        // We should add crossfader_gain_val to process() args or handle in Mixer loop)
        
        // 6. Calculate Metering (RMS & Peak)
        let mut sum_sq = 0.0;
        let mut peak = 0.0;
        for i in 0..samples {
            let abs_l = output[0][i].abs();
            let abs_r = output[1][i].abs();
            let max_val = abs_l.max(abs_r);
            
            if max_val > peak { peak = max_val; }
            sum_sq += output[0][i] * output[0][i] + output[1][i] * output[1][i];
        }
        
        let rms = (sum_sq / (samples as f32 * 2.0)).sqrt();
        
        // Simple smoothing for metering visualization
        self.current_peak = peak; 
        self.current_rms = rms;
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
    
    // Scratch buffers for processing
    pub track_buf_l: Vec<f32>,
    pub track_buf_r: Vec<f32>,
    pub scratch_l: Vec<f32>,
    pub scratch_r: Vec<f32>,
    
    pub crossfader_position: f32, // -1.0 (A) to 1.0 (B)
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
            track_buf_l: vec![0.0; 8192],
            track_buf_r: vec![0.0; 8192],
            scratch_l: vec![0.0; 8192],
            scratch_r: vec![0.0; 8192],
            crossfader_position: 0.0,
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
             // Sync track cursor
             track.playhead_cursor = time_samples as f64;
        }
    }
    
    pub fn add_track(&mut self) -> u32 {
        let id = self.tracks.len() as u32;
        self.tracks.push(Track::new(id, self.sample_rate));
        id
    }
    
    pub fn set_track_gain(&mut self, track_id: u32, gain_db: f32) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.gain_node.set_gain(shared::db_to_linear(gain_db));
        }
    }

    pub fn set_track_pan(&mut self, track_id: u32, pan: f32) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.pan = pan;
        }
    }

pub fn set_track_playback_rate(&mut self, track_id: u32, rate: f32) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.playback_rate = rate;
            // Also need to handle pitch shift if we wanted Pitch Correction (Phase 11?), 
            // but for Vinyl Deck, pitch change is desired.
        }
    }
    
    pub fn set_track_scratch(&mut self, track_id: u32, velocity: f32) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.scratch_velocity = velocity;
        }
    }

    pub fn set_track_fx_stutter(&mut self, track_id: u32, enabled: bool) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.fx_stutter = enabled;
        }
    }

    pub fn set_track_fx_tape_stop(&mut self, track_id: u32, enabled: bool) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.fx_tape_stop = enabled;
        }
    }
    
    pub fn set_track_loop(&mut self, track_id: u32, enabled: bool, start: f64, end: f64) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.loop_enabled = enabled;
            track.loop_start = start;
            track.loop_end = end;
        }
    }

    pub fn start_loop_seconds(&mut self, track_id: u32, length_seconds: f32) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            if length_seconds <= 0.0 {
                track.loop_enabled = false;
            } else {
                track.loop_start = track.playhead_cursor;
                track.loop_end = track.playhead_cursor + (length_seconds as f64 * track.sample_rate as f64);
                track.loop_enabled = true;
            }
        }
    }

    pub fn set_track_filter(&mut self, track_id: u32, value: f32) {
        // Value is -1.0 (LPF) to 1.0 (HPF), 0.0 is neutral
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            use crate::nodes::filter::FilterType;
            
            if value.abs() < 0.05 {
                 // Neutral - effectively open
                 track.filter_node.set_params(20000.0, 0.0, FilterType::LowPass);
            } else if value < 0.0 {
                 // Low Pass (0 to -1 maps to 20kHz to 20Hz)
                 // Exponential mapping feels better
                 let normalized = value.abs(); // 0 to 1
                 let min_freq = 20.0f32;
                 let max_freq = 20000.0f32;
                 // cutoff = max * (min/max)^normalized
                 let cutoff = max_freq * (min_freq / max_freq).powf(normalized);
                 track.filter_node.set_params(cutoff, 0.5, FilterType::LowPass);
            } else {
                  // High Pass (0 to 1 maps to 20Hz to 20kHz)
                 let normalized = value;
                 let min_freq = 20.0f32;
                 let max_freq = 15000.0f32; // Don't go all the way to 20k for HPF
                 let cutoff = min_freq * (max_freq / min_freq).powf(normalized);
                 track.filter_node.set_params(cutoff, 0.5, FilterType::HighPass);
            }
        }
    }
    
    pub fn set_track_eq(&mut self, track_id: u32, low: f32, mid: f32, high: f32) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
             track.eq_node.set_gains(low, mid, high);
        }
    }



    pub fn set_crossfader_position(&mut self, position: f32) {
        self.crossfader_position = position.clamp(-1.0, 1.0);
    }
    
    pub fn set_track_crossfader_group(&mut self, track_id: u32, group_idx: i32) {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.crossfader_group = match group_idx {
                -1 => CrossfaderGroup::A,
                1 => CrossfaderGroup::B,
                _ => CrossfaderGroup::Thru,
            };
        }
    }

    pub fn update_track_effects(&mut self, track_id: u32, effects: Vec<Effect>) {
         if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.effects.clear();
            for effect_data in effects {
                 match effect_data {
                     Effect::Eq { low_gain, mid_gain, high_gain } => {
                         // Note: If user adds EQ via Effect Rack, it's an Extra EQ (Insert).
                         // The Console EQ is separate.
                         let mut node = EqNode::new(self.sample_rate);
                         node.set_gains(low_gain, mid_gain, high_gain);
                         track.effects.push(Box::new(node));
                     },
                     Effect::Compressor { threshold, ratio, attack, release, makeup_gain } => {
                          let mut node = CompressorNode::new(self.sample_rate);
                          node.set_params(threshold, ratio, attack, release, makeup_gain);
                          track.effects.push(Box::new(node));
                     },
                     Effect::Delay { time_ms, feedback, mix } => {
                          let max_delay = (time_ms * 2.0).max(2000.0);
                          let mut node = DelayNode::new(max_delay, self.sample_rate);
                          node.delay_ms = time_ms;
                          node.feedback = feedback;
                          node.mix = mix;
                          track.effects.push(Box::new(node));
                     },
                     Effect::Reverb { .. } => {
                          // No-op
                     }
                 }
            }
         }
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
        
        // Ensure buffers are large enough
        if self.track_buf_l.len() < samples {
             self.track_buf_l.resize(samples, 0.0);
             self.track_buf_r.resize(samples, 0.0);
             self.scratch_l.resize(samples, 0.0);
             self.scratch_r.resize(samples, 0.0);
        }

        for track in &mut self.tracks {
             // Use pre-allocated buffers
             let track_slice_l = &mut self.track_buf_l[..samples];
             let track_slice_r = &mut self.track_buf_r[..samples];
             
             // Clear track buffers is handled by track.process filling them with 0.0 if not cleared? 
             // Actually track.process clears first thing.
             
             // Create slice vector for track output
             // Note: We create this small vec every time, but it's just pointers. 
             // Ideally we passed &mut [&mut [f32]] directly but creating the vec on stack is fine.
             let mut track_io = vec![track_slice_l, track_slice_r];
             
             // Scratch slices
             let scratch_slice_l = &mut self.scratch_l[..samples];
             let scratch_slice_r = &mut self.scratch_r[..samples];
             
             // Process track with current time and asset cache
             track.process(&mut track_io, scratch_slice_l, scratch_slice_r, self.current_time, &self.samples);
             
             // Sum into master with Crossfader Gain
             
             // Calculate Crossfader Gain for this track
             let xf_gain = match track.crossfader_group {
                 CrossfaderGroup::Thru => 1.0,
                 CrossfaderGroup::A => {
                     // If pos > 0, fade out. If pos <= 0, full vol.
                     if self.crossfader_position > 0.0 {
                         // Constant power or linear? Linear is simpler for now.
                         // 0.0 -> 1.0, 0.5 -> 0.5, 1.0 -> 0.0
                         (1.0 - self.crossfader_position).max(0.0)
                     } else {
                         1.0
                     }
                 },
                 CrossfaderGroup::B => {
                     // If pos < 0, fade out. If pos >= 0, full vol.
                     if self.crossfader_position < 0.0 {
                         (1.0 + self.crossfader_position).max(0.0)
                     } else {
                         1.0
                     }
                 }
             };
             
             for i in 0..samples {
                 output[0][i] += track_io[0][i] * xf_gain;
                 output[1][i] += track_io[1][i] * xf_gain;
             }
        }
        
        // Update Time
        self.current_time += samples as u64;
        
        // Apply Master Gain
        self.master_gain.process(&[], output);
        
        // Master Soft Clipper (Limiter)
        // Prevents harsh digital clipping by rounding off peaks > 1.0
        for channel in output.iter_mut() {
            for sample in channel.iter_mut() {
                *sample = sample.tanh(); 
            }
        }
    }
    
    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        // Ideally we would update all tracks/effects here too, but complex.
        // For now, this ensures new tracks are correct.
    }
}



impl Mixer {
     pub fn load_project(&mut self, project: &Project, sample_rate: f32) {
        self.tracks.clear();
        
        for track_data in &project.tracks {
            let mut track = Track::new(track_data.id, sample_rate);
            track.gain_node.set_gain(shared::db_to_linear(track_data.gain_db));
            track.pan = track_data.pan;
            track.muted = track_data.muted;
            track.soloed = track_data.soloed;
            
            // Hydrate Effects
            track.effects.clear();
            for effect_data in &track_data.effects {
                 match effect_data {
                     Effect::Eq { low_gain, mid_gain, high_gain } => {
                         let mut node = EqNode::new(sample_rate);
                         node.set_gains(*low_gain, *mid_gain, *high_gain);
                         track.effects.push(Box::new(node));
                     },
                     Effect::Compressor { threshold, ratio, attack, release, makeup_gain } => {
                          let mut node = CompressorNode::new(sample_rate);
                          node.set_params(*threshold, *ratio, *attack, *release, *makeup_gain);
                          track.effects.push(Box::new(node));
                     },
                     Effect::Delay { time_ms, feedback, mix } => {
                          let max_delay = (*time_ms * 2.0).max(2000.0);
                          let mut node = DelayNode::new(max_delay, sample_rate);
                          node.delay_ms = *time_ms;
                          node.feedback = *feedback;
                          node.mix = *mix;
                          track.effects.push(Box::new(node));
                     },
                     Effect::Reverb { .. } => {
                          web_sys::console::log_1(&"Mixer: Reverb not implemented yet".into());
                     }
                 }
            }
            
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
