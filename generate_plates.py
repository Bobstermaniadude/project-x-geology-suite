#!/usr/bin/env python3
"""
Tectonic Plate PNG Generator
Parses SVG vector paths for each tectonic plate and renders individual PNGs
at 2K, 4K, and 8K resolutions (equirectangular, transparent background).
Also generates a world map with plate boundaries overlay.
"""

import os
import re
import sys
import math
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

try:
    RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:
    RESAMPLE = Image.LANCZOS
import svg.path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SVG_PATH = os.path.join(BASE_DIR, 'Tectonic_plates_(2022).svg')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

NS = 'http://www.w3.org/2000/svg'
SVG_W, SVG_H = 1920, 975

EARTH_MAPS = {
    '2k': os.path.join(BASE_DIR, '2k_earth_daymap.jpg'),
    '4k': os.path.join(BASE_DIR, '8081_earthmap4k.jpg'),
    '8k': os.path.join(BASE_DIR, '8081_earthmap10k.jpg'),
}

RESOLUTIONS = {
    '2k': (2048, 1024),
    '4k': (4000, 2000),
    '8k': (10800, 5400),
}

PLATE_NAMES = {
    'Eurasian_Plate': 'eurasian',
    'North_American_Plate': 'north_american',
    'Pacific_Plate': 'pacific',
    'Caribbean_Plate': 'caribbean',
    'African_Plate': 'african',
    'Indian_Plate': 'indian',
    'Cocos_Plate': 'cocos',
    'Juan_de_Fuca_Plate': 'juan_de_fuca',
    'Philippine_Plate': 'philippine_sea',
    'Arabian_Plate': 'arabian',
    'South_American_Plate': 'south_american',
    'Australian_Plate': 'australian',
    'Nazca_Plate': 'nazca',
    'Somali_Plate': 'somali',
    'Scotia_Plate': 'scotia',
    'Antarctic_Plate': 'antarctic',
}

PLATE_FILL_COLORS = {
    'Eurasian_Plate': '#989c89',
    'North_American_Plate': '#fee391',
    'Pacific_Plate': '#6baed6',
    'Caribbean_Plate': '#84e3c8',
    'African_Plate': '#d4ceb0',
    'Indian_Plate': '#a8ddb5',
    'Cocos_Plate': '#9667e0',
    'Juan_de_Fuca_Plate': '#df65b0',
    'Philippine_Plate': '#f68080',
    'Arabian_Plate': '#9c7979',
    'South_American_Plate': '#ccd5ae',
    'Australian_Plate': '#9e9ac8',
    'Nazca_Plate': '#F5C0C0',
    'Somali_Plate': '#fdae6b',
    'Scotia_Plate': '#a99743',
    'Antarctic_Plate': '#7393a7',
}

BOUNDARY_TYPES = [
    'spreading_center',
    'subduction_zone',
    'sinistral_transform',
    'dextral_transform',
    'collision_zone',
    'extension_zone',
]

def hex_to_rgb(hex_color):
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def parse_css(css_text):
    rules = {}
    for m in re.finditer(r'\.([\w-]+)\s*\{([^}]+)\}', css_text):
        cls = m.group(1)
        props = {}
        for p in re.finditer(r'([\w-]+)\s*:\s*([^;]+)', m.group(2)):
            props[p.group(1).strip()] = p.group(2).strip()
        rules[cls] = props
    return rules

