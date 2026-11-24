# lycat 的侧写

由 GPT-6.2 Sol 从空提交重新制作，分支为 `codex/gpt-6.2-sol-rebuild`。这是由 Python 生成的静态博客，页面由 Jinja2 渲染，Markdown 由 markdown-it-py 解析，Pygments 提供代码高亮，Pillow 生成摄影缩略图。

## 在 Windows 上预览

当前版本使用 Python 3.14 验证。进入本分支的工作树后执行以下命令。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe build.py
.\.venv\Scripts\python.exe -m http.server 4332 --bind 127.0.0.1 --directory dist
```

打开 [本机预览](http://127.0.0.1:4332/)。

构建脚本向上查找同级的 `lycatblog-content`，从中读取 Markdown、正文配图和摄影原片。内容仓库放在别处时，使用 `build.py --content <目录>`。更新内容后重新运行 `build.py`。构建产物位于 `dist/`，可在静态服务器根路径托管。

## 素材

界面使用小型 SVG 图标。相册和正文的图片均来自内容仓库，字体使用系统字体。
