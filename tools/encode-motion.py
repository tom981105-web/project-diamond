"""Encode image-generated 4x3 keyframe sheets into game WebP/GIF animations.

Usage: python3 tools/encode-motion.py 1=/absolute/avatar-01.png [...]
Requires Pillow. Original artwork is never overwritten.
"""
from pathlib import Path
import sys
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / 'assets/motion'
KINDS = ('swing', 'pitch', 'rest')
DURATIONS = ([180, 100, 100, 700], [180, 100, 100, 700], [800, 300, 600, 300])


def encode(index, source):
    sheet = Image.open(source).convert('RGBA')
    w, h = sheet.size
    if abs(w / h - 4 / 3) > .01:
        raise ValueError(f'{source}: expected a four-column, three-row square-cell atlas')
    if sheet.getchannel('A').histogram()[0] < w * h * .2:
        raise ValueError(f'{source}: missing transparent background')
    OUT.mkdir(parents=True, exist_ok=True)
    for row, kind in enumerate(KINDS):
        frames = [sheet.crop((round(col*w/4), round(row*h/3), round((col+1)*w/4), round((row+1)*h/3)))
                  .resize((256, 256), Image.Resampling.LANCZOS) for col in range(4)]
        base = OUT / f'avatar-0{index}-{kind}'
        frames[0].save(str(base)+'-still.webp', quality=88, method=6)
        frames[0].save(str(base)+'.webp', save_all=True, append_images=frames[1:],
                       duration=DURATIONS[row], loop=0, quality=86, method=6, minimize_size=True)
        # One stable palette prevents color flicker; reserve entry 255 for transparency.
        montage = Image.new('RGB', (256*4, 256), 'white')
        for col, frame in enumerate(frames):
            montage.paste(frame, (col*256, 0), frame)
        palette = montage.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
        gif = []
        for frame in frames:
            opaque = Image.new('RGB', frame.size, 'white'); opaque.paste(frame, mask=frame.getchannel('A'))
            quantized = opaque.quantize(palette=palette, dither=Image.Dither.NONE)
            quantized.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
            quantized.info['transparency'] = 255
            gif.append(quantized)
        gif[0].save(str(base)+'.gif', save_all=True, append_images=gif[1:],
                    duration=DURATIONS[row], loop=0, transparency=255, disposal=2, optimize=False)
        for ext in ('.webp', '.gif'):
            result = Image.open(str(base)+ext)
            assert result.n_frames == 4 and result.size == (256, 256)
        print(base.name, (Path(str(base)+'.webp').stat().st_size), 'WebP bytes')


if __name__ == '__main__':
    for entry in sys.argv[1:]:
        index, path = entry.split('=', 1)
        if not 1 <= int(index) <= 6:
            raise ValueError('Avatar index must be between 1 and 6')
        encode(int(index), path)
