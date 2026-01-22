use crate::graph::AudioNode;
use crate::synth::allocator::VoiceAllocator;
use crate::synth::voice::SynthVoice;
use crate::midi::{MidiEvent, MidiEventType};
use crate::modulation::{ModulationMatrix, ModSource, ModTarget};

pub struct SynthNode {
    allocator: VoiceAllocator,
    voices: Vec<SynthVoice>,
    sample_rate: f32,
    
    // Matrix
    pub mod_matrix: ModulationMatrix,
    
    // Internal event queue (could come from graph inputs later)
    pub event_queue: Vec<MidiEvent>,
}

impl SynthNode {
    pub fn new(sample_rate: f32, max_voices: usize) -> Self {
        let mut voices = Vec::with_capacity(max_voices);
        for _ in 0..max_voices {
            voices.push(SynthVoice::new(sample_rate));
        }
        
        // Default Matrix: Envelope -> Cutoff
        let mut mod_matrix = ModulationMatrix::new();
        mod_matrix.add_connection(ModSource::Envelope(0), ModTarget::FilterCutoff, 0.5); // 50% modulation
        
        Self {
            allocator: VoiceAllocator::new(max_voices),
            voices,
            sample_rate,
            mod_matrix,
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
    fn handle_event(&mut self, event: MidiEvent) {
        self.handle_event(event);
    }

    fn process(&mut self, _inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        // Process internal queue first
        let events: Vec<_> = self.event_queue.drain(..).collect();
        for event in events {
            self.handle_event(event);
        }
        
        self.allocator.tick(); // Advance age

        let (left_slice, right_slice) = outputs.split_at_mut(1);
        let out_l = &mut left_slice[0];
        let out_r = &mut right_slice[0];
        
        // Clear outputs
        out_l.fill(0.0);
        out_r.fill(0.0);

        // Mix voices
        for (i, voice) in self.voices.iter_mut().enumerate() {
            if voice.active {
                for s in 0..out_l.len() {
                    let sample = voice.process(&self.mod_matrix);
                    
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
