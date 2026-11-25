# Do Yourself v2 — cenas isométricas animadas (img/cenas/*.svg)
# Rodar na pasta site: python tools/cenas.py   (as cores por serviço ficam em TEMAS)
import os
C, H = .8660254, .5
TEMAS = {
    'luz': dict(t='#fffdf9', l='#f6e7d3', r='#e3c6a3', g1='#fff8ee', g2='#f3dcbf', g3='#e2c19a', sh='#8a4d12', rua='#d9bd9b', ac='#e2700f', ac2='#b9560a', ac3='#f6a152', v1='#c98a4e', v2='#8f5a2a', vl='#ffd873', ag='#8fd3ea', fo='#b9cf96', fo2='#86a866', txt='#fff', pi='#7a4413'),
    'emp': dict(t='#fdfeff', l='#e4ebf2', r='#c0cedc', g1='#f4f8fb', g2='#d3dee9', g3='#b3c3d4', sh='#1d3850', rua='#a9bacb', ac='#2c4a66', ac2='#1c344b', ac3='#5d81a5', v1='#6f94b8', v2='#34567a', vl='#bfe6ff', ag='#8fd3ea', fo='#a9c6b4', fo2='#7ba38c', txt='#fff', pi='#3d5870'),
    'wtx': dict(t='#fefeff', l='#e6e9fb', r='#c5cbf0', g1='#f5f6fe', g2='#d6dbf8', g3='#b5bde9', sh='#232d7a', rua='#b0b8e2', ac='#4152c9', ac2='#2d3a9e', ac3='#8793ec', v1='#8390e0', v2='#4350b4', vl='#ffe08a', ag='#8fd3ea', fo='#aacbbb', fo2='#7ba695', txt='#fff', pi='#4c5290'),
}
f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.') if '.' in '%.1f' % v else '%.1f' % v


