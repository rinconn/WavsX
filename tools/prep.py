import re, shutil, os, glob
src = '/home/user/WavsX/dist'
out = '/tmp/claude-0/-home-user-WavsX/3c24c89f-274e-5b00-831c-e399cfa60d23/scratchpad/pub'
if os.path.isdir(out):
    shutil.rmtree(out)
os.makedirs(out + '/assets')
os.makedirs(out + '/covers')
for f in glob.glob(src + '/_astro/*'):
    shutil.copy(f, out + '/assets/' + os.path.basename(f))
for f in glob.glob(src + '/covers/*'):
    shutil.copy(f, out + '/covers/' + os.path.basename(f))
shutil.copy(src + '/theme.js', out + '/theme.js')
h = open(src + '/index.html').read()
css = ''
for m in re.findall(r'<link rel="stylesheet" href="/_astro/([^"]+)">', h):
    css += open(src + '/_astro/' + m).read()
h = re.sub(r'<link[^>]*>', '', h)
js = open(glob.glob(src + '/_astro/index.astro_astro_type_script*.js')[0]).read().replace('./data.', './assets/data.')
theme = open(src + '/theme.js').read()
h = re.sub(r'<script[^>]*src="[^"]*"[^>]*></script>', '', h)
h = re.sub(r'<script type="module">.*?</script>', '', h, flags=re.S)
body = re.search(r'<body[^>]*>(.*)</body>', h, re.S).group(1)
body = body.replace('url(/covers/', 'url(covers/').replace('src="/covers/', 'src="covers/').replace('poster="/covers/', 'poster="covers/').replace('/_astro/', 'assets/')
css = css.replace('/covers/', 'covers/').replace('/_astro/', 'assets/')
page = '<title>WavsX</title><style>' + css + '</style><script>' + theme + '</script>' + body + '<script type="module">' + js + '</script>'
open(out + '/index.html', 'w').write(page)
print(len(page), os.listdir(out + '/assets'))
