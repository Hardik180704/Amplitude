use crate::graph::AudioNode;
use crate::synth::allocator::VoiceAllocator;
use crate::synth::voice::SynthVoice;
use crate::midi::{MidiEvent, MidiEventType};

pub struct SynthNode {
    allocator: VoiceAllocator,
    voices: Vec<SynthVoice>,
    sample_rate: f32,
    
    // Internal event queue (could come from graph inputs later)
    pub event_queue: Vec<MidiEvent>,
}

impl SynthNode {
    pub fn new(sample_rate: f32, max_voices: usize) -> Self {
        let mut voices = Vec::with_capacity(max_voices);
        for _ in 0..max_voices {
            voices.push(SynthVoice::new(sample_rate));
        }
        
        Self {
            allocator: VoiceAllocator::new(max_voices),
            voices,
            sample_rate,
            event_queue: Vec::new(),
        }
    }
    
    // Handle incoming MIDI events
    pub fn handle_event(&mut self, event: MidiEvent) {
        match event.event_type {
            MidiEventType::NoteOn => {
               // Ignore channel for now (OMNI)
               let idx = self.allocator.note_on(event.note, event.velocity);
               if idx < self.voices.len() {
                   self.voices[idx].note_on(event.note, event.velocity);
               }
            },
            MidiEventType::NoteOff => {
                if let Some(idx) = self.allocator.note_off(event.note) {
                    if idx < self.voices.len() {
                        self.voices[idx].note_off();
                    }
                }
            },
            _ => {} // Ignore CC/PitchBend for Commit 4
        }
    }
}

impl AudioNode for SynthNode {
    fn process(&mut self, _inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        // Process internal queue first
        // In a real engine, we'd process events sample-accurately within the loop
        // For Commit 4, we process all at block start (slight jitter)
        for event in self.event_queue.drain(..) {
            self.handle_event(event);
        }
        
        self.allocator.tick(); // Advance age

        let out_l = &mut outputs[0];
        let out_r = &mut outputs[1];
        
        // Clear outputs
        out_l.fill(0.0);
        out_r.fill(0.0);

        // Mix voices
        for (i, voice) in self.voices.iter_mut().enumerate() {
            if voice.active {
                for s in 0..out_l.len() {
                    let sample = voice.process();
                    
                    // Simple Mono Mix to Stereo
                    // TODO: Pan per voice or spread
                    out_l[s] += sample * 0.5; // -6dB to prevent clipping
                    out_r[s] += sample * 0.5;
                }
                
                // Cleanup voice if finished
                if !voice.active {
                    self.allocator.voice_finished(i);
                }
            }
        }
        
        // Check if any voice is active to keep node alive
        // Return true always for now as it's a generator waiting for MIDI
        true
    }
}
