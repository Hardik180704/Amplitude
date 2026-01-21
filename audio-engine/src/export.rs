use crate::mixer::Mixer;

pub struct AudioExporter;

impl AudioExporter {
    // Render the project to a Vec<f32> (interleaved stereo)
    // This is a blocking operation in WASM usually, or chunked
    pub fn render(mixer: &mut Mixer, duration_samples: u64) -> Vec<f32> {
        let mut result = Vec::with_capacity((duration_samples * 2) as usize);
        let block_size = 128;
        
        let mut output_buf_l = vec![0.0; block_size];
        let mut output_buf_r = vec![0.0; block_size];
        
        let mut rendered = 0;
        
        while rendered < duration_samples {
            // Setup output buffers
            let mut output = vec![&mut output_buf_l[..], &mut output_buf_r[..]];
            
            // Mixer process (advances internal state)
            mixer.process(&mut output);
            
            // Interleave
            for i in 0..block_size {
                if rendered + (i as u64) < duration_samples {
                    result.push(output_buf_l[i]);
                    result.push(output_buf_r[i]);
                }
            }
            
            rendered += block_size as u64;
        }
        
        result
    }
    
    // Helper to create WAV header (simplified)
    pub fn create_wav_header(sample_rate: u32, num_channels: u16, data_len: u32) -> Vec<u8> {
        let mut header = Vec::new();
        // RIFF
        header.extend_from_slice(b"RIFF");
        header.extend_from_slice(&(36 + data_len).to_le_bytes());
        header.extend_from_slice(b"WAVE");
        
        // fmt
        header.extend_from_slice(b"fmt ");
        header.extend_from_slice(&16u32.to_le_bytes()); // Subchunk1Size
        header.extend_from_slice(&1u16.to_le_bytes());  // AudioFormat (PCM)
        header.extend_from_slice(&num_channels.to_le_bytes());
        header.extend_from_slice(&sample_rate.to_le_bytes());
        
        let byte_rate = sample_rate * num_channels as u32 * 4; // 32-bit float
        let block_align = num_channels * 4;
        
        header.extend_from_slice(&byte_rate.to_le_bytes());
        header.extend_from_slice(&block_align.to_le_bytes());
        header.extend_from_slice(&32u16.to_le_bytes()); // BitsPerSample
        
        // data
        header.extend_from_slice(b"data");
        header.extend_from_slice(&data_len.to_le_bytes());
        
        header
    }
}
