---
name: twinit-docs
description: Search and read Twinit platform documentation from twinit.dev using raw markdown source files. Use when you need information about Twinit APIs, services, concepts, installation, UI framework, or marketplace. Also reference the digitaltwin-factory GitHub repo for real-world implementation examples.
argument-hint: "<search terms or question>"
allowed-tools: WebFetch(https://twinit.dev/*), WebFetch(https://raw.githubusercontent.com/Invicara/digitaltwin-factory/*)
---

# Twinit Documentation & Examples

You have two authoritative sources for Twinit development context:

1. **twinit.dev** — official platform documentation (APIs, concepts, services, UI framework)
2. **digitaltwin-factory** — real-world open-source implementation examples (components, orchestrators, pageComponents, utilities)

---

## Source 1: twinit.dev Live Documentation

The documentation is organized as a three-tier system: manifest → section indexes → content bundles.

### Step 1: Fetch the manifest

```
WebFetch https://twinit.dev/assets/raw/manifest.md
```

The manifest lists all available sections with descriptions and links to version-specific indexes.

Available sections:
- Concepts - Platform concepts, services, architecture
- APIs - REST and JavaScript API reference
- IPA Core UI Framework - React UI framework
- Training - Developer training
- Marketplace - Application templates, code modules
- Self-Hosted Platform - Installation guides

Unless the user specifies a version, always use the first version listed for a section (it is the latest).

### Step 2: Fetch the section index

Based on the user's question, fetch the index for the most relevant section and version:

```
WebFetch https://twinit.dev/assets/raw/apis-v5.0.index.md
```

The index lists all content bundles for that section-version. Each bundle entry includes:
- A link to the bundle file with its size and file count
- A list of documents inside with their titles and H2-level headings

Scan the index to identify which bundles are relevant to the user's question. Use the document titles and headings to judge relevance.

### Step 3: Fetch the relevant bundle(s)

Fetch 1-3 bundles that are most relevant to the question:

```
WebFetch https://twinit.dev/assets/raw/apis-v5.0--rest--aisvc.md
```

Each bundle is a concatenated markdown file containing one or more documentation pages separated by `<!-- file: path -->` comments. The original frontmatter, headings, code examples, and tables are preserved.

Only fetch bundles that are relevant to the question. If you need content from multiple sections, fetch indexes and bundles from each.

### Step 4: Answer the question

Synthesize the content into a clear answer. Always cite the section and version you referenced. Include links to the corresponding twinit.dev pages when possible, using this URL pattern:

```
https://twinit.dev/docs/<section>/<path>
```

For versioned pages (not the latest version):
```
https://twinit.dev/docs/<section>/<version>/<path>
```

If the fetched bundles don't fully answer the question, go back to the index and fetch additional bundles. If needed, check other section indexes.

---

## Source 2: digitaltwin-factory Example Implementations

When the user needs real-world implementation examples, patterns, or reusable components, fetch directly from the digitaltwin-factory GitHub repo (Apache 2.0):

**Repo root:** https://github.com/Invicara/digitaltwin-factory

Key areas and their raw content paths:

| Area | What it contains | Fetch from |
|---|---|---|
| `pageComponents` | Viewer pageComponents — selecting model elements, camera views, theming | `https://raw.githubusercontent.com/Invicara/digitaltwin-factory/master/pageComponents/` |
| `components/FloatingDocViewer` | Floating document viewer component | `https://raw.githubusercontent.com/Invicara/digitaltwin-factory/master/components/FloatingDocViewer/` |
| `orchestrators/bimpkModelImport` | BIM .bimpk model import orchestrator | `https://raw.githubusercontent.com/Invicara/digitaltwin-factory/master/orchestrators/bimpkModelImport/` |
| `examples/twinit-auth-for-office` | OAuth2 auth from Office/M365 apps | `https://raw.githubusercontent.com/Invicara/digitaltwin-factory/master/examples/twinit-auth-for-office/` |
| `utilities` | Excel model reporting add-in and shared utilities | `https://raw.githubusercontent.com/Invicara/digitaltwin-factory/master/utilities/` |

When referencing this repo, always note it is Apache 2.0 licensed and can be used or modified freely.

---

## Answering the user's question

Search for: $ARGUMENTS
