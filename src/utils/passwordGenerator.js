/**
 * Utility functions for generating secure passwords and copying credentials
 */

export const resolveRolePrefix = (roleOrPrefix = 'doc') => {
  const lower = String(roleOrPrefix || '').toLowerCase().trim();
  if (lower.startsWith('doc')) return 'doc';
  if (lower.startsWith('pat')) return 'pat';
  if (lower.startsWith('lab')) return 'lab';
  if (lower.startsWith('adm')) return 'adm';
  return lower || 'doc';
};

export const generateStrongPassword = (roleOrPrefix = 'doc') => {
  const prefix = resolveRolePrefix(roleOrPrefix);
  const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const charsLower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$!%*';

  // Pick random characters ensuring variety
  const getRandom = (str) => str.charAt(Math.floor(Math.random() * str.length));

  const u1 = getRandom(charsUpper);
  const u2 = getRandom(charsUpper);
  const l1 = getRandom(charsLower);
  const d1 = getRandom(digits);
  const d2 = getRandom(digits);
  const d3 = getRandom(digits);
  const s1 = getRandom(symbols);
  const s2 = getRandom(symbols);

  // Generates pattern like: doc@849#Xm2, pat@392!Pn8, lab@571*Wk4
  return `${prefix}${s1}${d1}${d2}${d3}${s2}${u1}${l1}${d3 !== '7' ? '7' : '9'}`;
};

/**
 * Robust copy to clipboard with fallback
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // fallback below
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    return false;
  }
};

/**
 * Format credentials ready for sharing via WhatsApp, Email, or SMS
 */
export const formatCredentialsShare = ({
  name,
  role,
  email,
  password,
  hospitalName = 'LifeCare Hospital'
}) => {
  const portalUrl = window?.location?.origin
    ? `${window.location.origin}/login`
    : 'https://hospital.lifecare.internal/login';

  return `🏥 *${hospitalName} - Account Credentials*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hello ${name || 'User'},
Your authorized portal account has been provisioned.

👤 Role: ${role ? role.toUpperCase() : 'STAFF'}
📧 Login Email: ${email}
🔑 Password: ${password}
🌐 Login URL: ${portalUrl}

⚠️ Please change your password upon your first successful login.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
};
