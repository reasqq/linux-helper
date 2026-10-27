from PIL import Image, ImageDraw, ImageFont

S = 1024
im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle((42, 42, 982, 982), radius=235, fill=(24, 27, 56), outline=(135, 105, 221), width=12)
d.rounded_rectangle((105, 170, 919, 855), radius=92, fill=(35, 39, 77), outline=(108, 93, 159), width=9)
d.rounded_rectangle((105, 170, 919, 310), radius=92, fill=(75, 61, 128))
d.rectangle((105, 250, 919, 310), fill=(75, 61, 128))
for x, c in [(190, (255, 134, 116)), (249, (239, 189, 104)), (308, (110, 215, 164))]:
    d.ellipse((x-18, 225-18, x+18, 225+18), fill=c)
d.line([(245, 446), (366, 538), (245, 629)], fill=(190, 158, 255), width=47, joint='curve')
d.rounded_rectangle((425, 622, 696, 663), radius=19, fill=(121, 218, 175))
im.save('assets/icon.png')
im.save('assets/icon.ico', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
