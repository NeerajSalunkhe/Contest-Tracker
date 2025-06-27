export function cleanContestName(name) {
  const match = name.match(/^(.*?\b\d+\b)/i);
  return match ? match[1].trim().toLowerCase() : name.trim().toLowerCase();
}

export function getPlatformPlaylistId(platform) {
  const cleaned = platform.replace('.com', '').toLowerCase();

  const map = {
    leetcode: 'PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr',
    codeforces: 'PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB',
    codechef: 'PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr',
  };

  return map[cleaned];
}
