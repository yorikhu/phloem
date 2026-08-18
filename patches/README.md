# Patches

This directory tracks modifications made to the RAGFlow fork (`vendor/ragflow/`).

## Structure

```
patches/
├── README.md                  # This file
└── ragflow-v0.26.x/           # Patches for RAGFlow v0.26.x
    ├── 001-fix-xxx.patch      # Numbered patches
    └── 002-add-yyy.patch
```

## When to Patch

| Scenario                               | Where to Change                            | Patch Needed? |
| -------------------------------------- | ------------------------------------------ | ------------- |
| API field mapping                      | `packages/gateway/src/adapters/ragflow.ts` | No            |
| RAGFlow config/params                  | `vendor/ragflow/` (direct commit to fork)  | No            |
| RAGFlow bug fix                        | `vendor/ragflow/` (commit + PR upstream)   | Yes (export)  |
| Deep logic change (parsing, retrieval) | `vendor/ragflow/` (commit to fork)         | Yes (export)  |

## Exporting Patches

```bash
cd vendor/ragflow
UPSTREAM=v0.26.4
OUTPUT_DIR=../../patches/ragflow-v0.26.x

git format-patch $UPSTREAM..HEAD -o $OUTPUT_DIR
```

## Applying Patches (fresh checkout)

```bash
cd vendor/ragflow
for patch in ../../patches/ragflow-v0.26.x/*.patch; do
  git apply "$patch"
done
```
