const logos = {
  'codeforces.com': '/cf-96.png',
  'codechef.com': '/cc-100.png',
  'leetcode.com': '/lc-96.png',
};

export default function PlatformLogo({ platform }) {
  const src = logos[platform] || '/logos/default.png';
  return <img src={src} alt={platform} className="h-6 w-auto mr-2" />;
}