class Cena:
    def __init__(s, nome, tema, w, d, alto, S=16):
        s.n, s.T, s.w, s.d, s.S = nome, TEMAS[tema], w, d, S
        s.itens, s.chao, s.som, s.fim, s.k = [], [], [], [], 0
        m = 26
        s.ox, s.oy = d * C * S + m, alto * S + 20
        s.W, s.Hh = (w + d) * C * S + 2 * m, alto * S + (w + d) * H * S + 60
        s.som_c, s.topo = [], 1e9

    dobra = None  # (limite de y, quanto recua, x a partir do qual afasta, quanto afasta): separa as ilhas
    def P(s, x, y, z=0):
        if s.dobra and y < s.dobra[0]: x, y = x + (s.dobra[3] if x > s.dobra[2] else 0), y - s.dobra[1]
        return s.ox + (x - y) * C * s.S, s.oy + (x + y) * H * s.S - z * s.S
    def pt(s, *a): return '%s %s' % tuple(map(f, s.P(*a)))
    def poly(s, ps, fill, extra=''): return f'<path d="M{"L".join(s.pt(*p) for p in ps)}z" fill="{fill}"{" " + extra if extra else ""}/>'
    # decalques: face esquerda (y fixo; u cresce com x) e direita (x fixo; u cresce com -y)
    def mL(s, x, y, z): a, b = s.P(x, y, z); S = s.S; return f'matrix({f(C*S)[:6]} {f(H*S)} 0 {S} {f(a)} {f(b)})'
    def mR(s, x, y, z): a, b = s.P(x, y, z); S = s.S; return f'matrix({f(C*S)[:6]} {f(-H*S)} 0 {S} {f(a)} {f(b)})'
    def mT(s, x, y, z=0): a, b = s.P(x, y, z); S = s.S; return f'matrix({f(C*S)[:6]} {f(H*S)} {f(-C*S)[:6]} {f(H*S)} {f(a)} {f(b)})'
    def qL(s, x, y, z, w, h, fill, e=''): return s.poly([(x, y, z), (x + w, y, z), (x + w, y, z + h), (x, y, z + h)], fill, e)
    def qR(s, x, y, z, d, h, fill, e=''): return s.poly([(x, y, z), (x, y + d, z), (x, y + d, z + h), (x, y, z + h)], fill, e)
    def qT(s, x, y, z, w, d, fill, e=''): return s.poly([(x, y, z), (x + w, y, z), (x + w, y + d, z), (x, y + d, z)], fill, e)
    def cubo(s, x, y, z, w, d, h, c=None, e=''):
        t, l, r = c or ('url(#%st)' % s.n, 'url(#%sl)' % s.n, 'url(#%sr)' % s.n)
        return s.qL(x, y + d, z, w, h, l, e) + s.qR(x + w, y, z, d, h, r, e) + s.qT(x, y, z + h, w, d, t, e)
    def sombra(s, x, y, w, d, h, k=.42):
        dx, dy = h * k, -h * k * .55
        s.som.append(f'<path d="M' + 'L'.join(s.pt(*p) for p in [(x, y + d), (x + w, y + d), (x + w + dx, y + d + dy), (x + w + dx, y + dy), (x + dx, y + dy), (x, y)]) + 'z"/>')
    def add(s, cx, svg, sombra=True, cl='up', dx=''):
        x, y, z, w, d, h = cx
        if sombra and z < .2: s.sombra(x, y, w, d, h)
        s.itens.append((x, x + w, y, y + d, z, z + h, svg, cl, dx))
    def bloco(s, x, y, z, w, d, h, c=None, dec='', **k): s.add((x, y, z, w, d, h), s.cubo(x, y, z, w, d, h, c) + dec, **k)
    def ac(s): return (s.T['ac3'], s.T['ac'], s.T['ac2'])

    def jan(s):  # classe de janela: algumas acendem, em tempos diferentes
        s.k += 1; return '' if (s.k * 7) % 5 in (1, 3) else f'class="w w{(s.k * 5) % 7}"'
    def janL(s, x, y, z, w, h):
        j = s.jan(); o = s.qL(x, y, z, w, h, s.T['v1'])
        return o + (s.qL(x, y, z, w, h, s.T['vl'], j) if j else '')
    def janR(s, x, y, z, d, h):
        j = s.jan(); o = s.qR(x, y, z, d, h, s.T['v2'])
        return o + (s.qR(x, y, z, d, h, s.T['vl'], j) if j else '')
    def txL(s, x, y, z, t, tam, cor=None): return f'<text transform="{s.mL(x, y, z)}" font-size="{tam}" text-anchor="middle" fill="{cor or s.T["txt"]}">{t}</text>'
    def txR(s, x, y, z, t, tam, cor=None): return f'<text transform="{s.mR(x, y, z)}" font-size="{tam}" text-anchor="middle" fill="{cor or s.T["txt"]}">{t}</text>'

    def arvore(s, x, y, e=1.0):
        X, Y = s.P(x, y); S = s.S * e; t = s.T
        s.som.append(f'<ellipse cx="{f(X+S*.55)}" cy="{f(Y-S*.08)}" rx="{f(S*1.05)}" ry="{f(S*.42)}"/>')
        g = f'<path d="M{f(X)} {f(Y)}v{f(-S*1.2)}" stroke="{t["pi"]}" stroke-width="{f(S*.2)}" stroke-linecap="round"/><g class="vento v{int(x*3+y)%3}"><circle cx="{f(X)}" cy="{f(Y-S*1.75)}" r="{f(S*.9)}" fill="url(#{s.n}f)"/><circle cx="{f(X+S*.3)}" cy="{f(Y-S*2.4)}" r="{f(S*.58)}" fill="url(#{s.n}f)"/></g>'
        s.add((x - .4, y - .4, 0, .8, .8, 2.6 * e), g, sombra=False)
    def arbusto(s, x, y, r=.45):
        X, Y = s.P(x, y); R = r * s.S
        s.add((x - r * .7, y - r * .7, 0, r * 1.4, r * 1.4, r * 1.4), f'<circle cx="{f(X)}" cy="{f(Y-R*.7)}" r="{f(R)}" fill="url(#{s.n}f)"/>', sombra=False)
    def poste(s, x, y, h=3.4):
        X, Y = s.P(x, y); Z = h * s.S
        s.add((x - .1, y - .1, 0, .2, .2, h), f'<path d="M{f(X)} {f(Y)}v{f(-Z)}" stroke="{s.T["pi"]}" stroke-width="2.6" stroke-linecap="round"/><circle class="hal" cx="{f(X)}" cy="{f(Y-Z)}" r="17" fill="url(#{s.n}h)"/><circle cx="{f(X)}" cy="{f(Y-Z)}" r="4.6" fill="#fff3c9"/>', sombra=False)
    def guarda(s, x, y, c=None):
        a, b = s.P(x, y, 0); cx, cy = s.P(x, y, 2.5); c = c or s.T['ac']
        s.som.append(f'<ellipse cx="{f(a+10)}" cy="{f(b-2)}" rx="21" ry="9"/>')
        mesa = f'<path d="M{f(a)} {f(b)}V{f(cy)}" stroke="{s.T["pi"]}" stroke-width="2.4"/><ellipse cx="{f(a)}" cy="{f(b-13)}" rx="12" ry="6" fill="#fff"/><ellipse cx="{f(a-15)}" cy="{f(b-5)}" rx="5" ry="2.7" fill="{s.T["ac3"]}"/><ellipse cx="{f(a+15)}" cy="{f(b-4)}" rx="5" ry="2.7" fill="{s.T["ac3"]}"/>'
        g = mesa + f'<path d="M{f(a-23)} {f(cy+4)}Q{f(a)} {f(cy+18)} {f(a+23)} {f(cy+4)}L{f(a)} {f(cy-12)}z" fill="{c}"/><path d="M{f(a-23)} {f(cy+4)}Q{f(a-10)} {f(cy+13)} {f(a-4)} {f(cy+10.5)}L{f(a)} {f(cy-12)}z" fill="#fff" opacity=".35"/>'
        s.add((x - .9, y - .9, 0, 1.8, 1.8, 2.8), g, sombra=False)
    def gente(s, x, y, cor=None):
        a, b = s.P(x, y); cor = cor or s.T['ac']
        s.add((x - .15, y - .15, 0, .3, .3, 1.3), f'<g class="gen g{int(x*5+y*3)%3}"><ellipse cx="{f(a+3)}" cy="{f(b)}" rx="6" ry="2.4" fill="{s.T["sh"]}" opacity=".2"/><path d="M{f(a)} {f(b-2)}v-9" stroke="{cor}" stroke-width="6.4" stroke-linecap="round"/><circle cx="{f(a)}" cy="{f(b-18)}" r="3.6" fill="#e9b994"/></g>', sombra=False)
    def carro(s, x, y, cor, dist, dur, atraso, eixo='x'):
        # fica na frente de tudo: a rua é sempre a borda da cena
        L, W = (2.5, 1.2) if eixo == 'x' else (1.2, 2.5)
        c = {'ac': s.ac(), 'br': ('#fff', '#eef0f3', '#cfd4da'), 'pr': ('#5a5f66', '#41464c', '#2c3035')}[cor]
        j = s.T['v2']
        if eixo == 'x': cab = s.cubo(x + .45, y + .1, .75, 1.5, 1, .5, (c[0], j, j))
        else: cab = s.cubo(x + .1, y + .45, .75, 1, 1.5, .5, (c[0], j, j))
        rod = ''
        for u in (.55, 1.95):
            a, b = s.P(x + u, y + W, .22) if eixo == 'x' else s.P(x + L, y + u, .22)
            rod += f'<ellipse cx="{f(a)}" cy="{f(b)}" rx="3.2" ry="4" fill="#24282d"/>'
        a, b = s.P(x + L / 2, y + W / 2)
        sh = f'<ellipse cx="{f(a+5)}" cy="{f(b+1)}" rx="25" ry="12" fill="{s.T["sh"]}" opacity=".2"/>'
        dx, dy = (dist * C * s.S, dist * H * s.S) if eixo == 'x' else (-dist * C * s.S, dist * H * s.S)
        s.fim.append(f'<g class="car" style="--x:{f(dx)}px;--y:{f(dy)}px;animation-duration:{dur}s;animation-delay:{atraso}s">{sh}{s.cubo(x, y, .22, L, W, .55, c)}{rod}{cab}</g>')
    def cabo(s, ps, dur=2.2):
        d = 'M' + 'L'.join(s.pt(*p) for p in ps)
        s.chao.append(f'<path d="{d}" class="cab0"/><path d="{d}" class="cab" style="animation-duration:{dur}s"/>')
    def rua(s, x, y, w, d, eixo='x'):
        o = s.qT(x, y, 0, w, d, s.T['rua']); a = (x + .6, y + d / 2) if eixo == 'x' else (x + w / 2, y + .6); b = (x + w - .6, y + d / 2) if eixo == 'x' else (x + w / 2, y + d - .6)
        s.chao.append(o + f'<path d="M{s.pt(*a)}L{s.pt(*b)}" stroke="#fff" stroke-width="2.4" stroke-dasharray="11 10" opacity=".85"/>')
    def faixa(s, x, y, w, d):
        s.chao.append(''.join(s.qT(x + i * .62, y, 0, .34, d, '#fff', 'opacity=".9"') for i in range(int(w / .62))))
    def piso(s, x, y, w, d, c=None, r=0):
        s.chao.append(f'<rect transform="{s.mT(x, y)}" width="{w}" height="{d}" rx="{r}" fill="{c or s.T["g1"]}"/>')
    def piscina(s, x, y, w, d, dx=''):
        s.piso(x - .6, y - .6, w + 1.2, d + 1.2, '#fff', .5)
        on = ''.join(f'<path transform="{s.mT(x + .5 + (i % 2) * .5, y + .6 + i * .75)}" d="M0 0q.4-.28.8 0t.8 0 .8 0" fill="none" stroke="#fff" stroke-width=".13" opacity=".8" class="onda o{i % 3}"/>' for i in range(int(d / .8)))
        s.chao.append(f'<rect transform="{s.mT(x, y)}" width="{w}" height="{d}" rx=".4" fill="#4aa7c6"/><rect transform="{s.mT(x, y + .22)}" width="{w}" height="{d - .22}" rx=".4" fill="{s.T["ag"]}"/>{on}')
        if dx: s.chao.append(f'<rect class="hl" data-x="{dx}" transform="{s.mT(x, y)}" width="{w}" height="{d}" rx=".4"/>')
    def marca(s, dx, x, y, z):
        a, b = s.P(x, y, z)
        s.fim.append(f'<g class="mk" data-x="{dx}"><circle class="mk0" cx="{f(a)}" cy="{f(b)}" r="11"/><circle class="mk1" cx="{f(a)}" cy="{f(b)}" r="9"/><circle cx="{f(a)}" cy="{f(b)}" r="3.4" fill="#fff"/><circle cx="{f(a)}" cy="{f(b)}" r="22" fill="transparent"/></g>')
    def wifi(s, x, y, z, e=1):
        a, b = s.P(x, y, z); s.topo = min(s.topo, b - 46 * e)
        s.fim.append(f'<g transform="translate({f(a)} {f(b)}) scale({e})" fill="none" stroke="{s.T["ac"]}" stroke-width="5.5" stroke-linecap="round"><circle r="3.4" fill="{s.T["ac"]}" stroke="none"/>' + ''.join(f'<path class="wf f{i}" d="M{-r} {-r*.62}Q0 {-r*1.5} {r} {-r*.62}"/>' for i, r in enumerate((11, 20, 29))) + '</g>')

    def salva(s, ilhas=None):
        n, t = s.n, s.T
        # ordem de trás para a frente
        it = s.itens; N = len(it); dep = [set() for _ in it]; e = 1e-6
        def cx(i):
            x0, x1, y0, y1, z0, z1 = i[:6]
            return (x0 - y1, x1 - y0, x0 + y0 - 2 * z1, x1 + y1 - 2 * z0)
        bs = [cx(i) for i in it]
        for a in range(N):
            for b in range(N):
                if a == b: continue
                A, B = it[a], it[b]; p, q = bs[a], bs[b]
                if p[1] <= q[0] or q[1] <= p[0] or p[3] <= q[2] or q[3] <= p[2]: continue
                if A[1] <= B[0] + e or A[3] <= B[2] + e or A[5] <= B[4] + e:
                    if not (B[1] <= A[0] + e or B[3] <= A[2] + e or B[5] <= A[4] + e): dep[b].add(a)
        ok, ordem = set(), []
        def v(i, pilha=()):
            if i in ok or i in pilha: return
            for j in sorted(dep[i], key=lambda k: it[k][0] + it[k][2]): v(j, pilha + (i,))
            if i not in ok: ok.add(i); ordem.append(i)
        for i in sorted(range(N), key=lambda k: it[k][0] + it[k][2]): v(i)
        corpo = ''.join(f'<g class="{it[i][7]}" style="animation-delay:{k * 1.1 / N:.2f}s"{" data-x=%s" % chr(34) + it[i][8] + chr(34) if it[i][8] else ""}>{it[i][6]}</g>' for k, i in enumerate(ordem))
        w, d, b = s.w, s.d, .9
        il = ilhas or [(0, 0, w, d)]
        base = gb = ''
        for x0, y0, w0, d0 in il:
            a, c = x0 + w0, y0 + d0
            base += '<g stroke-linejoin="round" stroke-width="10">' + s.qL(x0, c, -b, w0, b, t['g2'], f'stroke="{t["g2"]}"') + s.qR(a, y0, -b, d0, b, t['g3'], f'stroke="{t["g3"]}"') + s.qT(x0, y0, 0, w0, d0, t['g1'], f'stroke="{t["g1"]}"') + '</g>'
            gb += f'<ellipse cx="{f(s.P(x0 + w0/2, y0 + d0/2)[0])}" cy="{f(s.P(a, c, -b)[1] - (w0+d0)*H*s.S*.36)}" rx="{f((w0+d0)*C*s.S*.5)}" ry="{f((w0+d0)*H*s.S*.46)}" fill="url(#{n}b)"/>'
        gr = lambda i, a, b2: f'<linearGradient id="{n}{i}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{a}"/><stop offset="1" stop-color="{b2}"/></linearGradient>'
        css = (f'.{n} text{{font-family:Manrope,"Segoe UI",Arial,sans-serif;font-weight:800;letter-spacing:.01em}}'
               f'.{n} .up{{animation:isoup .8s cubic-bezier(.2,.9,.3,1.1) both}}@keyframes isoup{{from{{opacity:0;transform:translateY(26px)}}}}'
               f'.{n} .w{{animation:isow 11s ease-in-out infinite both}}@keyframes isow{{0%,12%,78%,100%{{opacity:0}}24%,66%{{opacity:1}}}}'
               + ''.join(f'.{n} .w{i}{{animation-delay:{i * .9 - 8:.1f}s}}' for i in range(7)) +
               f'.{n} .hal{{animation:isoh 11s ease-in-out infinite -6s both}}@keyframes isoh{{0%,12%,80%,100%{{opacity:.15}}24%,66%{{opacity:1}}}}'
               f'.{n} .vento{{transform-box:fill-box;transform-origin:50% 100%;animation:isov 4.2s ease-in-out infinite alternate}}.{n} .v1{{animation-delay:-1.6s}}.{n} .v2{{animation-delay:-2.9s}}@keyframes isov{{from{{transform:rotate(-2.4deg)}}to{{transform:rotate(2.4deg)}}}}'
               f'.{n} .car{{animation:isoc linear infinite both}}@keyframes isoc{{0%{{opacity:0;transform:none}}7%,93%{{opacity:1}}100%{{opacity:0;transform:translate(var(--x),var(--y))}}}}'
               f'.{n} .cab0,.{n} .cab{{fill:none;stroke-linejoin:round;stroke-linecap:round;stroke-width:5;stroke:{t["ac"]};opacity:.26}}.{n} .cab{{opacity:1;stroke-dasharray:16 40;animation:isod 2.2s linear infinite}}@keyframes isod{{from{{stroke-dashoffset:112}}}}'
               f'.{n} .onda{{animation:isoo 2.6s ease-in-out infinite alternate}}.{n} .o1{{animation-delay:-1s}}.{n} .o2{{animation-delay:-1.8s}}@keyframes isoo{{from{{opacity:.15}}to{{opacity:.95}}}}'
               f'.{n} .gen{{animation:isog 3s ease-in-out infinite alternate}}.{n} .g1{{animation-delay:-1s}}.{n} .g2{{animation-delay:-2s}}@keyframes isog{{from{{transform:translate(-5px,-3px)}}to{{transform:translate(5px,3px)}}}}'
               f'.{n} .elev{{animation:isoe 9s cubic-bezier(.5,0,.5,1) infinite}}@keyframes isoe{{0%,8%,100%{{transform:none}}40%,54%{{transform:translateY(var(--e))}}74%,82%{{transform:translateY(calc(var(--e)*.45))}}}}'
               f'.{n} .canc{{transform-box:fill-box;transform-origin:0 100%;animation:isok 8s ease-in-out infinite}}@keyframes isok{{0%,25%,75%,100%{{transform:none}}38%,62%{{transform:rotate(-58deg)}}}}'
               f'.{n} .fum{{animation:isof 3.6s ease-out infinite}}.{n} .m1{{animation-delay:-1.2s}}.{n} .m2{{animation-delay:-2.4s}}@keyframes isof{{0%{{opacity:0;transform:translateY(4px)}}25%{{opacity:.8}}100%{{opacity:0;transform:translate(8px,-30px)}}}}'
               f'.{n} .ref{{animation:isor 7s ease-in-out infinite}}@keyframes isor{{0%,20%{{transform:translateX(-60%)}}75%,100%{{transform:translateX(130%)}}}}'
               f'.{n} .wf{{animation:isox 2.1s ease-out infinite both}}.{n} .f1{{animation-delay:.25s}}.{n} .f2{{animation-delay:.5s}}@keyframes isox{{0%,100%{{opacity:.12}}35%{{opacity:1}}}}'
               f'.{n} .arc{{fill:none;stroke:{t["ac"]};stroke-width:4;stroke-linecap:round;stroke-dasharray:2 11;animation:isod2 1.4s linear infinite}}@keyframes isod2{{from{{stroke-dashoffset:26}}}}'
               f'.{n} .fio{{fill:none;stroke:{t["pi"]};stroke-width:1.8;opacity:.7}}.{n} .pul{{fill:none;stroke:{t["ac"]};stroke-width:7;stroke-linecap:round;stroke-dasharray:1 17;animation:isop .9s linear infinite}}@keyframes isop{{from{{stroke-dashoffset:18}}}}.{n} .sol{{transform-box:fill-box;transform-origin:center;animation:isos 26s linear infinite}}@keyframes isos{{to{{transform:rotate(360deg)}}}}.{n} .raio{{animation:isorr 2.4s ease-in-out infinite alternate}}@keyframes isorr{{from{{opacity:.18}}to{{opacity:.6}}}}.{n} .agua{{stroke-dasharray:7 9;animation:isoa .8s linear infinite}}@keyframes isoa{{from{{stroke-dashoffset:16}}}}'
               f'.{n} .barb{{animation:isob 1.6s linear infinite}}@keyframes isob{{to{{transform:translateY(14px)}}}}'
               f'.{n} .gru{{animation:isogr 8s ease-in-out infinite alternate}}@keyframes isogr{{from{{transform:translateY(0)}}to{{transform:translateY(34px)}}}}'
               f'.{n} .hl{{opacity:0;fill:{t["ac"]};pointer-events:none;transition:opacity .3s}}.{n} .mk{{display:none}}'
               f'@media (prefers-reduced-motion:reduce){{.{n} *{{animation:none!important}}.{n} .w{{opacity:1}}.{n} .car{{opacity:1;transform:translate(calc(var(--x)*.45),calc(var(--y)*.45))}}}}')
        defs = gr('t', t['t'], t['t']) + gr('l', t['t'], t['l']) + gr('r', t['l'], t['r']) + gr('gl', '#cfe6f7', '#7fb0da') + gr('gr', '#79a9d3', '#4478a8') \
            + f'<radialGradient id="{n}f" cx=".35" cy=".28" r=".85"><stop stop-color="#e9f3d8"/><stop offset=".45" stop-color="{t["fo"]}"/><stop offset="1" stop-color="{t["fo2"]}"/></radialGradient><radialGradient id="{n}h"><stop stop-color="#ffe9a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient><radialGradient id="{n}b"><stop stop-color="{t["sh"]}" stop-opacity=".3"/><stop offset=".7" stop-color="{t["sh"]}" stop-opacity=".16"/><stop offset="1" stop-color="{t["sh"]}" stop-opacity="0"/></radialGradient>' + ''.join(s.som_c)
        clip = f'<clipPath id="{n}p">{"".join(s.qT(*q[:2], 0, *q[2:], "#000") for q in il)}</clipPath>'
        y0 = min(min(s.P(i[0], i[2], i[5])[1] for i in it), s.topo) - 14
        o = f'<svg xmlns="http://www.w3.org/2000/svg" class="{n}" viewBox="0 {f(y0)} {f(s.W)} {f(s.Hh-y0)}" width="{f(s.W)}" height="{f(s.Hh-y0)}"><style>{css}</style><defs>{defs}{clip}</defs>{gb}{base}<g clip-path="url(#{n}p)">{"".join(c for c in s.chao)}<g fill="{t["sh"]}" opacity=".16">{"".join(s.som)}</g></g>{corpo}{"".join(s.fim)}</svg>'
        os.makedirs('img/cenas', exist_ok=True)
        open(f'img/cenas/{n}.svg', 'w', encoding='utf8', newline='\n').write(o); print(n, len(o), f'{s.W:.0f}x{s.Hh:.0f}', N)


