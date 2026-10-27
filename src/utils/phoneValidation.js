/**
 * Utility for Indian 10-digit mobile number handling:
 * - Must be strictly 10 digits only
 * - Must start with 6, 7, 8, or 9
 */

export const handlePhoneInput = (input, callback) => {
  let val = input;
  // Support React synthetic event e
  if (input && input.target && typeof input.target.value !== 'undefined') {
    val = input.target.value;
  }
  if (val === undefined || val === null) {
    if (typeof callback === 'function') callback('');
    return '';
  }
  let str = String(val).trim();

  // Strip international +91 prefix if pasted
  if (str.startsWith('+91')) {
    str = str.slice(3).trim();
  } else if (str.startsWith('+')) {
    str = str.slice(1).trim();
  }

  // Remove any non-numeric characters
  let clean = str.replace(/\D/g, '');

  // If user pasted 91XXXXXXXXXX (12 digits) where remaining starts with 6-9, strip country code 91
  if (clean.length > 10 && clean.startsWith('91') && /^[6-9]/.test(clean.slice(2))) {
    clean = clean.slice(2);
  }

  // Strip leading 0 if followed by 6-9
  if (clean.startsWith('0') && /^[6-9]/.test(clean.replace(/^0+/, ''))) {
    clean = clean.replace(/^0+/, '');
  }

  // Reject completely if first digit is NOT 6, 7, 8, or 9
  if (clean.length > 0 && !/^[6-9]/.test(clean)) {
    clean = '';
  }

  // Strictly maximum 10 digits
  clean = clean.slice(0, 10);

  if (typeof callback === 'function') {
    callback(clean);
  }
  return clean;
};

export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  return /^[6-9]\d{9}$/.test(String(phone).trim());
};

export const isValidOptionalPhone = (phone) => {
  if (!phone || String(phone).trim() === '') return true;
  return /^[6-9]\d{9}$/.test(String(phone).trim());
};

export const PHONE_PLACEHOLDER = '10-digit mobile (starts with 6-9)';
export const PHONE_PATTERN = '[6-9][0-9]{9}';
export const PHONE_TITLE = 'Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9';
export const PHONE_ERROR_MSG = 'Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.';