def parse_svg(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    style_elem = root.find(f'{{{NS}}}style')
    css_text = style_elem.text if style_elem is not None else ''
    css_rules = parse_css(css_text)

    def tag(name):
        return f'{{{NS}}}{name}'

    plate_paths = {}
    boundary_paths = {}

    for g in root.findall(f'.//{tag("g")}'):
        class_attr = g.get('class', '')
        if class_attr == 'plates':
            for path in g.findall(tag('path')):
                cls = path.get('class', '')
                d = path.get('d', '')
                if cls and d:
                    plate_paths.setdefault(cls, []).append(d)
        elif class_attr == 'boundaries':
            for path in g.findall(tag('path')):
                cls = path.get('class', '')
                d = path.get('d', '')
                if cls and d:
                    boundary_paths.setdefault(cls, []).append(d)

    return css_rules, plate_paths, boundary_paths

def path_to_polygon(path_d, num_samples_per_curve=50):
    """Convert an SVG path string to a list of (x, y) points."""
    try:
        parsed = svg.path.parse_path(path_d)
    except Exception:
        return []

    points = []
    for seg in parsed:
        # Determine how many sample points for this segment
        if isinstance(seg, svg.path.Line):
            n = 2
        elif isinstance(seg, svg.path.CubicBezier):
            n = num_samples_per_curve
        elif isinstance(seg, svg.path.QuadraticBezier):
            n = num_samples_per_curve // 2
        elif isinstance(seg, svg.path.Arc):
            n = num_samples_per_curve
        elif isinstance(seg, svg.path.Move):
            n = 1
        elif isinstance(seg, svg.path.Close):
            # Close segment: line back to start of current sub-path
            n = 2
        else:
            n = 2

        for i in range(n):
            t = i / (n - 1) if n > 1 else 0
            pt = seg.point(t)
            points.append((pt.real, pt.imag))

    return points

def render_plate_polygons(plate_d_paths, out_w, out_h, fill_color):
    """Render multiple SVG path strings into a single RGBA image with the given fill."""
    img = Image.new('RGBA', (out_w, out_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale_x = out_w / SVG_W
    scale_y = out_h / SVG_H

    for path_d in plate_d_paths:
        poly = path_to_polygon(path_d, num_samples_per_curve=60)
        if len(poly) < 3:
            continue
        # Scale from SVG coords to output coords
        scaled = [(x * scale_x, y * scale_y) for x, y in poly]
        draw.polygon(scaled, fill=fill_color)

    return img

def render_boundary_lines(boundary_paths, css_rules, out_w, out_h, stroke_scale=1.0):
    """Render boundary paths as lines."""
    img = Image.new('RGBA', (out_w, out_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale_x = out_w / SVG_W
    scale_y = out_h / SVG_H
    base_width = 3.0 * stroke_scale

    for cls, paths in boundary_paths.items():
        if cls not in css_rules:
            continue
        props = css_rules[cls]
        stroke_color = props.get('stroke', '#ffffff')
        sw = float(props.get('stroke-width', base_width)) * stroke_scale

        # Parse stroke color to RGBA
        try:
            sc = hex_to_rgb(stroke_color) + (255,)
        except Exception:
            sc = (255, 255, 255, 255)

        for path_d in paths:
            poly = path_to_polygon(path_d, num_samples_per_curve=30)
            if len(poly) < 2:
                continue
            scaled = [(x * scale_x, y * scale_y) for x, y in poly]

            # Draw line segments
            for i in range(len(scaled) - 1):
                draw.line([scaled[i], scaled[i+1]], fill=sc, width=max(1, int(sw)))

    return img

def generate_individual_plates(css_rules, plate_paths):
    """Generate individual PNG for each tectonic plate at all resolutions."""
    print("Generating individual tectonic plate PNGs...")
    for cls, d_paths in plate_paths.items():
        if cls not in PLATE_NAMES:
            print(f"  Skipping '{cls}' (not in PLATE_NAMES)")
            continue
        name = PLATE_NAMES[cls]
        fill_hex = PLATE_FILL_COLORS.get(cls, '#cccccc')
        fill_rgba = hex_to_rgb(fill_hex) + (255,)

        print(f"  Processing: {name} ({cls})  fill={fill_hex}")
        for res_key, (w, h) in RESOLUTIONS.items():
            out_dir = os.path.join(OUTPUT_DIR, res_key)
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f'{name}_plate.png')
            try:
                img = render_plate_polygons(d_paths, w, h, fill_rgba)
                img.save(out_path)
                print(f"    {res_key}: saved ({img.size})")
            except Exception as e:
                print(f"    {res_key}: ERROR - {e}")

def generate_world_map_overlay(css_rules, plate_paths, boundary_paths):
    """Generate world map images with plate boundaries overlaid."""
    print("\nGenerating world map with plate boundaries overlay...")

    for res_key, (w, h) in RESOLUTIONS.items():
        earth_path = EARTH_MAPS.get(res_key)
        if not earth_path or not os.path.exists(earth_path):
            print(f"  Skipping {res_key}: earth map not found: {earth_path}")
            continue

        out_dir = os.path.join(OUTPUT_DIR, res_key)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'world_map_with_boundaries.png')

        print(f"  Processing {res_key} ({w}x{h})...")
        try:
            earth = Image.open(earth_path).convert('RGBA')
            if earth.size != (w, h):
                earth = earth.resize((w, h), RESAMPLE)

            # Render plate outlines (add a thin outline around each plate)
            outline = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            outline_draw = ImageDraw.Draw(outline)
            scale_x = w / SVG_W
            scale_y = h / SVG_H
            for cls, d_paths in plate_paths.items():
                for path_d in d_paths:
                    poly = path_to_polygon(path_d, num_samples_per_curve=60)
                    if len(poly) < 3:
                        continue
                    scaled = [(x * scale_x, y * scale_y) for x, y in poly]
                    outline_draw.line(scaled + [scaled[0]], fill=(0, 0, 0, 180), width=max(2, w // 600))

            # Render boundary lines with colors
            bounds = render_boundary_lines(boundary_paths, css_rules, w, h, stroke_scale=w / SVG_W)

            # Composite: earth + outline + bounds
            composite = Image.alpha_composite(earth, outline)
            composite = Image.alpha_composite(composite, bounds)
            composite.save(out_path)
            print(f"    Saved: {out_path}")
        except Exception as e:
            print(f"    ERROR: {e}")

    # Stand-alone boundaries overlay
    print("\nGenerating stand-alone boundaries overlay (transparent)...")
    for res_key, (w, h) in RESOLUTIONS.items():
        out_dir = os.path.join(OUTPUT_DIR, res_key)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'boundaries_overlay.png')
        try:
            bounds = render_boundary_lines(boundary_paths, css_rules, w, h, stroke_scale=w / SVG_W)
            bounds.save(out_path)
            print(f"    Saved: {out_path}")
        except Exception as e:
            print(f"    ERROR: {e}")

def main():
    print("=" * 60)
    print("Tectonic Plate PNG Generator")
    print("=" * 60)

    if not os.path.exists(SVG_PATH):
        print(f"ERROR: SVG not found: {SVG_PATH}")
        sys.exit(1)

    print(f"\nParsing SVG: {SVG_PATH}")
    css_rules, plate_paths, boundary_paths = parse_svg(SVG_PATH)
    print(f"  Plates: {len(plate_paths)} classes")
    for cls, paths in sorted(plate_paths.items()):
        print(f"    {cls}: {len(paths)} path(s)")
    print(f"  Boundaries: {sum(len(v) for v in boundary_paths.values())} paths across {len(boundary_paths)} types")
    for cls, paths in sorted(boundary_paths.items()):
        if cls in BOUNDARY_TYPES:
            print(f"    {cls}: {len(paths)} path(s)")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    generate_individual_plates(css_rules, plate_paths)
    generate_world_map_overlay(css_rules, plate_paths, boundary_paths)

    print("\n" + "=" * 60)
    print("DONE! All plate PNGs generated in:")
    for res_key in RESOLUTIONS:
        print(f"  {os.path.join(OUTPUT_DIR, res_key)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
