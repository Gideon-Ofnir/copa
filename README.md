# 🦊 桌面伴侣 (Desktop Companion)

> 一个角色包就是一个桌面伴侣。拖入PNG贴图 + 写一段人设 = 你的角色在桌面上活过来。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ 三种模式

| 模式 | 说明 | 预览 |
|------|------|------|
| 🦊 **透明底桌宠** | 角色浮在壁纸上，融入桌面。戳一下说句话，按住拖动。 | 先做这个 |
| 📖 **场景陪伴** | 角色在书桌前陪你。左边是TA，右边是对话框。 | 待开发 |
| 🏰 **大场景群聊** | 风暴城堡大厅。多个角色各就其位，触发对话才弹气泡。 | 待开发 |

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/yourname/desktop-companion.git
cd desktop-companion

# 2. 安装依赖
npm install

# 3. 启动
npm start
```

## 🎨 创建你的角色包

在 `characters/` 下新建文件夹，放入：

```
my-character/
├── config.json              ← 角色设定
├── idle.png                 ← 待机贴图（场景陪伴用）
├── talking.png              ← 说话时（可选）
├── happy.png                ← 开心时（可选）
├── scene-bg.png             ← 场景背景（可选）
└── transparent/
    └── idle.png             ← 透明底桌宠贴图
```

`config.json` 最小配置：

```json
{
  "name": "我的角色",
  "id": "my-character",
  "model": "deepseek-chat",
  "api_url": "https://api.deepseek.com/v1/chat/completions",
  "system_prompt": "你是我的桌面伴侣。"
}
```

拖入 `transparent/idle.png`，启动——你的角色就蹲在桌面上了。

## 🛠 技术栈

- **Electron** — 桌面窗口（透明无边框、系统托盘）
- **HTML/CSS/JS** — 渲染界面
- **LLM API** — 兼容 OpenAI 接口格式（DeepSeek / 智谱 / OpenAI / 本地模型）

## 📋 路线图

- [x] Electron骨架 + 透明底桌宠
- [ ] 场景陪伴模式
- [ ] 大场景群聊模式
- [ ] 角色包热加载
- [ ] 设置面板（API Key、角色选择）
- [ ] 锁屏小组件（Windows Widget）

## 📄 许可

MIT

---

*Made with ❤️ by 法瑞斯 & 风暴城堡*
