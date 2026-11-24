#!/usr/bin/env python3
"""e153-p4-crop.py —— E153-P4 刀一（军令 2026-11-24「物理裁除本体图底部透明空气」）。

对象：Milo/Sophia 本体＋眨眼共 4 张 WebP（双尾图 942×460 底部本就零透明行，免裁）。
口径：
  · 原图底部「空气」并非严格 alpha=0，而是 alpha 1–59 的近透明杂像素（E65 黄键剔除遗留）
    ——裸 Image.getbbox()（alpha>0）量得全画布、裁不动；真值口径＝alpha 阈值 60 的 bbox
    （与 E153-P1 cx 轮廓、P2 flood-fill 抠图同口径）。
  · 本体/眨眼取并集底边（同一 bbox 同步裁切两图，保证两帧尺寸完全一致）。
  · 只裁底边、保留左右上：横向坐标系零漂移（E82 98px 体型锁／cx 居中公式／尾层 55% 锚全不动）。
  · Milo 眨眼原图 720×817（比本体矮 1px）且自身爪尖止于 528 行（比本体 550 矮 22 行，
    其下只剩 alpha≤18 杂点）——眨眼层是盖在本体上的整帧闭眼图，语义上「只换眼睛」：
    故眨眼帧自其可见底（528）起整段同步为本体像素，两帧爪尖像素完全一致。
  · 原图为有损 VP8 ⇒ 重编码 quality=95/method=6（对解码像素 PSNR≈47dB，零可见劣化）。
产物：覆盖写回 web/src/assets/；旧件备份 dev-artifacts/e153-p4-backup/（可重入：始终读备份原件）。
"""
import io
import os
import shutil
import sys

from PIL import Image
import numpy as np

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
ASSETS = os.path.join(REPO, 'web', 'src', 'assets')
BACKUP = os.path.join(REPO, 'dev-artifacts', 'e153-p4-backup')
THRESH = 60
PAIRS = [
    ('familiar_milo', 'familiar_milo_blink'),
    ('familiar_sophia', 'familiar_sophia_blink'),
]


def bottom_at_thresh(img):
    a = np.array(img.convert('RGBA'))[:, :, 3]
    rows = np.where((a > THRESH).any(axis=1))[0]
    return int(rows.max()) + 1


def main():
    os.makedirs(BACKUP, exist_ok=True)
    ok = True
    for body, blink in PAIRS:
        imgs = {}
        for n in (body, blink):
            src = os.path.join(ASSETS, n + '.webp')
            dst = os.path.join(BACKUP, n + '.webp')
            if not os.path.exists(dst):
                shutil.copy2(src, dst)
            imgs[n] = Image.open(dst).convert('RGBA')   # 恒读备份原件（脚本可重入）
        bottoms = {n: bottom_at_thresh(im) for n, im in imgs.items()}
        cut = max(bottoms.values())
        outs = {}
        for n, im in imgs.items():
            out = im.crop((0, 0, im.width, cut))
            if n == blink and bottoms[blink] < cut:
                body_crop = imgs[body].crop((0, 0, im.width, cut))
                mask = Image.new('L', (im.width, cut), 0)
                mask.paste(255, (0, bottoms[blink], im.width, cut))
                out.paste(body_crop, (0, 0), mask)
            outs[n] = out
        for n, out in outs.items():
            buf = io.BytesIO()
            out.save(buf, 'WEBP', quality=95, method=6, exact=True)
            with open(os.path.join(ASSETS, n + '.webp'), 'wb') as f:
                f.write(buf.getvalue())
        # 核验：两帧尺寸完全一致＋最底行 alpha>0（字面口径）与 >60（真值口径）
        sizes = []
        for n in (body, blink):
            a = np.array(Image.open(os.path.join(ASSETS, n + '.webp')).convert('RGBA'))[:, :, 3]
            sizes.append((a.shape[1], a.shape[0]))
            last = a[-1]
            print(f'{n}: 原图 {imgs[n].width}×{imgs[n].height}(阈{THRESH}底 {bottoms[n]}) → 裁后 {a.shape[1]}×{a.shape[0]} '
                  f'最底行 alpha>0 像素 {int((last > 0).sum())} / >{THRESH} 像素 {int((last > THRESH).sum())} / 峰值 {int(last.max())}')
            ok = ok and (last > 0).any() and (last > THRESH).any()
        same = sizes[0] == sizes[1]
        ok = ok and same
        print(f'{body} 对：两帧尺寸 {"一致" if same else "不一致！"} {sizes}')
    print('E153-P4 刀一：', 'PASS' if ok else 'FAIL')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
