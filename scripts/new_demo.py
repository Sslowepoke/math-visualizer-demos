#!/usr/bin/env python3
"""Scaffold a new Three.js demo and register it in the monorepo."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "templates" / "demo"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def title_from_slug(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.split("-"))


def replace_placeholders(text: str, mapping: dict[str, str]) -> str:
    for key, value in mapping.items():
        text = text.replace(key, value)
    return text


def copy_template(dest: Path, mapping: dict[str, str]) -> None:
    for src in TEMPLATE.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(TEMPLATE)
        out = dest / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        contents = src.read_text(encoding="utf-8")
        out.write_text(replace_placeholders(contents, mapping), encoding="utf-8")


def update_package_json(slug: str) -> None:
    path = ROOT / "package.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    workspaces: list[str] = data.setdefault("workspaces", [])
    if slug not in workspaces:
        workspaces.append(slug)
    scripts: dict[str, str] = data.setdefault("scripts", {})
    scripts[f"dev:{slug}"] = f"npm run dev -w {slug}"
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def update_demos_json(slug: str, title: str, description: str) -> None:
    path = ROOT / "demos.json"
    demos = json.loads(path.read_text(encoding="utf-8"))
    if any(demo.get("slug") == slug for demo in demos):
        raise SystemExit(f"Demo '{slug}' is already listed in demos.json")
    demos.append({"slug": slug, "title": title, "description": description})
    path.write_text(
        json.dumps(demos, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def update_readme(slug: str, title: str) -> None:
    path = ROOT / "README.md"
    text = path.read_text(encoding="utf-8")
    row = f"| [{title}]({slug}/) | `npm run dev:{slug}` |"
    marker = "\n## Local development"
    if row in text:
        return
    if marker not in text:
        return
    text = text.replace(marker, row + "\n" + marker, 1)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a new demo from the shared Three.js template.",
    )
    parser.add_argument(
        "slug",
        help="Folder name, e.g. magnetic-dipole",
    )
    parser.add_argument(
        "--title",
        help="Display title. Defaults to a title-cased slug.",
    )
    parser.add_argument(
        "--description",
        default="Interactive 3D visualization.",
        help="Landing-page description.",
    )
    args = parser.parse_args()

    slug = args.slug.strip()
    if not SLUG_RE.fullmatch(slug):
        raise SystemExit(
            "Slug must be lowercase kebab-case, e.g. magnetic-dipole",
        )

    dest = ROOT / slug
    if dest.exists():
        raise SystemExit(f"Folder already exists: {dest}")
    if not TEMPLATE.is_dir():
        raise SystemExit(f"Missing template: {TEMPLATE}")

    title = args.title.strip() if args.title else title_from_slug(slug)
    mapping = {
        "__SLUG__": slug,
        "__TITLE__": title,
    }

    copy_template(dest, mapping)
    update_package_json(slug)
    update_demos_json(slug, title, args.description)
    update_readme(slug, title)

    print(f"Created {slug}/")
    print("Next:")
    print("  npm install")
    print(f"  npm run dev:{slug}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
