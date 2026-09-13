# content/qml — Quantum Machine Learning Content

This directory contains interactive tutorial content for the Qwearn QML module.

## Structure

Each tutorial is in its own directory:

```
content/qml/
├── 01-data-encoding/
│   ├── meta.json
│   ├── content.json
│   └── quiz.json
├── 02-vqc/
├── 03-quantum-kernel/
└── 04-hybrid-nn/
```

## Content Schema

`content.json` supports standard lesson blocks (headings, text, math, callouts, step_circuits) plus the `qml_comparison` block:

```json
{
  "type": "qml_comparison",
  "classicalModel": "Linear Classifier",
  "quantumModel": "Angle-Encoded Feature Map",
  "dataset": "linear",
  "precomputedResults": {
    "classical": {
      "accuracy": 0.88,
      "boundary": [[0.1, 0.2, ...], ...]
    },
    "quantum": {
      "accuracy": 0.94,
      "lossHistory": [0.45, 0.38, ...],
      "boundary": [[0.05, 0.06, ...], ...]
    }
  }
}
```
