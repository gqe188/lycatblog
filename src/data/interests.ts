// 首页 / 关于页的「兴趣领域」卡片，随意修改文案即可
export const INTERESTS = [
  {
    key: 'acg',
    title: '二次元',
    en: 'ACG',
    icon: 'sparkle',
    color: 'var(--sakura)',
    text: '番剧、插画、看板猫。给日常加一点粉色滤镜。',
    href: '/about/',
  },
  {
    key: 'code',
    title: '编程 & AI',
    en: 'Code / AI',
    icon: 'cpu',
    color: 'var(--sky)',
    text: '写代码，也琢磨模型；把重复的事交给机器。',
    href: '/posts/',
  },
  {
    key: 'ctf',
    title: 'CTF & 逆向',
    en: 'CTF / Reverse',
    icon: 'flag',
    color: 'var(--term)',
    text: '主攻 Web 安全，Misc 与 Reverse 也常去串门。拆开看看才安心。',
    href: '/tags/ctf/',
  },
  {
    key: 'photo',
    title: '摄影',
    en: 'Photography',
    icon: 'camera',
    color: 'var(--sun)',
    text: '天空、水面、电线杆。按下快门，把晴天存档。',
    href: '/gallery/',
  },
] as const;
