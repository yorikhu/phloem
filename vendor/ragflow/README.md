# vendor/ragflow

> **状态：Submodule 占位目录**
>
> 首次部署无需此目录——`docker-compose.yml` 默认使用官方预构建镜像
> `infiniflow/ragflow:v0.26.4`，开箱即用。
>
> 当需要修改 RAGFlow 内部逻辑（解析策略 / 检索策略 / 多租户改造）时，
> 再将此处替换为 Fork + Submodule。

---

## 如何替换为 Submodule

### 1. Fork RAGFlow（获取自定义能力）

```bash
# 在 GitHub 上 fork https://github.com/infiniflow/ragflow
# 假设你的 Fork 地址为：
#   https://github.com/<YOUR_GITHUB>/ragflow
```

### 2. 添加为 Submodule

```bash
cd /path/to/Phloem/Phloem

# 替换 <YOUR_GITHUB> 为你的 GitHub 用户名
git submodule add \
  --name ragflow \
  https://github.com/<YOUR_GITHUB>/ragflow.git \
  vendor/ragflow
```

### 3. 验证 Submodule 初始化

```bash
git submodule update --init --recursive
ls vendor/ragflow/Dockerfile   # 应存在
```

### 4. 验证 Compose 使用源码构建（可选）

修改 `.env`：

```env
RAGFLOW_IMAGE=  # 留空，compose 会从 vendor/ragflow/Dockerfile 构建
```

然后：

```bash
docker compose build ragflow-server
docker compose up -d --wait
```

---

## 同步上游更新

```bash
cd vendor/ragflow
git fetch origin main
git merge origin/main
cd ../..
git add vendor/ragflow
git commit -m "chore: sync ragflow to $(git -C vendor/ragflow describe --tags)"
```

---

## 目录结构期望

```
vendor/ragflow/
├── Dockerfile          # RAGFlow 多阶段构建（必须）
├── docker/
│   ├── docker-compose.yml  # RAGFlow 官方 compose（参考）
│   ├── .env                  # RAGFlow 环境变量
│   └── entrypoint.sh         # 启动脚本
├── api/                # RAGFlow Python API
├── deepdoc/           # 文档解析引擎
├── conf/              # 配置文件
└── ...
```
