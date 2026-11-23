import re, shutil, os, glob
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist')
out = 'pub'
if os.path.isdir(out):
    shutil.rmtree(out)
os.makedirs(out + '/assets')
os.makedirs(out + '/covers')
for f in glob.glob(src + '/_astro/*'):
    shutil.copy(f, out + '/assets/' + os.path.basename(f))
for f in glob.glob(src + '/covers/*'):
    shutil.copy(f, out + '/covers/' + os.path.basename(f))
shutil.copy(src + '/theme.js', out + '/theme.js')
if os.path.isdir(src + '/audio'): shutil.copytree(src + '/audio', out + '/audio')
h = open(src + '/index.html').read()
css = ''
for m in re.findall(r'<link rel="stylesheet" href="/_astro/([^"]+)">', h):
    css += open(src + '/_astro/' + m).read()
h = re.sub(r'<link[^>]*>', '', h)
js = open(glob.glob(src + '/_astro/index.astro_astro_type_script*.js')[0]).read().replace('./data.', './assets/data.')
js = open(glob.glob(src + '/_astro/Base.astro_astro_type_script*.js')[0]).read() + '\n' + js
theme = open(src + '/theme.js').read()
h = re.sub(r'<script[^>]*src="[^"]*"[^>]*></script>', '', h)
h = re.sub(r'<script type="module">.*?</script>', '', h, flags=re.S)
body = re.search(r'<body[^>]*>(.*)</body>', h, re.S).group(1)
body = body.replace('src="/audio/', 'src="audio/').replace('url(/covers/', 'url(covers/').replace('src="/covers/', 'src="covers/').replace('poster="/covers/', 'poster="covers/').replace('/_astro/', 'assets/')
css = css.replace('/covers/', 'covers/').replace('/_astro/', 'assets/')
import base64
fav='data:image/png;base64,'+base64.b64encode(open(src+'/favicon.png','rb').read()).decode()
page = '<meta charset="utf-8"><title>WavsX</title><link rel="icon" href="'+fav+'"><style>' + css + '</style><script>' + theme + '</script>' + body + '<script type="module">' + js + '</script>'
open(out + '/index.html', 'w').write(page)
print(len(page), os.listdir(out + '/assets'))
