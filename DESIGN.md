# WuFlow Design System

Notion-inspired white minimalism: warm neutrals, no saturated accent, whisper borders, barely-there shadows.

---

## 1. Color Tokens

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `bg-page` | `#ffffff` | Page / main canvas |
| `bg-secondary` | `#f7f6f3` | Sidebar, card inset areas, section alt |
| `bg-hover` | `#f1f0ed` | Hover state, pressed state, icon badges |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `rgba(0,0,0,0.87)` | Headings, body copy, labels |
| `text-secondary` | `#6b6b6b` | Descriptions, metadata, secondary labels |
| `text-muted` | `#a0a0a0` | Placeholders, disabled text, captions |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | `1px solid rgba(0,0,0,0.08)` | All cards, dividers, inputs, nav |
| `border-hover` | `1px solid rgba(0,0,0,0.15)` | Hover state on interactive cards |

> Never use hardcoded `#ebebeb`, `#e5e7eb`, `#f0f0f0`, `#E8E8E5`, `#E0E0DC` — always use the token above.

### Semantic (keep as-is, do not replace)
- Success: `#16a34a` / `#f0fdf4` / `#bbf7d0`
- Error: `#dc2626` / `#fef2f2` / `#fecaca`
- Warning: `#f59e0b` / `#fffbeb` / `#fbbf24`

### CTA / Interactive
| Token | Value | Usage |
|-------|-------|-------|
| `btn-primary-bg` | `#111111` | Primary buttons ("开始", "提交", "下一题") |
| `btn-primary-text` | `#ffffff` | Text on dark buttons |
| `btn-primary-disabled` | `rgba(0,0,0,0.08)` | Disabled button background |

No saturated blue in core UI. Black is the action color.

---

## 2. Typography

### Font Stack
```
'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif
```
Apply on every page root element. Do not use Noto-only stacks.

### Scale
| Role | Size | Weight | Letter Spacing |
|------|------|--------|----------------|
| Page heading | 26–30px | 600 | -0.5px |
| Section heading | 20–22px | 600 | normal |
| Card title | 15–17px | 600 | normal |
| Body | 14px | 400 | normal |
| Caption / meta | 12–13px | 400–500 | normal |
| Badge | 11–12px | 500–600 | 0.3px |

---

## 3. Elevation (Shadows)

| Level | Value | Usage |
|-------|-------|-------|
| Flat | none | Page background, text blocks |
| Card | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)` | All content cards (notes, stats, review) |
| Modal | `0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` | Modals, dropdowns, popups |

Shadow opacity never exceeds 0.08 per layer. Avoid single hard-coded shadows.

---

## 4. Border Radius

| Context | Value |
|---------|-------|
| Buttons, inputs, form elements | `6px` |
| Small cards, inline containers | `8px` |
| Content cards (notes, stats) | `10px` |
| Large cards, modals | `12px` |
| Badges, pills, tags | `9999px` |

Never use: `14px`, `16px` on cards (these are non-standard intermediate values).

---

## 5. Spacing

Base unit: 8px. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

---

## 6. Component Rules

### Cards
```
background: #ffffff
border: 1px solid rgba(0,0,0,0.08)
border-radius: 10px
box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)
```

### Primary Button
```
background: #111
color: #fff
border-radius: 6px
padding: 9–11px 20–24px
font-size: 13–14px
font-weight: 500
```

### Input / Textarea
```
border: 1px solid rgba(0,0,0,0.08)
border-radius: 6px
background: #ffffff
color: rgba(0,0,0,0.87)
placeholder color: #a0a0a0
focus: border-color rgba(0,0,0,0.25)
```

### Sidebar
```
background: #f7f6f3
border-right: 1px solid rgba(0,0,0,0.08)
```

### Badge / Tag
```
border-radius: 9999px
font-size: 11–12px
font-weight: 500–600
```
