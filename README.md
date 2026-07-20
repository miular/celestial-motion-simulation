
 # 天体轨道运动模拟器

一个基于python语言的轻量级、直观的天体运动物理模拟项目。

---

##  如何开始

### 1. 运行模拟

打开项目核心脚本（ `celestical motion simulation.py`），通过修改配置来选择你想模拟的星系：

```python
# 修改第二个参数为 galaxy.json 中已有的星系名称
SYSTEM_CONFIG = load_system('galaxy.json', 'sun_earth_moon')
```

### 2. 自定义星系

你可以在 `galaxy.json` 中自行添加全新的天体配置。格式参考如下：


```json
{
  "sun_earth_moon": [
{"name": "Sun", "mass": 1.989e30, "position": [0.0, 0.0], "velocity": [0.0, 0.0], "color": "orange", "size": 150},
{"name": "Earth", "mass": 5.972e24, "position": [1.496e11, 0.0], "velocity": [0.0, 29800.0], "color": "blue", "size": 80},
{"name": "Moon", "mass": 7.349e22, "position": [1.499844e11, 0.0], "velocity": [0.0, 30822.0], "color": "grey", "size": 30}
]
}

```
- **注意** ：由于万有引力在小质量物体的作用不明显，所以尽可能设置合理质量与初速度。

##  开发计划

-   [x] 二维物理与轨道演算 (2D)
    
-   [ ] 三维空间物理模拟 (3D) _(看我水平提升到这么高再说hh)_
       

##  灵感来源

本项目的灵感来源于 Wallpaper Engine 上的动态壁纸作品：

-   **[三体实时演算 | Three-Body problem](https://steamcommunity.com/sharedfiles/filedetails/?id=3509243656)** —— _by SYKM_
    


```
