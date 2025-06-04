// ───────────────────────────────────────────────────────────
//       CIDR → IP list (all client-side, no dependencies)
// ───────────────────────────────────────────────────────────
(() => {
  const $in     = document.getElementById('input');
  const $out    = document.getElementById('output');
  const $error  = document.getElementById('error');
  const BTN_MAX = 65_536;          // safety cap – raise/lower if desired

  // main click handler
  document.getElementById('convert').addEventListener('click', () => {
    $error.textContent = '';
    $out.value = '';

    const cidrs = $in.value
      .split(/\r?\n/)     // LF or CRLF
      .map(l => l.trim())
      .filter(Boolean);   // remove empty lines

    try {
      const ips = [];
      cidrs.forEach(c => ips.push(...expandCIDR(c)));
      $out.value = ips.join('\n');
    } catch (e) {
      $error.textContent = e.message;
    }
  });

  // ─────────────── CIDR expansion ───────────────
  function expandCIDR(cidr) {
    // rudimentary validation
    const m = cidr.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d|[12]\d|3[0-2])$/);
    if (!m) throw new Error(`Invalid CIDR: “${cidr}”`);

    const base   = m[1];
    const prefix = Number(m[2]);

    const start = ipToInt(base) & maskFromPrefix(prefix);
    const end   = start | (~maskFromPrefix(prefix) >>> 0);
    const size  = end - start + 1;

    if (size > BTN_MAX) {
      throw new Error(`CIDR ${cidr} expands to ${size.toLocaleString()} IPs. Max allowed: ${BTN_MAX}.`);
    }

    const res = [];
    for (let n = start; n <= end; n++) res.push(intToIp(n));
    return res;
  }

  // ─────────────── utilities ───────────────
  function ipToInt(ip) {
    return ip.split('.').reduce((acc, oct) => (acc << 8) + +oct, 0) >>> 0;
  }

  function intToIp(int) {
    return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
  }

  // pre-generate 33 subnet masks (0-32)
  const masks = Array.from({length: 33}, (_, p) =>
    p === 0 ? 0 : ((0xffffffff << (32 - p)) >>> 0)
  );
  const maskFromPrefix = p => masks[p];
})();
