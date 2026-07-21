# 天体轨道运动模拟器

一个同时提供浏览器三维版本和 Python 二维版本的天体 N 体运动模拟项目。

## 网页三维版

三维版使用 React、TypeScript、Three.js 和 Web Worker：物理计算在后台线程中运行，Three.js 负责空间渲染、轨迹和相机交互。

```bash
npm install
npm run dev
```

打开终端显示的本地地址，默认通常是 <http://127.0.0.1:5173/>。

生产构建：

```bash
npm run build
npm run preview
```

## GitHub Pages 部署

项目已通过 GitHub Actions 配置自动部署。推送到 `main` 分支后，工作流会安装依赖、构建 `dist` 并发布到 GitHub Pages。

首次部署前，在仓库的 **Settings → Pages → Build and deployment** 中，将 **Source** 设置为 **GitHub Actions**。部署成功后访问：

<https://miular.github.io/celestial-motion-simulation/>

也可以在仓库的 **Actions → Deploy to GitHub Pages → Run workflow** 中手动触发部署。

可用功能：

- 三维万有引力与 Velocity Verlet 积分
- 播放、暂停、单步、重置和四档速度
- 鼠标或触控旋转视角、滚轮缩放
- 三维轨迹、天体标签和参考网格开关
- 点击天体查看质量、速度和三轴坐标
- 星系方案即时切换
- 桌面与移动端自适应布局
- 物理计算 Web Worker，不阻塞渲染线程

## 星系配置

所有方案都保存在 `galaxy.json`。三维配置使用三个坐标分量：

```json
{
  "name": "Aster",
  "mass": 5.972e24,
  "position": [1.496e11, 0.0, 0.0],
  "velocity": [0.0, 25100.0, 15900.0],
  "color": "#5FE0C1",
  "size": 78
}
```

旧的二维 `[x, y]` 坐标仍然兼容，加载时会自动转换为 `[x, y, 0]`。如果所有天体的 `z` 和 `vz` 都为零，运动仍会保持在同一个平面。

## 质量检查

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Python 二维版

原始版本保留在 `celestial_motion_simulation.py`，依赖 NumPy 和 Matplotlib。修改其中的星系名称即可选择 `galaxy.json` 中的方案。由于 Python 版本仍是二维实现，请选择使用二维坐标的旧方案。

## 灵感来源

- [三体实时演算 | Three-Body problem](https://steamcommunity.com/sharedfiles/filedetails/?id=3509243656) — SYKM
