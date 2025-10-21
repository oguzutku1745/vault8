use anchor_lang::prelude::error_code;
use std::str;

#[error_code]
pub enum MsgCodecError {
    InvalidLength,
    BodyTooShort,
    InvalidUtf8,
}

// Legacy string codec retained for compatibility with existing flows
pub const STRING_OFFSET: usize = 32;


pub fn encode_string(string: &str) -> Vec<u8> {
    let string_bytes = string.as_bytes();
    let mut msg = Vec::with_capacity(STRING_OFFSET + string_bytes.len());
    msg.extend(std::iter::repeat(0).take(28));
    msg.extend_from_slice(&(string_bytes.len() as u32).to_be_bytes());
    msg.extend_from_slice(string_bytes);
    msg
}



// Minimal compatibility encoder used by send/quote_send paths in the template.
// For our deposit flow we won’t use this, but keep it to avoid breaking existing tasks.
pub fn encode(s: &str) -> Vec<u8> {
    encode_string(s)
}