def vidro(s, x, y, z, w, d, h, nu, nv, nz):
    """volume de vidro com caixilhos e reflexo que passa"""
    n = s.n
    o = s.cubo(x, y, z, w, d, h, ('url(#%st)' % n, 'url(#%sgl)' % n, 'url(#%sgr)' % n))
    s.k += 1; i = f'{n}c{s.k}'
    s.som_c.append(f'<clipPath id="{i}">{s.qL(x, y + d, z, w, h, "#000")}</clipPath><clipPath id="{i}r">{s.qR(x + w, y, z, d, h, "#000")}</clipPath>')
    for a in range(nu):
        for b in range(nz):
            j = s.jan()
            if j and (a * 3 + b * 5) % 4 == 0: o += s.qL(x + a * w / nu, y + d, z + b * h / nz, w / nu, h / nz, s.T['vl'], j)
    for a in range(nv):
        for b in range(nz):
            j = s.jan()
            if j and (a * 3 + b * 7) % 4 == 1: o += s.qR(x + w, y + a * d / nv, z + b * h / nz, d / nv, h / nz, s.T['vl'], j)
    o += f'<g clip-path="url(#{i})"><g class="ref" style="animation-delay:-{s.k % 3}s"><path d="M{s.pt(x, y+d, z+h+6)}L{s.pt(x+w*.3, y+d, z+h+6)}L{s.pt(x+w*.12, y+d, z-6)}L{s.pt(x-w*.18, y+d, z-6)}z" fill="#fff" opacity=".35"/></g></g>'
    o += f'<g clip-path="url(#{i}r)">' + s.poly([(x + w, y + d * .55, z + h), (x + w, y + d * .25, z + h), (x + w, y + d * .5, z), (x + w, y + d * .8, z)], '#fff', 'opacity=".16"') + '</g>'
    ln = ''
    for a in range(1, nu): ln += f'M{s.pt(x + a*w/nu, y+d, z)}L{s.pt(x + a*w/nu, y+d, z+h)}'
    for a in range(1, nv): ln += f'M{s.pt(x+w, y + a*d/nv, z)}L{s.pt(x+w, y + a*d/nv, z+h)}'
    for b in range(1, nz): ln += f'M{s.pt(x, y+d, z+b*h/nz)}L{s.pt(x+w, y+d, z+b*h/nz)}L{s.pt(x+w, y, z+b*h/nz)}'
    return o + f'<path d="{ln}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".75"/>'


