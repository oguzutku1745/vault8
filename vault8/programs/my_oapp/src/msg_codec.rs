use anchor_lang::prelude::error_code;
use std::str;

// Counter-oriented codec with opcode + u64 payload, while retaining helpers for legacy string.
// Opcodes
pub const OPCODE_INCREMENT: u8 = 1; // payload: u64 by
pub const OPCODE_ACK: u8 = 2;       // payload: u64 new_count

#[error_code]
pub enum MsgCodecError {
    InvalidLength,
    BodyTooShort,
    InvalidUtf8,
}

pub fn encode_increment(by: u64) -> Vec<u8> {
    let mut v = vec![OPCODE_INCREMENT];
    v.extend_from_slice(&by.to_le_bytes());
    v
}

pub fn encode_ack(new_count: u64) -> Vec<u8> {
    let mut v = vec![OPCODE_ACK];
    v.extend_from_slice(&new_count.to_le_bytes());
    v
}

pub fn decode_counter(message: &[u8]) -> Result<(u8, u64), MsgCodecError> {
    if message.len() < 1 + 8 { return Err(MsgCodecError::InvalidLength); }
    let opcode = message[0];
    let mut arr = [0u8; 8];
    arr.copy_from_slice(&message[1..9]);
    let val = u64::from_le_bytes(arr);
    Ok((opcode, val))
}

// Legacy string codec retained for compatibility with existing flows
pub const LENGTH_OFFSET: usize = 0;
pub const STRING_OFFSET: usize = 32;

fn decode_string_len(buf: &[u8]) -> Result<usize, MsgCodecError> {
    if buf.len() < STRING_OFFSET { return Err(MsgCodecError::InvalidLength); }
    let mut string_len_bytes = [0u8; 32];
    string_len_bytes.copy_from_slice(&buf[LENGTH_OFFSET..LENGTH_OFFSET + 32]);
    Ok(u32::from_be_bytes(string_len_bytes[28..32].try_into().unwrap()) as usize)
}

pub fn encode_string(string: &str) -> Vec<u8> {
    let string_bytes = string.as_bytes();
    let mut msg = Vec::with_capacity(STRING_OFFSET + string_bytes.len());
    msg.extend(std::iter::repeat(0).take(28));
    msg.extend_from_slice(&(string_bytes.len() as u32).to_be_bytes());
    msg.extend_from_slice(string_bytes);
    msg
}

pub fn decode_string(message: &[u8]) -> Result<String, MsgCodecError> {
    let string_len = decode_string_len(message)?;
    let start = STRING_OFFSET;
    let end = start.checked_add(string_len).ok_or(MsgCodecError::InvalidLength)?;
    if end > message.len() { return Err(MsgCodecError::BodyTooShort); }
    let payload = &message[start..end];
    match str::from_utf8(payload) { Ok(s) => Ok(s.to_string()), Err(_) => Err(MsgCodecError::InvalidUtf8) }
}
