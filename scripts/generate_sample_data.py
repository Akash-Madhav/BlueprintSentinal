"""
Generates synthetic floor plan and electrical single-line diagram demo images
for mock plans in data/samples/.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = BASE_DIR / "data" / "samples"


def create_sample_floor_plan():
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    img_path = SAMPLES_DIR / "demo_floor_plan_office.png"

    w, h = 1000, 700
    img = Image.new("RGB", (w, h), color=(250, 252, 255))
    draw = ImageDraw.Draw(img)

    # Outer wall boundary (Blueprint Navy)
    wall_color = (20, 35, 60)
    draw.rectangle([50, 50, 950, 650], outline=wall_color, width=6)

    # Internal rooms
    # Room 1: Office Suite (Upper Left)
    draw.rectangle([50, 50, 400, 350], outline=wall_color, width=4)
    draw.text((70, 70), "ROOM 101 - EXECUTIVE SUITE", fill=(10, 20, 40))

    # Room 2: Server Room (Critical asset, Upper Right)
    draw.rectangle([600, 50, 950, 350], outline=wall_color, width=4)
    draw.text((620, 70), "ROOM 102 - PRIMARY DATA CENTER (CRITICAL)", fill=(180, 20, 20))

    # Room 3: Hallway / Central Corridor (Middle)
    draw.rectangle([400, 50, 600, 650], outline=wall_color, width=2)
    draw.text((420, 200), "CENTRAL CORRIDOR", fill=(60, 80, 100))

    # Room 4: Conference Hall (Bottom Left)
    draw.rectangle([50, 350, 400, 650], outline=wall_color, width=4)
    draw.text((70, 380), "ROOM 103 - AUDITORIUM (OCCUPANCY: 120)", fill=(10, 20, 40))

    # Doors
    door_color = (0, 120, 215)
    draw.line([400, 180, 400, 240], fill=door_color, width=5)  # Door 101
    draw.line([600, 180, 600, 240], fill=door_color, width=5)  # Door 102
    draw.line([400, 480, 400, 540], fill=door_color, width=5)  # Door 103

    # Exits
    exit_color = (0, 180, 80)
    draw.rectangle([580, 640, 620, 660], fill=exit_color)  # South Exit
    draw.text((480, 620), "[MAIN FIRE EXIT]", fill=exit_color)

    img.save(img_path)
    print(f"Generated sample floor plan at: {img_path}")


def create_sample_electrical_diagram():
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    img_path = SAMPLES_DIR / "demo_electrical_diagram.png"

    w, h = 1000, 700
    img = Image.new("RGB", (w, h), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Title
    draw.text((50, 30), "SINGLE-LINE POWER DISTRIBUTION SCHEMATIC - FACILITY A", fill=(10, 20, 40))

    # Utility Grid Feed
    draw.rectangle([80, 120, 280, 200], outline=(0, 70, 160), width=3, fill=(240, 245, 255))
    draw.text((95, 140), "UTILITY GRID FEED (13.8kV)\nPRIMARY SOURCE", fill=(0, 70, 160))

    # Backup Diesel Generator
    draw.rectangle([80, 450, 280, 530], outline=(180, 80, 0), width=3, fill=(255, 248, 240))
    draw.text((95, 470), "DIESEL GEN (500kVA)\nEMERGENCY BACKUP", fill=(180, 80, 0))

    # Main Distribution Panel MDP-01 (Shared Panel)
    draw.rectangle([420, 260, 620, 390], outline=(200, 0, 0), width=4, fill=(255, 240, 240))
    draw.text((435, 280), "SHARED PANEL MDP-01\nRATED: 400A | LOAD: 380A\n(NO ATS ISOLATION)", fill=(200, 0, 0))

    # Critical Data Center Server Load
    draw.rectangle([760, 260, 940, 360], outline=(150, 0, 150), width=3, fill=(250, 240, 255))
    draw.text((775, 290), "PRIMARY DATA CENTER\nCRITICAL LOAD (45kW)", fill=(150, 0, 150))

    # Wiring connections
    draw.line([280, 160, 420, 300], fill=(0, 0, 0), width=3)  # Primary to MDP
    draw.line([280, 490, 420, 350], fill=(0, 0, 0), width=3)  # Backup to MDP (Cross violation!)
    draw.line([620, 320, 760, 320], fill=(0, 0, 0), width=3)  # MDP to Server

    img.save(img_path)
    print(f"Generated sample electrical schematic at: {img_path}")


if __name__ == "__main__":
    create_sample_floor_plan()
    create_sample_electrical_diagram()