def torre(s, x, y, w, d, andares, a=1.75, terreo=2.2, var=True):
    """prédio de apartamentos com janelas e sacadas"""
    h = terreo + andares * a
    o = s.cubo(x, y, 0, w, d, h)
    for k in range(andares):
        z = terreo + k * a
        nu = int(w / 1.75)
        for i in range(nu):
            o += s.janL(x + .45 + i * (w - .5) / nu, y + d, z + .4, (w - .5) / nu - .55, .95)
        o += s.qL(x, y + d, z, w, .13, s.T['ac3'], 'opacity=".4"')
        nd = int(d / 1.8)
        for i in range(nd):
            o += s.janR(x + w, y + .4 + i * (d - .5) / nd, z + .35, (d - .5) / nd - .5, 1.05)
        if var:  # sacada
            for i in range(nd // 2 + nd % 2):
                yy = y + .25 + (2 * i) * (d - .5) / nd
                o += s.cubo(x + w, yy, z + .05, .62, (d - .5) / nd - .2, .58, ('#fff', s.T['ac3'], s.T['ac3']))
    o += s.cubo(x - .12, y - .12, h, w + .24, d + .24, .32)
    return o + s.qT(x + .35, y + .35, h + .32, w - .7, d - .7, s.T['g2'], 'opacity=".7"'), h + .32


def lounge(s, x, y):
    s.bloco(x, y, 0, .7, 1.7, .22, (s.T['ac3'], s.T['ac'], s.T['ac2']))


# ---------------------------------------------------------------- prédio
def predio(tema):
    s = Cena('predio-' + tema, tema, 22, 21, 13.4)
    T = s.T
    s.rua(0, 17.6, 22, 3.4); s.faixa(8.2, 17.8, 2.6, 3)
    s.piso(8.2, 11, 2.6, 6.4, '#fff', .2); s.piso(0, 16.4, 22, 1.1, '#fff')
    s.piso(10.9, 10.2, 10.4, 5.8, '#e4ecd0' if tema == 'luz' else '#dfeae4', .8); s.piso(.6, 11.4, 7, 4.6, '#e4ecd0', .8)
    s.cabo([(0, 16.9), (4.6, 16.9), (4.6, 10.4)])
    s.piscina(13, 11.6, 6.4, 3, 'lazer')
    # torre A com elevador panorâmico
    o, h = torre(s, 2, 2.6, 7, 7.6, 9)
    o += s.cubo(3.2, 3.4, h, 3.2, 3.2, 1.5, s.ac())
    o += f'<g class="hl" data-x="bomba">{s.cubo(3.2, 3.4, h, 3.2, 3.2, 1.5, (T["ac"],)*3)}</g>'
    ex = 4.7; el = h + .2
    sx = s.cubo(ex, 10.2, 0, 1.9, 1, el, ('#fff', f'url(#{s.n}gl)', f'url(#{s.n}gr)'))
    sx += ''.join(s.qL(ex + .1, 11.2, .15 + i * 1.75, 1.7, 1.6, '#fff', 'opacity=".28"') for i in range(int(el / 1.75)))
    sx += f'<g class="hl" data-x="elev">{s.cubo(ex, 10.2, 0, 1.9, 1, el, (T["ac"],)*3)}</g>'
    sx += f'<g class="elev" style="--e:{f(-(el-2.4)*s.S)}px">{s.qL(ex+.25, 11.2, .3, 1.4, 1.6, "#fff")}{s.qL(ex+.4, 11.2, .45, 1.1, 1.25, T["vl"])}</g>'
    s.add((2, 2.6, 0, 7, 7.6, h), o)
    s.add((ex, 10.2, 0, 1.9, 1, el), sx, sombra=False)
    # torre B com garagem
    o, h2 = torre(s, 12.4, 2, 6.6, 6.6, 6)
    o += s.cubo(14, 3, h2, 2.2, 2.2, 1.1, s.ac())
    gx = 13.2
    o += s.qL(gx, 8.6, 0, 4.6, 1.85, T['pi']) + ''.join(s.qL(gx + .12, 8.6, .12 + i * .34, 4.36, .22, '#fff', 'opacity=".8"') for i in range(5))
    o += s.qL(gx, 8.6, 0, 4.6, 1.85, T['ac'], 'class="hl" data-x="gar"')
    s.add((12.4, 2, 0, 6.6, 6.6, h2), o)
    # portaria
    o = s.cubo(8, 13, 0, 3.2, 2.2, 2.2) + s.janL(8.3, 15.2, .6, 1, 1) + s.qL(9.7, 15.2, 0, 1, 1.75, T['v2']) + s.janR(11.2, 13.4, .6, 1.3, 1)
    o += f'<g class="hl" data-x="port">{s.cubo(8, 13, 0, 3.2, 2.2, 2.2, (T["ac"],)*3)}</g>'
    o += s.cubo(7.4, 12.6, 2.2, 4.4, 3.2, 1.15, s.ac()) + s.txL(9.6, 15.8, 2.45, 'Prédio', .95)
    s.add((7.4, 12.6, 0, 4.4, 3.2, 3.35), o)
    for x, y in ((12.2, 15), (17, 15.2), (18.6, 15.2)): (s.arbusto(x, y) if x < 13 else lounge(s, x, y - .6))
    s.guarda(20.6, 13.4)
    for x, y, e in ((1.2, 12.6, 1), (3.2, 14.6, 1.1), (6.2, 15, .9), (1.4, 1.4, 1), (20.6, 2, 1.1), (20.8, 5.5, 1.2), (20.7, 9, 1), (10.8, 4, 1), (10.6, 8, .9), (5.9, 13, .8)): s.arvore(x, y, e)
    for x in (2, 12.4, 20): s.poste(x, 16.9)
    s.gente(9.4, 16.7); s.gente(14.6, 16.8, T['v2'])
    s.carro(-1, 18, 'br', 22, 9, 0); s.carro(20.6, 19.5, 'ac', -22, 11, -4)
    s.marca('elev', ex + 1, 11.2, 9.5); s.marca('gar', gx + 2.3, 8.6, 1.2); s.marca('port', 8.2, 15.2, .2); s.marca('bomba', 5, 5, h + 1.6); s.marca('lazer', 16.2, 13, 0)
    s.salva()


# ---------------------------------------------------------------- condomínio de casas
def casa(s, x, y, w, d, frente, n):
    T = s.T; h = 3.5; b = 1.35; av = .25
    # paredes + telhado de duas águas (cumeeira em x)
    o = s.cubo(x, y, 0, w, d, h)
    o += s.poly([(x + w, y, h), (x + w, y + d, h), (x + w, y + d / 2, h + b)], T['r'])
    for z in (.5, 2.1):
        for i in range(2): o += s.janL(x + .6 + i * (w - .6) / 2, y + d, z, 1.05, .85)
    if frente:
        o += s.qR(x + w, y + .4, 0, 1.2, 1.4, T['pi']) + ''.join(s.qR(x + w, y + .45, .15 + i * .3, 1.1, .16, '#fff', 'opacity=".7"') for i in range(4)) + s.qR(x + w, y + 1.9, 0, .6, 1.3, T['ac'])
        o += s.janR(x + w, y + .5, 2.1, .8, .9) + s.janR(x + w, y + 1.7, 2.1, .8, .9)
        o += s.cubo(x + w, y + .25, 1.6, .5, 2.4, .16)
    else:
        for z in (.6, 2.1): o += s.janR(x + w, y + .5, z, .8, .85) + s.janR(x + w, y + 1.7, z, .8, .85)
    o += s.poly([(x - av, y - av, h - .12), (x + w + av, y - av, h - .12), (x + w + av, y + d / 2, h + b), (x - av, y + d / 2, h + b)], T['ac2'])
    o += s.poly([(x - av, y + d + av, h - .12), (x + w + av, y + d + av, h - .12), (x + w + av, y + d / 2, h + b), (x - av, y + d / 2, h + b)], T['ac3'] if n % 2 else T['ac'])
    o += f'<path d="M{s.pt(x - av, y + d/2, h + b)}L{s.pt(x + w + av, y + d/2, h + b)}" stroke="#fff" stroke-width="2" opacity=".7"/>'
    s.add((x, y, 0, w + .5, d, h + b), o)


def condominio(tema):
    s = Cena('condominio-' + tema, tema, 24, 24, 3.6, 15)
    T = s.T; gr = '#e4ecd0'
    s.rua(0, 20.4, 24, 3.6); s.piso(0, 19.3, 24, 1, '#fff')
    s.piso(.8, 1, 8.6, 17, gr, .8); s.piso(14.8, 1, 8.4, 17, gr, .8)
    s.rua(10, 1, 4.2, 19.4, 'y')
    s.cabo([(0, 19.8), (9.4, 19.8), (9.4, 1.6)]); s.cabo([(9.4, 19.8), (14.7, 19.8), (14.7, 1.6)])
    for i in range(3): casa(s, 2, 1.2 + i * 3.7, 5.8, 3, True, i)
    for i in range(4): casa(s, 16, 1.2 + i * 3.9, 5.6, 3.1, False, i + 1)
    s.piscina(2.6, 13.2, 4.6, 2.8, 'lazer')
    s.guarda(8.5, 14); s.bloco(1.2, 13, 0, .7, 1.6, .22, s.ac()); s.bloco(1.2, 15, 0, .7, 1.6, .22, s.ac())
    # caixa d'água
    X, Y = s.P(8.6, 2);
    o = s.cubo(8, 1.1, 0, .25, .25, 4) + s.cubo(9, 1.1, 0, .25, .25, 4) + s.cubo(8, 2.1, 0, .25, .25, 4) + s.cubo(9, 2.1, 0, .25, .25, 4) + s.cubo(7.8, .9, 4, 1.7, 1.7, 1.8, s.ac()) + f'<g class="hl" data-x="bomba">{s.cubo(7.8, .9, 4, 1.7, 1.7, 1.8, (T["ac"],)*3)}</g>'
    s.add((8.15, .9, 0, 1.4, 1.2, 5.8), o)
    # muro e pórtico
    for x, w in ((0.3, 8.4), (15.6, 8.1)): s.bloco(x, 18.5, 0, w, .4, 1.3)
    s.bloco(23.3, 1, 0, .4, 17.4, 1.1)
    o = s.cubo(8.8, 16.6, 0, 1.4, 2.3, 2.7) + s.janL(9, 18.9, .8, 1, 1.1) + s.janR(10.2, 17, .8, 1.4, 1.1) + f'<g class="hl" data-x="port">{s.cubo(8.8, 16.6, 0, 1.4, 2.3, 2.7, (T["ac"],)*3)}</g>'
    s.add((8.8, 16.6, 0, 1.4, 2.3, 2.7), o)
    s.bloco(14, 16.6, 0, 1.4, 2.3, 2.7)
    s.add((8.2, 16.4, 2.7, 7.6, 2.8, 1.25), s.cubo(8.2, 16.4, 2.7, 7.6, 2.8, 1.25, s.ac()) + s.txL(12, 19.2, 2.97, 'Condomínio', 1))
    a, b = s.P(10.3, 18.9, .85); c, d = s.P(13.8, 18.9, .85)
    s.fim.append(f'<g class="hl" data-x="portao"><path d="M{f(a)} {f(b)}L{f(c)} {f(d)}" stroke="{T["ac"]}" stroke-width="10" stroke-linecap="round"/></g><path class="canc" d="M{f(a)} {f(b)}L{f(c)} {f(d)}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>')
    for x, y in ((9.6, 3.6), (9.6, 8), (9.6, 12.4), (14.6, 5.8), (14.6, 10.2), (14.6, 14.6)):
        s.poste(x, y, 3); X, Y = s.P(x, y, 3); s.fim.append(f'<circle class="hl" data-x="ruas" cx="{f(X)}" cy="{f(Y)}" r="8"/>')
    for x, y, e in ((1, 12, .9), (4.4, 17.4, .9), (7.4, 17.2, 1), (1.4, 17.4, 1), (16.6, 17.6, .9), (20, 17.6, 1), (22.5, 17.3, .9), (22.6, 4.6, .8), (22.6, 8.4, .9), (22.6, 12.4, .8), (8.6, 10.6, .8), (8.7, 6.6, .7)): s.arvore(x, y, e)
    s.gente(12.6, 20, T['v2']); s.gente(5, 12.4)
    s.carro(-1, 20.8, 'br', 24, 10, 0); s.carro(22.6, 22.5, 'ac', -24, 12, -5)
    s.marca('port', 9.2, 18.9, .8); s.marca('portao', 12.9, 18.9, .6); s.marca('ruas', 14.6, 10.2, 3); s.marca('bomba', 8.6, 1.7, 5.2); s.marca('lazer', 4.9, 14.6, 0)
    s.salva()


# ---------------------------------------------------------------- empresa
def empresa(tema):
    s = Cena('empresa-' + tema, tema, 24, 24, 1.6, 15)
    T = s.T
    s.rua(0, 20.4, 24, 3.6); s.piso(0, 19.3, 24, 1, '#fff')
    s.piso(19.6, .8, 3.6, 17.8, '#e4ecd0' if tema == 'luz' else '#dbe9e2', .8); s.piso(.8, 17.4, 10, 1.4, '#e4ecd0' if tema == 'luz' else '#dbe9e2', .5); s.piso(12, 17, 4.4, 2.6, '#fff')
    s.faixa(12.4, 20.6, 3.4, 3.2)
    s.cabo([(0, 19.8), (6, 19.8), (6, 16.8)])
    # torre de trás
    o = s.cubo(2, 2, 0, 6.6, 6.6, 11.4) + vidro(s, 2.35, 2, 1.2, 6.25, 6.6, 9.4, 5, 5, 6) + s.cubo(1.9, 1.9, 10.6, 6.8, 6.8, .9) + s.qT(2.4, 2.4, 11.5, 5.8, 5.8, T['g2'], 'opacity=".75"') + s.cubo(3.2, 3.2, 11.5, 2.4, 2, .7, s.ac())
    s.add((2, 2, 0, 6.6, 6.6, 12.2), o)
    # ala esquerda baixa
    o = s.cubo(2, 8.8, 0, 4.8, 7.6, 4.8)
    for z in (.6, 2.1, 3.5): o += ''.join(s.janL(2.35 + i * 1.5, 16.4, z, 1.2, .9) for i in range(3))
    s.add((2, 8.8, 0, 4.8, 7.6, 4.8), o)
    # volume principal, de esquina
    o = s.cubo(6.9, 4, 0, 11.4, 12.4, 2.7)
    o += ''.join(s.janL(7.4 + i * 1.95, 16.4, .5, 1.6, 1.5) for i in range(3)) + s.qL(13.2, 16.4, 0, 2.6, 2.1, T['v2']) + s.qL(13.3, 16.4, .05, 1.15, 1.95, T['vl'], 'opacity=".75"') + s.qL(14.55, 16.4, .05, 1.15, 1.95, T['vl'], 'opacity=".75"')
    o += ''.join(s.janR(18.3, 4.6 + i * 1.95, .5, 1.55, 1.5) for i in range(6))
    o += vidro(s, 6.9, 4, 2.7, 11.4, 12.4, 5, 9, 9, 3)
    o += s.cubo(6.7, 3.8, 7.7, 11.8, 12.8, .75) + s.qT(7.3, 4.4, 8.45, 10.6, 11.6, T['g2'], 'opacity=".75"') + s.qT(12.6, 11.2, 8.45, 4.6, 4.2, T['fo'], 'opacity=".8"') + s.cubo(8.2, 10.6, 8.45, 1.6, 3.6, .6) + s.cubo(9, 6, 8.45, 2.2, 2.2, .8) + s.cubo(12.5, 7, 8.45, 1.5, 3, .6)
    s.add((6.9, 3.8, 0, 11.6, 12.8, 9.2), o)
    s.add((12.6, 16.6, 2.3, 3.8, 1.5, 1.15), s.cubo(12.3, 16.4, 2.3, 4.4, 1.7, 1.2, s.ac()) + s.txL(14.5, 18.1, 2.57, 'Empresa', .98), sombra=False)
    for x, y, e in ((20.6, 2, 1), (21.8, 4.6, 1.1), (20.8, 7.6, 1), (22, 10.4, 1.15), (20.8, 13.4, 1), (22, 16.6, 1), (1.1, 1.2, 1), (1, 6, .9), (1.2, 17.8, .9), (3.8, 18, .8)): s.arvore(x, y, e)
    for x, y in ((7, 18), (8, 18.1), (9, 18), (10, 18.1), (19.2, 17.6), (20.2, 18.1), (20, 5.6), (21, 12), (5.4, 18.2)): s.arbusto(x, y, .5)
    for x in (2.4, 11, 18.4, 23): s.poste(x, 19.7)
    s.gente(13.4, 19); s.gente(17, 19.4, T['v2']); s.gente(9.4, 19.2, T['ac3'])
    s.carro(-1, 20.8, 'br', 24, 9.5, 0); s.carro(22.6, 22.5, 'pr' if tema == 'emp' else 'ac', -24, 12, -5)
    if tema == 'emp': s.wifi(12.4, 10, 11.2, 1.25)
    s.salva()


# ---------------------------------------------------------------- comércio
def toldo(s, x, y, z, w, p, n):
    o = ''
    for i in range(n):
        a = x + i * w / n; c = w / n
        o += s.poly([(a, y, z), (a + c, y, z), (a + c, y + p, z - .6), (a, y + p, z - .6)], '#fff' if i % 2 else s.T['ac'])
        o += s.poly([(a, y + p, z - .6), (a + c, y + p, z - .6), (a + c, y + p, z - .95), (a, y + p, z - .95)], '#f0e6da' if i % 2 else s.T['ac2'])
    return o + s.poly([(x + w, y, z), (x + w, y + p, z - .6), (x + w, y, z - .6)], s.T['ac2'], 'opacity=".5"')


def comercio(tema):
    s = Cena('comercio-' + tema, tema, 23, 20, 6.2, 16)
    T = s.T
    s.rua(0, 16.4, 23, 3.6); s.piso(0, 10, 23, 6.2, '#fff')
    s.faixa(9.2, 16.6, 2.4, 3.2); s.cabo([(0, 15.7), (9.9, 15.7), (9.9, 3)])
    # padaria
    o = s.cubo(1, 2, 0, 8, 8, 5)
    o += s.qL(1.4, 10, .35, 3.1, 2.4, T['pi']) + s.qL(1.5, 10, .45, 2.9, 2.2, T['vl'])
    for z in (.75, 1.5): o += ''.join(f'<ellipse transform="{s.mL(1.9 + i * .56, 10, z)}" rx=".22" ry=".17" fill="{("#d89a50", "#b9702f")[i % 2]}"/>' for i in range(5)) + s.qL(1.5, 10, z - .28, 2.9, .09, T['pi'])
    o += s.qL(4.8, 10, 0, 1.5, 2.75, T['pi']) + s.qL(4.95, 10, .1, 1.2, 2.55, T['vl'], 'opacity=".85"') + s.qL(6.6, 10, .35, 2.1, 2.4, T['pi']) + s.qL(6.7, 10, .45, 1.9, 2.2, T['vl'], 'opacity=".9"')
    o += s.cubo(.8, 9.7, 3.5, 8.4, .5, 1.5, s.ac()) + s.txL(5, 10.2, 3.87, 'Padaria', 1.18)
    o += s.cubo(.85, 1.85, 5, 8.3, 8.3, .3) + s.qT(1.3, 2.3, 5.3, 7.4, 7.4, T['g2'], 'opacity=".75"') + s.cubo(5.6, 4, 5.3, 1.8, 1.8, .6) + s.cubo(3, 4, 5.3, 1, 1, 1.6, s.ac())
    o += s.janR(9, 3, 1, 1.6, 1.4) + s.janR(9, 6, 1, 1.6, 1.4)
    a, b = s.P(3.5, 4.5, 7.1)
    o += ''.join(f'<circle class="fum m{i}" cx="{f(a)}" cy="{f(b)}" r="{6 + i}" fill="#fff"/>' for i in range(3))
    o += toldo(s, 1.1, 10.2, 3.45, 7.8, 1.5, 10)
    s.add((.8, 1.85, 0, 8.4, 9.85, 6.9), o, sombra=False); s.sombra(1, 2, 8, 8, 5.3)
    # restaurante, dois andares com terraço
    o = s.cubo(11, 2, 0, 11, 8, 3.7)
    o += s.qL(11.4, 10, .35, 4, 2.5, T['pi']) + s.qL(11.5, 10, .45, 1.8, 2.3, T['vl'], 'opacity=".9"') + s.qL(13.45, 10, .45, 1.85, 2.3, T['vl'], 'opacity=".9"') + s.qL(15.8, 10, 0, 1.7, 2.85, T['ac2']) + s.qL(16, 10, .2, 1.3, 2.4, T['vl'], 'opacity=".8"') + s.qL(17.9, 10, .35, 3.7, 2.5, T['pi']) + s.qL(18, 10, .45, 1.65, 2.3, T['vl'], 'opacity=".9"') + s.qL(19.8, 10, .45, 1.7, 2.3, T['vl'], 'opacity=".9"')
    o += ''.join(s.janR(22, 2.6 + i * 2.5, .8, 1.8, 1.7) for i in range(3))
    o += s.cubo(10.8, 1.8, 3.7, 11.4, 8.4, .35)
    o += s.cubo(11, 2, 4.05, 11, 4.2, 2.9) + ''.join(s.janL(11.6 + i * 2.1, 6.2, 4.6, 1.5, 1.6) for i in range(5)) + s.janR(22, 2.5, 4.8, 1.3, 1.3) + s.janR(22, 4.4, 4.8, 1.3, 1.3) + s.cubo(10.8, 1.8, 6.95, 11.4, 4.6, .4, s.ac())
    # mesas do terraço e guarda-corpo
    for x in (12.6, 15.4, 18.2, 20.6):
        a, b = s.P(x, 8, 4.05); o += f'<ellipse cx="{f(a)}" cy="{f(b-9)}" rx="11" ry="5.5" fill="#fff"/><path d="M{f(a)} {f(b-7)}v8" stroke="{T["pi"]}" stroke-width="2.4"/><ellipse cx="{f(a-14)}" cy="{f(b-2)}" rx="4.6" ry="2.5" fill="{T["ac3"]}"/><ellipse cx="{f(a+14)}" cy="{f(b-2)}" rx="4.6" ry="2.5" fill="{T["ac3"]}"/>'
    o += s.cubo(10.9, 9.8, 3.1, 11.2, .4, 1.5, s.ac()) + s.txL(16.5, 10.2, 3.5, 'Restaurante', 1.12)
    s.add((10.8, 1.8, 0, 11.4, 8.4, 7.3), o)
    for x, y in ((13, 12.6), (16.4, 13.6), (19.6, 12.6)): s.guarda(x, y)
    # cavalete e vasos
    o = s.poly([(9.9, 11.6, 0), (10.7, 11.6, 0), (10.7, 11.3, 1.4), (9.9, 11.3, 1.4)], T['pi']) + s.poly([(10, 11.56, .2), (10.6, 11.56, .2), (10.6, 11.32, 1.25), (10, 11.32, 1.25)], '#fff')
    s.add((9.9, 11.3, 0, .8, .3, 1.4), o, sombra=False)
    for x, y in ((.8, 12.6), (9.8, 13.4), (22, 11.4)): s.bloco(x - .35, y - .35, 0, .7, .7, .6, s.ac()); s.arbusto(x + .12, y + .5, .5)
    for x, y, e in ((10, 1.2, 1), (10, 4.6, .9), (22.4, 14.6, .9), (6.4, 14.4, .95), (1.8, 14.8, .9)): s.arvore(x, y, e)
    for x in (4, 12.2, 21): s.poste(x, 15.6)
    s.gente(4.8, 13, T['v2']); s.gente(8, 13.4); s.gente(17.8, 15, T['ac3']); s.gente(11.4, 14.6, T['v2'])
    s.carro(-1, 16.8, 'ac', 23, 10, 0); s.carro(21.6, 18.4, 'br', -23, 12, -5)
    if tema == 'emp': s.wifi(5.6, 6.5, 6.9, 1); s.wifi(16.5, 4, 9, 1)
    s.salva()


# ---------------------------------------------------------------- WTTx
def wttx(tema='wtx'):
    s = Cena('wttx', tema, 24, 22, 8, 15)
    T = s.T; g = '#dbe9e2'
    s.piso(.8, .8, 22.4, 17, g, 1); s.rua(0, 18.6, 24, 3.4)
    s.piso(12.6, 11, 9.4, 6, '#fff', .6); s.piso(13, 1.6, 9.4, 7.4, '#e9e4da', .6); s.piso(2, 15, 8, 2.6, '#fff', .5)
    # torre 4G
    tx, ty, th = 5.4, 5, 15
    k = []
    def e(sx, sy, z): r = 1.5 * (1 - z / th) + .25; return (tx + sx * r, ty + sy * r, z)
    for a, b in ((-1, 1), (1, 1), (1, -1)): k.append('M' + s.pt(*e(a, b, 0)) + 'L' + s.pt(*e(a, b, th)))
    zs = [0, 2.6, 5, 7.2, 9.2, 11, 12.6, 14]
    for z0, z1 in zip(zs, zs[1:]):
        for p, q in (((-1, 1), (1, 1)), ((1, 1), (1, -1))):
            k.append('M' + s.pt(*e(*p, z0)) + 'L' + s.pt(*e(*q, z1)) + 'M' + s.pt(*e(*q, z0)) + 'L' + s.pt(*e(*p, z1)) + 'M' + s.pt(*e(*p, z1)) + 'L' + s.pt(*e(*q, z1)))
    o = s.cubo(tx - 2, ty - 2, 0, 4, 4, .5) + f'<path d="{"".join(k[:3])}" stroke="{T["ac"]}" stroke-width="4" stroke-linecap="round"/><path d="{"".join(k[3:])}" stroke="{T["ac3"]}" stroke-width="2"/>'
    for dx, dy in ((-1, .5), (.45, .9), (1, -.6)): o += s.cubo(tx + dx - .2, ty + dy - .2, 12.6, .5, .4, 1.9, ('#fff', '#eef0ff', '#c5cbf0'))
    s.add((tx - 2, ty - 2, 0, 4, 4, 15), o, sombra=False); s.sombra(tx - 1, ty - 1, 2, 2, 12, .5)
    # obra: contêiner, prédio em construção e guindaste
    s.bloco(14, 2, 0, 5, 5, .4)
    for i, z in enumerate((.4, 2.7, 5)):
        o = ''.join(s.cubo(14.2 + a * 2.1, 2.2 + b * 2.1, z, .5, .5, 2) for a in range(3) for b in range(3)) + s.cubo(14, 2, z + 2, 5, 5, .3)
        s.add((14, 2, z, 5, 5, 2.3), o, sombra=i == 0)
    o = s.cubo(13.6, 7.4, 0, 5.8, 2, 2.3, s.ac()) + s.txL(16.5, 9.4, .72, 'Obra', 1.2) + s.qR(19.4, 7.8, .7, 1.1, 1, T['vl'])
    s.add((13.6, 7.4, 0, 5.8, 2, 2.3), o)
    o = s.cubo(20.6, 2, 0, .7, .7, 10.5, (T['ac3'], T['ac3'], T['ac'])) + s.cubo(14.4, 2.1, 10.5, 9, .5, .5, (T['ac3'], T['ac3'], T['ac'])) + s.cubo(22.4, 2, 9.9, .9, .7, .7, s.ac())
    a, b = s.P(16, 2.35, 10.5); o += f'<g class="gru"><path d="M{f(a)} {f(b-30)}v{60}" stroke="{T["ac"]}" stroke-width="2"/><rect x="{f(a-9)}" y="{f(b+28)}" width="18" height="9" rx="2" fill="{T["ac3"]}"/></g>' if 0 else f'<path d="M{f(a)} {f(b)}v22" stroke="{T["ac"]}" stroke-width="2"/><rect x="{f(a-9)}" y="{f(b+22)}" width="18" height="9" rx="2" fill="{T["ac"]}"/>'
    s.add((20.6, 2, 0, .7, .7, 11), o, sombra=False)
    # evento: tenda
    x, y, w, h = 14, 12, 5.6, 2.6
    o = ''.join(s.cubo(a, b, 0, .18, .18, h, ('#fff',) * 3) for a, b in ((x, y), (x + w, y), (x, y + w - 1), ))
    o += s.cubo(x + 1.4, y + 1.4, 0, 2.8, 1.6, .9) + s.cubo(x + w, y + w - 1, 0, .18, .18, h, ('#fff',) * 3)
    ap = (x + w / 2, y + (w - 1) / 2, h + 2.3); c = [(x - .3, y + w - .7), (x + w + .4, y + w - .7), (x + w + .4, y - .3)]
    o += s.poly([(*c[0], h), (*c[1], h), ap], '#fff') + s.poly([(*c[1], h), (*c[2], h), ap], T['r']) + s.poly([(x - .3, y - .3, h), (*c[0], h), ap], '#fff')
    o += s.qL(c[0][0], c[0][1], h - 1.05, w + .7, 1.05, T['ac']) + s.qR(c[1][0], c[2][1], h - 1.05, w - .4, 1.05, T['ac2']) + s.txL(x + w / 2 + .05, c[0][1], h - .83, 'Evento', .95)
    s.add((x - .3, y - .3, 0, w + .7, w - .4, h + 2.3), o)
    # loja
    o = s.cubo(2.4, 10.4, 0, 6.6, 4.6, 4) + s.qL(2.8, 15, .4, 2.6, 2, T['pi']) + s.qL(2.9, 15, .5, 2.4, 1.8, T['vl']) + s.qL(6, 15, 0, 1.3, 2.4, T['ac2']) + s.qL(6.15, 15, .1, 1, 2.2, T['vl'], 'opacity=".8"') + s.qL(7.5, 15, .4, 1.2, 2, T['vl']) + s.janR(9, 11, 1, 1.4, 1.3) + s.janR(9, 13, 1, 1.4, 1.3)
    o += s.cubo(2.2, 14.7, 3, 7, .5, 1.3, s.ac()) + s.txL(5.7, 15.2, 3.28, 'Loja', 1.1) + s.cubo(2.25, 10.25, 4, 6.9, 4.5, .3) + s.qT(2.7, 10.7, 4.3, 6, 3.6, T['g2'], 'opacity=".8"') + toldo(s, 2.5, 15.2, 2.95, 6.4, 1.1, 8)
    s.add((2.2, 10.25, 0, 7, 6.1, 4.3), o)
    ant = s.P(tx, ty, 14.6)
    for i, (q, alt) in enumerate((((5.6, 12.6, 5.2), 40), ((16.5, 8.4, 3.3), 120), ((16.8, 14.2, 5.7), 120))):
        a, b = s.P(*q); mx, my = (ant[0] + a) / 2, min(ant[1], b) - alt * .35
        s.fim.append(f'<path class="arc" d="M{f(ant[0])} {f(ant[1])}Q{f(mx)} {f(my)} {f(a)} {f(b - 14)}"/>')
        s.wifi(*q, .72)
    s.fim.append(f'<circle cx="{f(ant[0])}" cy="{f(ant[1])}" r="6" fill="{T["ac"]}"/>')
    for x, y, e in ((1.6, 1.8, 1.1), (9.6, 2.2, 1.2), (11.2, 4.8, 1), (9.4, 8, 1.1), (1.8, 8.4, 1), (11, 9.6, 1.1), (11, 13, .9), (22.3, 10.4, 1.1), (22.4, 16.6, 1), (1.2, 12.4, .9)): s.arvore(x, y, e)
    s.gente(13.2, 17); s.gente(20.4, 14.8, T['v2']); s.gente(21.2, 16, T['ac3']); s.gente(6.4, 17.2); s.gente(20.6, 8.4, T['ac3'])
    for x in (2, 11.8, 22.6): s.poste(x, 18.2, 3)
    s.carro(-1, 19, 'ac', 24, 10, 0); s.carro(22.6, 20.6, 'br', -24, 12, -5)
    s.salva()


# ---------------------------------------------------------------- uma fachada por tipo de comércio (energia/comercio)
def fachada(tipo, letreiro, tema='luz'):
    s = Cena(f'{tipo}-{tema}', tema, 14, 13.4, 4.4, 24)
    T = s.T; x, y, w, d = 1.4, 1.4, 11, 6.4; yf = y + d; h = 4.9
    s.piso(0, 7.6, 14, 3.2, '#fff'); s.rua(0, 10.8, 14, 2.6); s.cabo([(0, 10.3), (1, 10.3), (1, 7), (1.4, 7)])
    V = T['vl']
    def vit(a, l, z=.4, alt=2.5): return s.qL(a, yf, z, l, alt, T['pi']) + s.qL(a + .1, yf, z + .1, l - .2, alt - .2, V, 'opacity=".92"')
    def porta(a, l=1.4): return s.qL(a, yf, 0, l, 2.5, T['ac2']) + s.qL(a + .12, yf, .12, l - .24, 2.2, '#fff3cf') + s.qL(a + l / 2 - .03, yf, .12, .06, 2.2, T['ac2'])
    def ar(a, b, z):  # condensadora com hélice
        o = s.cubo(a, b, z, 1.5, 1.1, .8); X, Y = s.P(a + .75, b + 1.1, z + .4)
        return o + f'<ellipse cx="{f(X)}" cy="{f(Y)}" rx="7" ry="8" fill="{T["v2"]}" opacity=".55"/><ellipse cx="{f(X)}" cy="{f(Y)}" rx="3" ry="3.5" fill="#fff" opacity=".8"/>'
    def mL(a, z, corpo, yy=None): return f'<g transform="{s.mL(a, yf if yy is None else yy, z)}">{corpo}</g>'
    o = s.cubo(x, y, 0, w, d, h) + ''.join(s.janR(x + w, y + .7 + i * 1.9, .9, 1.2, 1.3) for i in range(3))
    topo = h
    if tipo == 'clinica':
        o = s.cubo(x, y, 0, w, d, 7.2) + ''.join(s.janR(x + w, y + .7 + i * 1.9, z, 1.2, 1.3) for i in range(3) for z in (.9, 5.2)) + ''.join(s.janL(x + .6 + i * 2.1, yf, 5.4, 1.5, 1.2) for i in range(5)); topo = 7.2
    o += s.cubo(x - .15, y - .15, topo, w + .3, d + .3, .3) + s.qT(x + .3, y + .3, topo + .3, w - .6, d - .6, T['g2'], 'opacity=".75"')
    z0 = topo + .3
    fx = s.cubo(x - .1, yf, 3.6, w + .2, .35, 1.35, s.ac()) + s.txL(x + w / 2, yf + .35, 3.97, letreiro, 1.05)
    if tipo == 'padaria':
        o += vit(1.9, 4) + porta(6.3) + vit(8.2, 3.7)
        for z in (.75, 1.45): o += s.qL(2, yf, z - .22, 3.8, .08, T['pi']) + ''.join(f'<ellipse transform="{s.mL(2.35 + i * .62, yf, z)}" rx=".24" ry=".18" fill="{("#d89a50", "#b9702f")[i % 2]}"/>' for i in range(6))
        o += ''.join(f'<path transform="{s.mL(8.7 + i * .7, yf, .6)}" d="M0 0L.12 -1.2" stroke="#c98a45" stroke-width=".22" stroke-linecap="round"/>' for i in range(5))
        o += s.cubo(3.4, 3, z0, 1, 1, 1.6, s.ac()) + ar(8, 3.4, z0)
        a, b = s.P(3.9, 3.5, z0 + 1.7); o += ''.join(f'<circle class="fum m{i}" cx="{f(a)}" cy="{f(b)}" r="{8 + i}" fill="#fff"/>' for i in range(3))
        o += fx + toldo(s, x + .1, yf + .35, 3.6, w - .2, .75, 12)
    elif tipo == 'restaurante':
        o += vit(1.9, 3.8) + porta(6.2) + vit(8.1, 3.9)
        o += s.cubo(x, y, z0, w, 2.6, 2.4) + ''.join(s.janL(x + .6 + i * 2.1, y + 2.6, z0 + .5, 1.5, 1.3) for i in range(5)) + s.cubo(x - .15, y - .15, z0 + 2.4, w + .3, 2.9, .35, s.ac()) + s.cubo(9.6, 2, z0 + 2.75, .9, .9, 1.2)
        a, b = s.P(10.05, 2.45, z0 + 4); o += ''.join(f'<circle class="fum m{i}" cx="{f(a)}" cy="{f(b)}" r="{8 + i}" fill="#fff"/>' for i in range(3))
        for mx in (2.9, 5.6, 8.3, 11):
            a, b = s.P(mx, 5.6, z0); o += f'<path d="M{f(a)} {f(b)}v-9" stroke="{T["pi"]}" stroke-width="3"/><ellipse cx="{f(a)}" cy="{f(b-12)}" rx="14" ry="7" fill="#fff"/><ellipse cx="{f(a-20)}" cy="{f(b-2)}" rx="6" ry="3.2" fill="{T["ac3"]}"/><ellipse cx="{f(a+20)}" cy="{f(b-2)}" rx="6" ry="3.2" fill="{T["ac3"]}"/>'
        o += fx
        for gx in (2.6, 5.4, 9.4): s.guarda(gx, 9.2)
    elif tipo == 'mercado':
        o += vit(1.9, 3.2) + s.qL(5.5, yf, 0, 2.9, 2.55, T['ac2']) + s.qL(5.65, yf, .1, 1.25, 2.3, '#fff3cf') + s.qL(7, yf, .1, 1.25, 2.3, '#fff3cf') + vit(8.8, 3.2)
        cores = ('#e2700f', '#86a866', '#ffd873', '#c98a4e')
        for a0, l in ((2.1, 2.8), (9, 2.8)):
            for z in (.6, 1.15, 1.7): o += s.qL(a0, yf, z - .07, l, .07, T['pi']) + ''.join(s.qL(a0 + .05 + i * .4, yf, z, .3, .34, cores[(i + int(z * 3)) % 4]) for i in range(7))
        o += ar(3, 2.4, z0) + ar(6, 2.4, z0) + ar(9, 2.4, z0) + fx
        for i in range(3):  # bancas de frutas
            bx = 1.9 + i * 1.25; c = cores[i]
            b0 = s.cubo(bx, 8.3, 0, 1.1, .9, .7, (T['l'], T['g2'], T['g3'])) + ''.join(f'<circle cx="{f(s.P(bx + .25 + (k % 3) * .3, 8.55 + (k // 3) * .38, .78)[0])}" cy="{f(s.P(bx + .25 + (k % 3) * .3, 8.55 + (k // 3) * .38, .78)[1])}" r="5.4" fill="{c}"/>' for k in range(6))
            s.add((bx, 8.3, 0, 1.1, .9, .9), b0)
        for i in range(4):  # carrinhos
            cx = 9.4 + i * .75; a, b = s.P(cx, 9.2, .4)
            s.add((cx, 9, 0, .5, .7, 1.1), f'<path d="M{f(a-11)} {f(b-18)}h5l5 15h14l4 -13h-21" fill="none" stroke="{T["ac2"]}" stroke-width="2.6" stroke-linejoin="round"/><circle cx="{f(a+1)}" cy="{f(b+4)}" r="2.6" fill="{T["pi"]}"/><circle cx="{f(a+12)}" cy="{f(b+4)}" r="2.6" fill="{T["pi"]}"/>', sombra=False)
    elif tipo == 'salao':
        o += vit(1.9, 4.2) + porta(6.5) + vit(8.4, 3.5)
        for a0 in (2.5, 4, 8.9, 10.4):
            o += mL(a0, .5, f'<circle cx=".5" cy="-1.15" r=".42" fill="#fff"/><circle cx=".5" cy="-1.15" r=".42" fill="none" stroke="{T["ac"]}" stroke-width=".1"/><rect x=".15" y="-.5" width=".7" height=".42" rx=".12" fill="{T["ac2"]}"/><path d="M.5 -.1v.15" stroke="{T["ac2"]}" stroke-width=".12"/>')
        o += ar(3, 2.6, z0) + s.cubo(8.4, 2.4, z0, 2.4, 1, 1.1, s.ac()) + fx + toldo(s, 1.8, yf + .35, 3.6, 4.4, .75, 6) + toldo(s, 8.3, yf + .35, 3.6, 3.7, .75, 6)
        X, Y = s.P(x + w + .1, yf + .5, 0)
        s.add((x + w - .1, yf + .4, 0, .3, .3, 2.2), f'<clipPath id="{s.n}bb"><rect x="{f(X-8)}" y="{f(Y-52)}" width="16" height="42" rx="7"/></clipPath><path d="M{f(X)} {f(Y)}v-12" stroke="{T["pi"]}" stroke-width="4"/><g clip-path="url(#{s.n}bb)"><rect x="{f(X-8)}" y="{f(Y-52)}" width="16" height="42" fill="#fff"/><g class="barb">' + ''.join(f'<path d="M{f(X-10)} {f(Y-74+k*14)}l20 -10v6l-20 10z" fill="{T["ac"]}"/>' for k in range(8)) + f'</g></g><circle cx="{f(X)}" cy="{f(Y-54)}" r="6" fill="{T["ac2"]}"/>', sombra=False)
    elif tipo == 'clinica':
        o += vit(1.9, 3.6) + porta(6, 1.8) + vit(8.4, 3.5)
        o += ar(2.6, 2.6, z0) + ar(5, 2.6, z0) + s.cubo(9, 2.6, z0, 2, 2, 1.1)
        o += fx + mL(x + .85, 3.9, f'<path d="M.3 0v-.76M-.08 -.38h.76" stroke="#fff" stroke-width=".28" stroke-linecap="round"/>', yf + .35)
        o += mL(2.5, .6, f'<path d="M0 -.9h.4l.25 -.5.4 1 .3 -.5h1" fill="none" stroke="{T["ac"]}" stroke-width=".14" stroke-linejoin="round"/>')
        s.add((5.6, yf + .35, 2.5, 2.6, 1.1, .25), s.cubo(5.6, yf + .35, 2.5, 2.6, 1.1, .22), sombra=False)
        s.bloco(9.2, 9, 0, 2.4, .6, .35, s.ac()); s.bloco(2.4, 9, 0, 2.4, .6, .35, s.ac())
    else:  # loja
        o += vit(1.9, 4.2) + porta(6.4) + vit(8.3, 3.7)
        for k, a0 in enumerate((2.5, 3.6, 4.7, 8.8, 9.9, 11)):
            c = (T['ac'], '#86a866', T['ac2'])[k % 3]
            o += mL(a0, .5, f'<circle cx=".3" cy="-1.42" r=".18" fill="#e9b994"/><path d="M.3 -1.25L.62 -1.1.5 -.65 .72 0H-.12L.1 -.65 -.02 -1.1z" fill="{c}"/>')
        o += ar(3, 2.6, z0) + s.cubo(8.6, 2.6, z0, 1.6, 1.6, .7) + fx + toldo(s, x + .1, yf + .35, 3.6, w - .2, .75, 10)
    alt = z0 + (3.9 if tipo == 'restaurante' else 1.7)
    s.add((x - .15, y - .15, 0, w + .3, d + 1.4 if tipo in ('padaria', 'salao', 'loja') else d + .6, alt), o, sombra=False); s.sombra(x, y, w, d, topo)
    for a, b in ((.9, 9.2),): s.bloco(a - .35, b - .35, 0, .7, .7, .6, s.ac()); s.arbusto(a + .1, b + .5, .5)
    s.arvore(13.2, 3, .85)
    if tipo != 'restaurante': s.arvore(13.2, 8.6, .8)
    s.gente(6.9, 9.4); s.gente(8.6, 9.9, T['v2']);
    if tipo in ('mercado', 'loja', 'restaurante'): s.gente(12, 10, T['ac3'])
    s.poste(.6, 10.2, 3); s.poste(11.8, 10.3, 3)
    s.carro(-1, 11.1, 'br', 13, 7.5, 0)
    s.salva()


# ---------------------------------------------------------------- matriz, filial e galpão (energia/empresas)
def unidades(tema='luz'):
    s = Cena('unidades-' + tema, tema, 31, 15.5, 7, 15)
    T = s.T
    s.rua(0, 12.2, 31, 3.3); s.piso(0, 10.6, 31, 1.4, '#fff'); s.faixa(3.6, 12.4, 2.4, 3); s.faixa(13.6, 12.4, 2.4, 3)
    s.cabo([(0, 11.3), (30.4, 11.3)], 1.8)
    for x in (4.8, 14.8, 25): s.cabo([(x, 11.3), (x, 9.8)])
    # matriz
    o = s.cubo(1.2, 2, 0, 7.4, 7.6, 2.2) + ''.join(s.janL(1.6 + i * 1.5, 9.6, .5, 1.1, 1.2) for i in (0, 3)) + s.qL(4.2, 9.6, 0, 1.6, 1.8, T['vl']) + ''.join(s.janR(8.6, 2.5 + i * 1.8, .5, 1.3, 1.2) for i in range(4))
    o += vidro(s, 1.2, 2, 2.2, 7.4, 7.6, 9.6, 5, 5, 6) + s.cubo(1, 1.8, 11.8, 7.8, 8, .6) + s.qT(1.5, 2.3, 12.4, 6.8, 7, T['g2'], 'opacity=".75"') + s.cubo(3, 4, 12.4, 2.4, 2.4, .9, s.ac())
    o += s.cubo(1.6, 9.6, 2.1, 6.6, .4, 1.5, s.ac()) + s.txL(4.9, 10, 2.45, 'Matriz', 1.15)
    s.add((1, 1.8, 0, 7.8, 8.2, 13.3), o)
    # filial
    o = s.cubo(11, 3, 0, 8, 6.6, 5.6) + ''.join(s.janL(11.6 + i * 1.9, 9.6, 3.9, 1.3, 1.1) for i in range(4)) + s.qL(11.5, 9.6, .4, 2.6, 1.8, T['pi']) + s.qL(11.6, 9.6, .5, 2.4, 1.6, T['vl']) + s.qL(14.4, 9.6, 0, 1.4, 2.1, T['ac2']) + s.qL(14.55, 9.6, .1, 1.1, 1.85, '#fff3cf') + s.qL(16.2, 9.6, .4, 2.4, 1.8, T['pi']) + s.qL(16.3, 9.6, .5, 2.2, 1.6, T['vl']) + ''.join(s.janR(19, 3.6 + i * 2, z, 1.3, 1.1) for i in range(3) for z in (.7, 3.9))
    o += s.cubo(10.8, 2.8, 5.6, 8.4, 7, .35) + s.qT(11.3, 3.3, 5.95, 7.4, 6, T['g2'], 'opacity=".75"') + s.cubo(13, 4.6, 5.95, 1.8, 1.4, .7) + s.cubo(10.9, 9.6, 2.35, 8.2, .4, 1.3, s.ac()) + s.txL(15, 10, 2.67, 'Filial', 1.05)
    s.add((10.8, 2.8, 0, 8.4, 7.2, 6.7), o)
    # galpão de duas águas, com a empena na frente
    x, y, w, d, h, b = 21.2, 2, 8.4, 7.6, 4.6, 1.7; yf = y + d; m = x + w / 2
    o = s.cubo(x, y, 0, w, d, h) + s.poly([(x, yf, h), (x + w, yf, h), (m, yf, h + b)], T['l'])
    o += s.poly([(m, y - .2, h + b), (m, yf + .25, h + b), (x + w + .3, yf + .25, h - .12), (x + w + .3, y - .2, h - .12)], T['ac']) + s.poly([(m, y - .2, h + b), (m, yf + .25, h + b), (x - .3, yf + .25, h - .12), (x - .3, y - .2, h - .12)], T['ac3'])
    o += ''.join(f'<path d="M{s.pt(m + (w/2+.3)*k/6, yf+.25, h+b-(b+.12)*k/6)}L{s.pt(m + (w/2+.3)*k/6, y-.2, h+b-(b+.12)*k/6)}" stroke="#fff" opacity=".35" stroke-width="1.4"/>' for k in range(1, 6))
    for k in range(2):
        a = x + .7 + k * 3.8; o += s.qL(a, yf, 0, 3.1, 2.6, T['pi']) + ''.join(s.qL(a + .12, yf, .12 + i * .42, 2.86, .28, '#fff', 'opacity=".85"') for i in range(6))
    o += s.qL(x + 1.2, yf, 3.1, w - 2.4, 1.4, T['ac']) + s.txL(m, yf, 3.43, 'Galpão', 1.1) + ''.join(s.janR(x + w, y + .6 + i * 2.3, 2.6, 1.6, .9) for i in range(3))
    s.add((x - .3, y - .2, 0, w + .6, d + .45, h + b), o)
    for a, b2, e in ((9.8, 3, 1), (9.9, 8.6, .9), (20.1, 4, .9), (20.2, 9.4, .8), (30.4, 4, .9), (30.4, 8, .8)): s.arvore(a, b2, e)
    for a in (2, 10, 19.6, 29.6): s.poste(a, 11.8)
    s.gente(6.4, 10.9); s.gente(16.8, 11, T['v2']); s.gente(12, 11.3, T['ac3'])
    s.carro(-1, 12.5, 'ac', 30, 11, 0); s.carro(29.6, 14.1, 'br', -30, 13, -5)
    for i, (q, w2) in enumerate((((4.9, 5.8, 14.8), 0), ((15, 6.2, 8.4), 0), ((25.4, 5.8, 8), 0))):
        a, b = s.P(*q); s.topo = min(s.topo, b - 24)
        s.fim.append(f'<g class="mk un" data-x-u="{i}"><path d="M{f(a-8)} {f(b+13)}L{f(a)} {f(b+26)}L{f(a+8)} {f(b+13)}z"/><circle class="mk0" cx="{f(a)}" cy="{f(b)}" r="12"/><circle class="mk1" cx="{f(a)}" cy="{f(b)}" r="17"/><text x="{f(a)}" y="{f(b+7)}" font-size="20" text-anchor="middle">{i+1}</text></g>')
    s.salva()


# ---------------------------------------------------------------- o caminho da energia (topo e seção de /energia)
def rede(usina, tema='luz'):
    s = Cena(f'rede-{usina}', tema, 29, 21, 7, 14.2)
    s.dobra = (10, 5, 12.5, 1)
    T = s.T; V = T['vl']
    ilhas = [(0, 0, 10.5, 8), (14, 0, 9, 8), (0, 12, 25, 9)]
    pulsos = {1: [], 2: [], 3: []}
    def fio(n, *ps, q=.9):
        d = 'M' + s.pt(*ps[0]); u = s.P(*ps[0])
        for k in ps[1:]:
            a, b = s.P(*k); d += f'Q{f((u[0] + a) / 2)} {f((u[1] + b) / 2 + q * 13)} {f(a)} {f(b)}'; u = (a, b)
        s.fim.append(f'<path class="fio" d="{d}"/>'); pulsos[n].append(f'<path class="pul" d="{d}"/>')
    def torreao(x, y, h):
        a, b = s.P(x, y); z = h * s.S; L = 11
        o = f'<path d="M{f(a-L)} {f(b)}L{f(a)} {f(b-z)}L{f(a+L)} {f(b)}M{f(a-L*.72)} {f(b-z*.28)}L{f(a+L*.46)} {f(b-z*.54)}M{f(a+L*.72)} {f(b-z*.28)}L{f(a-L*.46)} {f(b-z*.54)}M{f(a-L*.72)} {f(b-z*.28)}h{f(L*1.44)}M{f(a-L*.46)} {f(b-z*.54)}h{f(L*.92)}" fill="none" stroke="{T["v2"]}" stroke-width="2.2" stroke-linejoin="round"/><path d="M{f(a-16)} {f(b-z*.8)}h32M{f(a-11)} {f(b-z)}h22" stroke="{T["v2"]}" stroke-width="3.2" stroke-linecap="round"/>'
        s.add((x - .3, y - .3, 0, .6, .6, h), o, sombra=False); return (x, y, h)
    def pau(x, y, h=4.2):
        a, b = s.P(x, y); z = h * s.S
        s.add((x - .1, y - .1, 0, .2, .2, h), f'<path d="M{f(a)} {f(b)}v{f(-z)}" stroke="{T["pi"]}" stroke-width="3.4" stroke-linecap="round"/><path d="M{f(a-9)} {f(b-z+5)}l18 -6" stroke="{T["pi"]}" stroke-width="3" stroke-linecap="round"/>', sombra=False); return (x, y, h - .1)
    def placa(cl, x, y, z, t, cor, extra=''):
        a, b = s.P(x, y, z); w = len(t) * 10.4 + 26; s.topo = min(s.topo, b - 34)
        s.fim.append(f'<g class="pla {cl}"{extra}><path d="M{f(a-7)} {f(b-9)}L{f(a)} {f(b)}L{f(a+7)} {f(b-9)}z" fill="{cor}"/><rect x="{f(a-w/2)}" y="{f(b-38)}" width="{f(w)}" height="31" rx="15.5" fill="{cor}"/><text x="{f(a)}" y="{f(b-16)}" font-size="18.5" text-anchor="middle" fill="#fff">{t}</text></g>')
    def placa2(cl, x, t, cor, extra=''):
        a, b = s.P(x, 20.6, 0); w = len(t) * 10.4 + 26
        s.fim.append(f'<g class="pla {cl}"{extra}><path d="M{f(a-7)} {f(b+9)}L{f(a)} {f(b)}L{f(a+7)} {f(b+9)}z" fill="{cor}"/><rect x="{f(a-w/2)}" y="{f(b+7)}" width="{f(w)}" height="31" rx="15.5" fill="{cor}"/><text x="{f(a)}" y="{f(b+29)}" font-size="18.5" text-anchor="middle" fill="#fff">{t}</text></g>')
    # usina
    if usina == 'solar':
        s.piso(.5, .5, 9.5, 7, '#e4ecd0', .6)
        for l in range(3):
            for c in range(3):
                x, y = .9 + c * 2.95, .7 + l * 2.2
                q = [(x, y, 1.55), (x + 2.6, y, 1.55), (x + 2.6, y + 1.5, .45), (x, y + 1.5, .45)]
                o = s.poly([(x + 2.6, y, 1.55), (x + 2.6, y + 1.5, .45), (x + 2.6, y, 0)], T['g3'], 'opacity=".55"') + ''.join(f'<path d="M{s.pt(k, y + 1.4, .5)}L{s.pt(k, y + 1.4)}" stroke="{T["pi"]}" stroke-width="2"/>' for k in (x + .4, x + 2.2))
                o += s.poly(q, f'url(#{s.n}pv)', 'stroke="#fff" stroke-width="1.6" stroke-linejoin="round"')
                ln = ''.join(f'M{s.pt(x + 2.6*k/4, y, 1.55)}L{s.pt(x + 2.6*k/4, y + 1.5, .45)}' for k in (1, 2, 3)) + f'M{s.pt(x, y + .75, 1)}L{s.pt(x + 2.6, y + .75, 1)}'
                o += f'<path d="{ln}" stroke="#bfe0f5" stroke-width="1" opacity=".8"/>'
                s.k += 1; i = f'{s.n}c{s.k}'; s.som_c.append(f'<clipPath id="{i}">{s.poly(q, "#000")}</clipPath>')
                o += f'<g clip-path="url(#{i})"><g class="ref" style="animation-duration:3.6s;animation-delay:{l * .25 + c * .15:.2f}s">{s.poly([(x, y, 1.55), (x + 1, y, 1.55), (x + 1, y + 1.5, .45), (x, y + 1.5, .45)], "#fff", "opacity=%s.55%s" % (chr(34), chr(34)))}</g></g>'
                s.add((x, y, 0, 2.6, 1.5, 1.55), o, sombra=False); s.sombra(x, y, 2.6, 1.5, .9)
        s.som_c.append(f'<linearGradient id="{s.n}pv" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4f86bd"/><stop offset="1" stop-color="#1c3f6b"/></linearGradient>')
        X, Y = s.P(-2.6, 7.2, 9.4); s.topo = min(s.topo, Y - 64)
        feixe = ''.join(f'<path class="raio" style="animation-delay:-{k * .8}s" d="M{f(X)} {f(Y)}L{s.pt(*a)}L{s.pt(*b)}z" fill="#ffc463"/>' for k, (a, b) in enumerate((((.9, 2.2, .5), (3.5, .7, 1.5)), ((3.6, 4.4, .5), (6.6, 2.9, 1.5)), ((6.4, 6.6, .5), (9.4, 5.1, 1.5)))))
        s.fim.append(f'<g class="so1">{feixe}</g><circle cx="{f(X)}" cy="{f(Y)}" r="58" fill="#ffc463" opacity=".28"/><g class="sol">' + ''.join(f'<path transform="rotate({k*45} {f(X)} {f(Y)})" d="M{f(X)} {f(Y-40)}v-11" stroke="#ff9c2e" stroke-width="6" stroke-linecap="round"/>' for k in range(8)) + f'</g><circle cx="{f(X)}" cy="{f(Y)}" r="30" fill="#ff9c2e"/><circle cx="{f(X-7)}" cy="{f(Y-8)}" r="14" fill="#ffc463" opacity=".7"/>')
        s.bloco(9.6, 6.2, 0, .7, 1.1, 1.1, s.ac())
        placa('pl1', 5, 3, 3, 'Fazenda solar', T['ac2'])
    else:
        az = '#8fd3ea'
        o = s.cubo(.4, .3, 0, 9.6, 3.3, 3.2, (az, T['fo'], T['fo2'])) + ''.join(f'<path transform="{s.mT(1 + (k % 3) * 2.8, .9 + k * .42, 3.2)}" d="M0 0q.4-.28.8 0t.8 0 .8 0" fill="none" stroke="#fff" stroke-width=".13" class="onda o{k % 3}"/>' for k in range(6))
        s.add((.4, .3, 0, 9.6, 3.3, 3.2), o)
        o = s.cubo(.2, 3.6, 0, 10, 1, 3.8) + s.poly([(.2, 4.6, 3.1), (10.2, 4.6, 3.1), (10.2, 6, 0), (.2, 6, 0)], T['l']) + s.poly([(10.2, 4.6, 3.1), (10.2, 6, 0), (10.2, 4.6, 0)], T['r'])
        for k in range(3):
            x = .9 + k * 2
            q = [(x, 4.6, 3.1), (x + 1.3, 4.6, 3.1), (x + 1.3, 6, 0), (x, 6, 0)]
            o += s.poly(q, az) + ''.join(f'<path class="agua" style="animation-delay:-{m * .3}s" d="M{s.pt(x + .25 + m * .4, 4.6, 3.1)}L{s.pt(x + .25 + m * .4, 6, 0)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' for m in range(3))
        s.add((.2, 3.6, 0, 10, 2.4, 3.8), o)
        s.piso(0, 6, 7.6, 2, az); s.chao.append(''.join(f'<path transform="{s.mT(.6 + k * 1.9, 6.6 + (k % 2) * .7)}" d="M0 0q.4-.28.8 0t.8 0" fill="none" stroke="#fff" stroke-width=".14" class="onda o{k % 3}"/>' for k in range(4)))
        s.bloco(7.7, 5.9, 0, 2.4, 1.7, 1.7, None, s.janL(8, 7.6, .5, .8, .7) + s.janL(9.1, 7.6, .5, .8, .7) + s.cubo(7.6, 5.8, 1.7, 2.6, 1.9, .3, s.ac()))
        placa('pl1', 4.6, 3, 4.4, 'Hidrelétrica', T['ac2'])
    # distribuidora
    s.piso(14.4, .4, 8.2, 7.2, '#fff', .5)
    s.bloco(14.8, 4.6, 0, 3.6, 2.6, 2.2, None, s.janL(15.1, 7.2, .6, .9, .9) + s.janL(16.3, 7.2, .6, .9, .9) + s.qL(17.4, 7.2, 0, .7, 1.5, T['ac2']) + s.janR(18.4, 5.1, .6, 1.4, .9) + s.cubo(14.6, 4.4, 2.2, 4, 3, .35, s.ac()))
    for x, y in ((18.4, 1.2), (20.6, 1.2), (20.2, 4.4)):
        o = s.cubo(x, y, 0, 1.4, 1.5, 1.5, (T['g1'], T['ac3'], T['ac'])) + ''.join(f'<path d="M{s.pt(x + .35 + k * .35, y + .75, 1.5)}v-13" stroke="{T["pi"]}" stroke-width="4.4" stroke-dasharray="2.4 1.4"/>' for k in range(3))
        s.add((x, y, 0, 1.4, 1.5, 2.2), o)
    t1, t2, t3 = torreao(10, 4.6 if usina == 'solar' else 5.1, 5), torreao(15.4, 2, 5.4), torreao(21.8, 6.4, 4.8)
    fio(1, (9.9, 6.6, 1.1) if usina == 'solar' else (9, 6.6, 1.9), t1, t2, (19, 2, 2.1), q=1)
    fio(2, (20.8, 5, 2.1), t3, q=.3)
    placa('pl3', 17.6, 4, 4.6, 'Distribuidora', T['ac2'])
    if usina == 'solar': placa('cre', 17.6, 4, 7.1, '+ créditos para você', '#0b6b41')
    # cidade
    s.rua(0, 18.9, 25, 2.1); s.piso(0, 17.7, 25, 1.1, '#fff')
    # casa
    x, y, w, d, h, b = 1.6, 13.6, 4, 3.4, 2.5, 1.6; yf = y + d; m = x + w / 2
    o = s.cubo(x, y, 0, w, d, h) + s.poly([(x, yf, h), (x + w, yf, h), (m, yf, h + b)], T['l']) + s.qL(x + .5, yf, 0, 1, 1.8, T['ac2']) + s.janL(x + 2.1, yf, .8, 1.3, 1) + s.janR(x + w, y + 1, .8, 1.3, 1)
    o += s.poly([(m, y - .2, h + b), (m, yf + .25, h + b), (x + w + .3, yf + .25, h - .15), (x + w + .3, y - .2, h - .15)], T['ac']) + s.poly([(m, y - .2, h + b), (m, yf + .25, h + b), (x - .3, yf + .25, h - .15), (x - .3, y - .2, h - .15)], T['ac3'])
    s.add((x - .3, y - .2, 0, w + .6, d + .45, h + b), o)
    # condomínio
    o, hc = torre(s, 7.4, 13.4, 3.8, 3.6, 4, 1.35, 1.5); s.add((7.4, 13.4, 0, 4.4, 3.6, hc), o + s.qL(8.8, 17, 0, 1, 1.3, T['ac2']))
    # comércio
    o = s.cubo(13, 13.4, 0, 4.8, 3.6, 3.3) + s.qL(13.3, 17, .3, 1.5, 1.7, V) + s.qL(15, 17, 0, .9, 1.9, T['ac2']) + s.qL(16.1, 17, .3, 1.5, 1.7, V) + s.janR(17.8, 14.2, .7, 1.6, 1.2) + s.cubo(12.9, 13.3, 3.3, 5, 3.9, .3, s.ac()) + toldo(s, 13.1, 17, 2.75, 4.6, .8, 7)
    s.add((12.9, 13.3, 0, 5, 4.6, 3.6), o)
    # empresa
    o = s.cubo(19.4, 13.2, 0, 4, 3.8, 1.5) + s.qL(20.9, 17, 0, 1, 1.25, V) + vidro(s, 19.4, 13.2, 1.5, 4, 3.8, 4.4, 4, 4, 4) + s.cubo(19.25, 13.05, 5.9, 4.3, 4.1, .35)
    s.add((19.25, 13.05, 0, 4.3, 4.1, 6.3), o)
    ps = [pau(24.3, 12.6), pau(24.3, 18.2), pau(18.6, 18.2), pau(12.2, 18.2), pau(6.5, 18.2), pau(.8, 18.2)]
    fio(2, t3, ps[0], ps[1], q=.5)
    fio(2, *ps[1:], q=.6)
    dest = (('Casa', (3.6, 15.3, 4.3), ps[4], (4.6, 17, 2.3)), ('Condomínio', (9.2, 15.2, hc + .1), ps[3], (10.6, 17, 3)), ('Comércio', (15.4, 15.2, 3.8), ps[2], (17.3, 17, 2.9)), ('Empresa', (21.4, 15.1, 6.4), ps[1], (22.6, 17, 3.6)))
    for k, (nome, q, po, en) in enumerate(dest):
        fio(3, po, en, q=.4)
    for k, (nome, q, po, en) in enumerate(dest):
        placa2('des', q[0], nome, T['ac'], f' style="--d:{k * .55:.2f}s"')
        if usina == 'solar': placa2('men', q[0], 'Conta menor', '#0b6b41', f' style="--d:{k * .25:.2f}s"')
    for k in (1, 2, 3): s.fim.append(f'<g class="l{k}">{"".join(pulsos[k])}</g>')
    s.fim.sort(key=lambda z: z.startswith('<g class="pla'))
    for x, y, e in ((6.5, 14, .8), (12, 14, .7), (18.6, 14, .7), (.8, 15.4, .7), (19.4, 6.9, .6)): s.arvore(x, y, e)
    s.gente(8, 18.2, T['v2']); s.gente(16.2, 18.3)
    # carro por baixo das placas
    fim, s.fim = s.fim, []
    s.carro(-1, 19.3, 'br', 24, 11, 0); s.fim += fim
    s.salva(ilhas)


predio('luz'); condominio('luz'); empresa('luz'); comercio('luz'); empresa('emp'); comercio('emp'); wttx()
for t, n in (('padaria', 'Padaria'), ('restaurante', 'Restaurante'), ('mercado', 'Mercado'), ('salao', 'Salão'), ('clinica', 'Clínica'), ('loja', 'Loja')): fachada(t, n)
unidades()
rede('solar'); rede('hidro')
