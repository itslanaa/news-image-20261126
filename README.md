# News Image 20261126

[![News Image 20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/c/news-image-20261126)
[![Rank](https://make.fun/badge/news-image-20261126/itslanaa/news-image-20261126/rank.svg)](https://make.fun/c/news-image-20261126)
[![Reward](https://make.fun/badge/news-image-20261126/itslanaa/news-image-20261126/reward.svg)](https://make.fun/c/news-image-20261126)

Sum up the world's news of **Thursday 26 November 2026** in one image.

## What the image shows

A newspaper front page, **THE WORLD TODAY**, drawn entirely in code:

- **36 stories, 8 regions** — every story first reported on 26 November 2026 (UTC),
  checked against Reuters, AP, Observer Voice, Jagran Josh, C54, EUR Radio,
  SelfStudys, Devdiscourse and the Malta morning digest.
- **The 13 big stories** — each with its own small original drawn scene and a
  certainty badge (CONFIRMED / REPORTED). Leads include the Bank of Korea
  hiking rates to 3.25%, the Gaza strike, the Cairo tanker fire (31 dead),
  Norway's court voiding disputed oil licences, the EU special summit,
  India's Constitution Day and 26/11 anniversary, the last Ebola patient
  discharged in Kenya, and 20 hostages freed in Colombia.
- **23 more stories** in ALSO ON, each with its UTC time and source code.
- **A numbered world map** — pins 1–13 match the big stories — plus a
  stories-by-region bar.
- **A DATE CHECK box** listing what was deliberately left out: stories from
  25 November and earlier (Ras Tanura refinery attack, Hormuz tankers,
  Shenzhou-24 launch, the US tariff plan, the Fed Beige Book, and more).
- **A UTC timeline ticker** across the top of the page.

## How it runs

`main.ts` (Node 22, standard library only) renders the page with `draw.ts`
and writes one deterministic 1024x1024 PNG to `/output/entry.png`. No
network, no clock, no randomness — two runs write identical bytes.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `main.ts` — entrypoint: renders, validates (PNG, ≤1 MiB, 1024x1024), writes.
- `draw.ts` — the whole renderer: canvas, PNG encoder, 5x7 block font,
  drawn scenes, world map, and the 26 November 2026 story data.
- `LICENSE` — MIT.
