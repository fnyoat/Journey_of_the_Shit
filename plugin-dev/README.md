# Journey to the Shit - TypeScript Plugin Development

## 项目结构

```
plugin-dev/
├── src/
│   ├── plugins/           # 插件源代码
│   └── types/            # 类型声明
├── scripts/
│   └── build.js          # 构建脚本
├── dist/                 # 编译后的 JS (会自动复制到游戏)
├── .env                  # 游戏工程路径配置（可选）
├── .env.example          # 配置示例
├── tsconfig.json         # TypeScript 配置
└── package.json          # 项目信息
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 自动查找游戏工程（无需配置）

构建脚本会自动查找包含 `game.rpgproject` 文件的 RPG Maker 工程，从当前目录向上搜索最多5级。

**如果有多个工程或者想强制使用某个路径**，可以在 `.env` 文件中指定：

```env
GAME_PATH=../赤石之旅工程_alpha0.9
```

### 3. 编写插件

在 `src/plugins/` 目录下创建 TypeScript 文件，例如：

```typescript
const PLUGIN_NAME = 'fnyoat_MyPlugin';
const PLUGIN_PARAMS = PluginManager.parameters(PLUGIN_NAME);

(function() {
    'use strict';
    // 插件代码...
})();
```

### 4. 构建和部署

```bash
# 构建并自动复制到游戏 plugins 目录
npm run build

# 或启动监听模式（需要手动刷新）
npm run dev
```

## 脚本命令

- `npm run build` - 构建所有插件并部署到游戏
- `npm run dev` - 监听模式开发
- `npm run clean` - 清理构建目录

## 如何定位游戏工程

1. 优先看 `.env` 文件中的 `GAME_PATH`（如果存在且有效）
2. 否则自动向上查找包含 `game.rpgproject` 文件的目录
3. 找到后会输出使用的路径
4. 找不到会报错并退出

