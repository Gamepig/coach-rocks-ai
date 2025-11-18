// Debug script to check token hashing
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to hex string
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const token = "MjJ5gVh2eLqve8gy055uaRVle4-KoBYBlGerJrSbdnc";
hashToken(token).then(hash => {
  console.log("Token:", token);
  console.log("Hash:", hash);
});