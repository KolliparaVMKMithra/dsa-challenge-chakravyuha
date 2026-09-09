import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import qrcode

brain_dir = r"C:\Users\DELL\.gemini\antigravity-ide\brain\77565f2f-eef2-4dc1-9fe9-7a4f725f6134"
base_cert_path = os.path.join(brain_dir, "sih_cert_full_logo_1788964952003.jpg")
output_cert_path = os.path.join(brain_dir, "sih_official_certificate_perfect.png")

cert = Image.open(base_cert_path).convert("RGBA")
W, H = cert.size  # (1200, 896)

# 1. Seamlessly clean the top logo area (y: 110 to 240, x: 130 to 1070)
# Sample pure clean parchment strip from y: 238 to 248, x: 130 to 1070
top_strip = cert.crop((130, 238, 1070, 248))
top_patch = top_strip.resize((940, 130), Image.Resampling.BICUBIC)
top_mask = Image.new("L", (940, 130), 255)
for i in range(12):
    alpha = int(255 * (i / 12))
    for x in range(940):
        top_mask.putpixel((x, i), alpha)
        top_mask.putpixel((x, 129 - i), alpha)
cert.paste(top_patch, (130, 110), top_mask)

# 2. Seamlessly clean the bottom logo & seal area (y: 660 to 830, x: 130 to 1070)
# Sample pure clean parchment strip from y: 645 to 658, x: 130 to 1070
bot_strip = cert.crop((130, 645, 1070, 658))
bot_patch = bot_strip.resize((940, 170), Image.Resampling.BICUBIC)
bot_mask = Image.new("L", (940, 170), 255)
for i in range(14):
    alpha = int(255 * (i / 14))
    for x in range(940):
        bot_mask.putpixel((x, i), alpha)
        bot_mask.putpixel((x, 169 - i), alpha)
cert.paste(bot_patch, (130, 660), bot_mask)

# Helper to make white transparent
def make_white_transparent(img, threshold=230):
    img = img.convert("RGBA")
    arr = np.array(img)
    mask = (arr[:, :, 0] > threshold) & (arr[:, :, 1] > threshold) & (arr[:, :, 2] > threshold)
    arr[mask, 3] = 0
    res = Image.fromarray(arr)
    bbox = res.split()[-1].getbbox()
    return res.crop(bbox) if bbox else res

# Load EXACT original logos (zero modifications)
amrita = Image.open("backend/sih_logos/amrita_logo.png").convert("RGBA")
amrita = amrita.crop(amrita.split()[-1].getbbox())

chakravyuha = Image.open("backend/sih_logos/chakravyuha_logo.png").convert("RGBA")
chakravyuha = chakravyuha.crop(chakravyuha.split()[-1].getbbox())

kc = make_white_transparent(Image.open("backend/sih_logos/kc_overseas_logo.png"))
moe = Image.open("backend/sih_logos/moe_logo.png").convert("RGBA")
moe = moe.crop(moe.split()[-1].getbbox())

sih = make_white_transparent(Image.open("backend/sih_logos/sih_bulb_logo.png"))
aicte = Image.open("backend/sih_logos/aicte_logo.png").convert("RGBA")
aicte = aicte.crop(aicte.split()[-1].getbbox())

# ── TOP ROW LOGOS (EXACT ORIGINAL LOGOS) ─────────────────────────────
target_y_center = 175

# 1. Amrita (Left)
amrita_h = 56
amrita_w = int(amrita.width * (amrita_h / amrita.height))
amrita_resized = amrita.resize((amrita_w, amrita_h), Image.Resampling.LANCZOS)
amrita_x = 145
amrita_y = target_y_center - amrita_h // 2
cert.paste(amrita_resized, (amrita_x, amrita_y), amrita_resized)

# 2. Chakravyuha (Center) - full logo with disc & text
ch_h = 74
ch_w = int(chakravyuha.width * (ch_h / chakravyuha.height))
ch_resized = chakravyuha.resize((ch_w, ch_h), Image.Resampling.LANCZOS)
ch_x = (W - ch_w) // 2
ch_y = target_y_center - ch_h // 2
cert.paste(ch_resized, (ch_x, ch_y), ch_resized)

# 3. KC Overseas Education (Right)
kc_h = 58
kc_w = int(kc.width * (kc_h / kc.height))
kc_resized = kc.resize((kc_w, kc_h), Image.Resampling.LANCZOS)
kc_x = W - 145 - kc_w
kc_y = target_y_center - kc_h // 2
cert.paste(kc_resized, (kc_x, kc_y), kc_resized)

# ── BOTTOM ROW LOGOS (EXACT GOVERNMENT & HACKATHON LOGOS) ────────────
bot_y_center = 745

# 1. Ministry of Education (Left)
moe_h = 68
moe_w = int(moe.width * (moe_h / moe.height))
moe_resized = moe.resize((moe_w, moe_h), Image.Resampling.LANCZOS)

# 2. SIH Lightbulb (Center-Left)
sih_h = 80
sih_w = int(sih.width * (sih_h / sih.height))
sih_resized = sih.resize((sih_w, sih_h), Image.Resampling.LANCZOS)

# 3. AICTE (Center-Right)
aicte_h = 74
aicte_w = int(aicte.width * (aicte_h / aicte.height))
aicte_resized = aicte.resize((aicte_w, aicte_h), Image.Resampling.LANCZOS)

# 4. QR Code (Right)
qr = qrcode.QRCode(box_size=3, border=1)
qr.add_data("https://chakravyuha.amrita.edu/verify/sih2026-sample")
qr.make(fit=True)
qr_bg = cert.getpixel((940, 745))[:3]
qr_img = qr.make_image(fill_color="black", back_color=qr_bg).convert("RGBA")
qr_size = 70
qr_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)

# Balanced horizontal spacing across [175 ... 1025]
items = [
    (moe_resized, moe_w, moe_h),
    (sih_resized, sih_w, sih_h),
    (aicte_resized, aicte_w, aicte_h),
    (qr_resized, qr_size, qr_size)
]

total_w = sum(w for _, w, _ in items)
left_bound = 180
right_bound = W - 180
avail_w = right_bound - left_bound
spacing = (avail_w - total_w) // (len(items) - 1)

cur_x = left_bound
for img_item, w, h in items:
    y_pos = bot_y_center - h // 2
    cert.paste(img_item, (cur_x, y_pos), img_item)
    cur_x += w + spacing

# Save final certificate
cert.convert("RGB").save(output_cert_path, "PNG", quality=100)
print(f"SUCCESS: Generated perfect certificate at {output_cert_path}")
