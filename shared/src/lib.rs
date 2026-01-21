use std::sync::atomic::{AtomicU32, Ordering};

/// A lock-free Single-Producer Single-Consumer (SPSC) ring buffer
/// designed for use with SharedArrayBuffer between Main Thread (UI) and AudioWorklet.
/// 
/// Layout in Shared Memory:
/// [read_index (4 bytes)] [write_index (4 bytes)] [data_buffer (N bytes)]
pub struct SharedRingBuffer {
    data: *mut u8,
    full_capacity: u32,
    read_index: &'static AtomicU32,
    write_index: &'static AtomicU32,
}

// SAFETY: We are manually managing raw pointers which are shared between threads (WASM linear memory or SharedArrayBuffer).
// In a real WASM env, we treat the pointer as valid for the lifetime of the application.
unsafe impl Send for SharedRingBuffer {}
unsafe impl Sync for SharedRingBuffer {}

impl SharedRingBuffer {
    /// Creates a wrapper around a raw pointer to a shared memory region.
    /// The region must start with 2 u32s (read_idx, write_idx) followed by buffer data.
    /// `capacity` is the size of the data buffer in bytes.
    pub unsafe fn from_raw(ptr: *mut u8, capacity: u32) -> Self {
        let read_index = &*(ptr as *const AtomicU32);
        let write_index = &*((ptr as *mut u8).add(4) as *const AtomicU32);
        let data = ptr.add(8);

        Self {
            data,
            full_capacity: capacity,
            read_index,
            write_index,
        }
    }

    pub fn capacity(&self) -> u32 {
        self.full_capacity
    }

    pub fn write(&self, data: &[u8]) -> usize {
        let write_idx = self.write_index.load(Ordering::Acquire);
        let read_idx = self.read_index.load(Ordering::Acquire);

        let available = if write_idx >= read_idx {
            self.full_capacity - (write_idx - read_idx)
        } else {
            read_idx - write_idx
        };

        // Leave 1 byte to distinguish full vs empty
        if available <= 1 {
            return 0;
        }

        let to_write = std::cmp::min(available as usize - 1, data.len());
        
        let start = write_idx as usize;
        let end = (start + to_write) % self.full_capacity as usize;

        // Two part copy
        unsafe {
            if end >= start {
                std::ptr::copy_nonoverlapping(data.as_ptr(), self.data.add(start), to_write);
            } else {
                let first_part = self.full_capacity as usize - start;
                std::ptr::copy_nonoverlapping(data.as_ptr(), self.data.add(start), first_part);
                std::ptr::copy_nonoverlapping(data.as_ptr().add(first_part), self.data, to_write - first_part);
            }
        }

        let new_write_idx = (write_idx + to_write as u32) % self.full_capacity;
        self.write_index.store(new_write_idx, Ordering::Release);

        to_write
    }

    pub fn read(&self, buf: &mut [u8]) -> usize {
        let read_idx = self.read_index.load(Ordering::Acquire);
        let write_idx = self.write_index.load(Ordering::Acquire);

        if read_idx == write_idx {
            return 0;
        }

        let available = if write_idx > read_idx {
            write_idx - read_idx
        } else {
            self.full_capacity - (read_idx - write_idx)
        };

        let to_read = std::cmp::min(available as usize, buf.len());
        
        let start = read_idx as usize;
        let end = (start + to_read) % self.full_capacity as usize;

        unsafe {
            if end >= start {
                std::ptr::copy_nonoverlapping(self.data.add(start), buf.as_mut_ptr(), to_read);
            } else {
                let first_part = self.full_capacity as usize - start;
                std::ptr::copy_nonoverlapping(self.data.add(start), buf.as_mut_ptr(), first_part);
                std::ptr::copy_nonoverlapping(self.data, buf.as_mut_ptr().add(first_part), to_read - first_part);
            }
        }

        let new_read_idx = (read_idx + to_read as u32) % self.full_capacity;
        self.read_index.store(new_read_idx, Ordering::Release);

        to_read
    }
}
