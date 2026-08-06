'use client'

import { useReducedMotion } from 'motion/react'
import type { JSX, ReactNode } from 'react'
import { useEffect, useRef } from 'react'

/**
 * Cursor-reactive "liquid text" effect (WebGL, zero external dependency).
 *
 * Wraps arbitrary children and, on capable clients, finds every display heading inside (h1–h3),
 * rasterizes each to a texture, and drives a fragment shader that ripples the glyphs away from the
 * pointer and lets them settle back — an in-house equivalent of the proprietary Framer "liquid text"
 * effect. Built to sit around a CMS RichText heading: it targets heading elements only, leaving
 * paragraphs untouched, and handles a multi-heading title (one canvas per heading).
 *
 * The effect is movement-driven and local: energy for a given line only builds while the pointer is
 * over that line, and decays to zero once you stop — so the text is perfectly still at rest and each
 * line reacts independently. The subtle idle flow is gated by that same energy, so nothing moves
 * unless you're interacting with it.
 *
 * Accessibility preserved: the real heading text stays in the DOM (selectable, SEO-indexable,
 * screen-reader-readable). When the effect is live the glyphs are hidden with `color: transparent`
 * (not display/visibility), so the text stays in the accessibility tree; each overlay <canvas> is a
 * decorative aria-hidden child of its heading. Falls back to untouched text under
 * prefers-reduced-motion, when WebGL is unavailable, or if anything throws. GL resources are freed
 * on resize-rebuild and unmount.
 */

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_amp;      // 0..1 presence of the pointer over THIS line; 0 = still
uniform vec2 u_mouse;     // smoothed pointer position, texture space, (0,0) = top-left
uniform float u_aspect;   // width / height, so the influence region is circular in screen pixels

// Radius of the deformation, in height-units — kept small so only the glyphs directly under the
// cursor move, not the whole line.
const float RADIUS = 0.55;

void main() {
  vec2 uv = v_uv;

  // Local Gaussian bump centred on the pointer, measured in aspect-corrected space so the
  // influence region is a true circle on screen (radial, not stretched along the line).
  vec2 toM = uv - u_mouse;
  vec2 scaled = vec2(toM.x * u_aspect, toM.y);
  float d = length(scaled);
  float influence = exp(-(d * d) / (RADIUS * RADIUS));

  // Smooth radial push away from the pointer. centerFade takes the displacement to zero at the
  // exact cursor core, where the direction vector flips — that flip was the "infinity" artifact.
  // No travelling wave: just a clean liquid bulge that follows the cursor.
  float centerFade = smoothstep(0.0, 0.22, d);
  vec2 dir = scaled / max(d, 1e-4);
  vec2 perp = vec2(-dir.y, dir.x); // tangential component — curls the glyphs instead of magnifying
  // Mostly swirl with a little outward push, plus a slow rotation of the curl over time: reads as
  // liquid smearing around the cursor rather than a zoom lens.
  float curlSign = sin(u_time * 0.7) > 0.0 ? 1.0 : -1.0;
  vec2 push = (dir * 0.35 + perp * curlSign * 0.85) * influence * centerFade * u_amp * 0.05;
  push.x /= u_aspect; // back to uv space so the on-screen push is radially uniform

  gl_FragColor = texture2D(u_tex, uv - push);
}`

function createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/** Greedy word-wrap `text` to `maxWidth` under the already-set `ctx.font`. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (current && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

/** Rasterize a heading's text into a canvas matched to its box, font, colour, and wrapping. */
function paintHeading(heading: HTMLElement, width: number, height: number, dpr: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * dpr)
  canvas.height = Math.ceil(height * dpr)
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const cs = getComputedStyle(heading)
  const fontSize = parseFloat(cs.fontSize) || 32
  let lineHeight = parseFloat(cs.lineHeight)
  if (!Number.isFinite(lineHeight)) lineHeight = fontSize * 1.15

  // Once the effect is live the heading's own colour is transparent; fall back to cream then.
  ctx.fillStyle = cs.color && cs.color !== 'rgba(0, 0, 0, 0)' ? cs.color : '#F4F3EC'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`
  // Honor the heading's CSS letter-spacing (ctx.font ignores it). Without this the canvas measures
  // lines wider than the real text and can wrap where the DOM doesn't — a near-fit title then
  // renders garbled. Supported in Chromium/modern engines; harmless where not.
  if (cs.letterSpacing && cs.letterSpacing !== 'normal') {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing
  }

  const text = (heading.innerText || heading.textContent || '').trim()

  // The DOM's line count is authoritative — the heading's box was sized by the browser's own
  // line-breaking. Our canvas re-wrap (ctx.measureText) can disagree by a sub-pixel at a wrap
  // boundary and split into MORE lines than the box holds; the vertical-centre math below would
  // then push `blockTop` negative and paint glyphs above the box, bleeding into the heading above
  // (visible as overlapping title lines at certain widths/zoom). Widen the wrap budget until the
  // canvas matches the DOM's line count so that can never happen.
  const targetLines = Math.max(1, Math.round(height / lineHeight))
  let lines = wrapLines(ctx, text, width)
  for (let budget = width; lines.length > targetLines && budget < width * 1.5; budget += 2) {
    lines = wrapLines(ctx, text, budget)
  }

  const cx = width / 2
  const blockTop = (height - lines.length * lineHeight) / 2 + lineHeight / 2
  lines.forEach((line, i) => ctx.fillText(line, cx, blockTop + i * lineHeight))

  return canvas
}

interface Unit {
  heading: HTMLElement
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  program: WebGLProgram | null
  buffer: WebGLBuffer | null
  texture: WebGLTexture | null
  u: Record<string, WebGLUniformLocation | null>
  amp: number // eased presence of the pointer over this line, 0..1
  mouse: { x: number; y: number } // smoothed pointer position (what the shader reads)
  target: { x: number; y: number } // latest pointer position the smoothed value chases
  over: boolean // is the pointer currently over this line
  started: boolean
}

export default function LiquidText({ children }: { children: ReactNode }): JSX.Element {
  const reduce = useReducedMotion()
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce) return
    const host = hostRef.current
    if (!host) return
    const headings = Array.from(host.querySelectorAll('h1, h2, h3')) as HTMLElement[]
    if (!headings.length) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    let time = 0
    let disposed = false
    let fontsReady = false

    // One WebGL canvas per heading. A heading without a usable context is simply left untouched.
    const units: Unit[] = []
    for (const heading of headings) {
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      canvas.style.position = 'absolute'
      canvas.style.left = '0'
      canvas.style.top = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.opacity = '0'
      canvas.style.pointerEvents = 'none'
      const gl = (canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true }) ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
      if (!gl) continue
      units.push({
        heading,
        canvas,
        gl,
        program: null,
        buffer: null,
        texture: null,
        u: {},
        amp: 0,
        mouse: { x: 0.5, y: 0.5 },
        target: { x: 0.5, y: 0.5 },
        over: false,
        started: false,
      })
    }
    if (!units.length) return

    const initGL = (unit: Unit): boolean => {
      const { gl } = unit
      const vs = createShader(gl, gl.VERTEX_SHADER, VERT)
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG)
      if (!vs || !fs) return false
      const prog = gl.createProgram()
      if (!prog) return false
      gl.attachShader(prog, vs)
      gl.attachShader(prog, fs)
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false
      unit.program = prog
      gl.useProgram(prog)

      // Full-screen quad. a_uv (0,0) = top-left so it lines up with the un-flipped text texture.
      // prettier-ignore
      const data = new Float32Array([
        -1, -1, 0, 1,
         1, -1, 1, 1,
        -1,  1, 0, 0,
         1,  1, 1, 0,
      ])
      unit.buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, unit.buffer)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      const posLoc = gl.getAttribLocation(prog, 'a_pos')
      const uvLoc = gl.getAttribLocation(prog, 'a_uv')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)
      gl.enableVertexAttribArray(uvLoc)
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8)

      for (const name of ['u_tex', 'u_time', 'u_amp', 'u_mouse', 'u_aspect']) {
        unit.u[name] = gl.getUniformLocation(prog, name)
      }

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)
      return true
    }

    const uploadTexture = (unit: Unit): boolean => {
      const { gl, canvas, heading } = unit
      const rect = heading.getBoundingClientRect()
      if (!rect.width || !rect.height) return false

      canvas.width = Math.ceil(rect.width * dpr)
      canvas.height = Math.ceil(rect.height * dpr)

      if (unit.texture) gl.deleteTexture(unit.texture)
      unit.texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, unit.texture)
      // Premultiply on upload so the texture matches the premultipliedAlpha context + (ONE,
      // 1-SRC_ALPHA) blend — otherwise antialiased glyph edges composite as bright halos.
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        paintHeading(heading, rect.width, rect.height, dpr),
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.viewport(0, 0, canvas.width, canvas.height)
      return true
    }

    const startUnit = (unit: Unit) => {
      if (unit.started || disposed || !fontsReady) return
      if (!unit.heading.getBoundingClientRect().width) return // not laid out yet; ResizeObserver retries
      if (!initGL(unit) || !uploadTexture(unit)) return
      unit.started = true
      if (getComputedStyle(unit.heading).position === 'static') unit.heading.style.position = 'relative'
      unit.heading.appendChild(unit.canvas)
      unit.heading.style.color = 'transparent'
      unit.canvas.style.opacity = '1'
    }

    // Track, per line, whether the pointer is over it and where — the render loop eases the presence
    // and smooths the position so the bump flows with the cursor and is local to it.
    const onPointerMove = (e: PointerEvent) => {
      for (const unit of units) {
        if (!unit.started) continue
        const rect = unit.heading.getBoundingClientRect()
        if (!rect.width || !rect.height) continue
        const nx = (e.clientX - rect.left) / rect.width
        const ny = (e.clientY - rect.top) / rect.height
        unit.over = nx > -0.1 && nx < 1.1 && ny > -0.4 && ny < 1.4
        if (unit.over) {
          unit.target.x = nx
          unit.target.y = ny
        }
      }
    }

    const render = () => {
      if (disposed) return
      time += 0.016
      for (const unit of units) {
        if (!unit.started || !unit.program) continue
        const { gl, canvas } = unit
        // Ease presence up while the pointer is over the line, down when it leaves; smooth the
        // position so the deformation flows to follow the cursor rather than snapping.
        unit.amp += ((unit.over ? 1 : 0) - unit.amp) * 0.12
        unit.mouse.x += (unit.target.x - unit.mouse.x) * 0.22
        unit.mouse.y += (unit.target.y - unit.mouse.y) * 0.22
        gl.useProgram(unit.program)
        gl.uniform1f(unit.u.u_time, time)
        gl.uniform1f(unit.u.u_amp, unit.amp)
        gl.uniform2f(unit.u.u_mouse, unit.mouse.x, unit.mouse.y)
        gl.uniform1f(unit.u.u_aspect, canvas.width / canvas.height)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      raf = requestAnimationFrame(render)
    }

    const fontsPromise = document.fonts?.ready ?? Promise.resolve()
    fontsPromise.then(() => {
      fontsReady = true
      units.forEach(startUnit)
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      raf = requestAnimationFrame(render)
    })

    const ro = new ResizeObserver((entries) => {
      if (disposed) return
      for (const entry of entries) {
        const unit = units.find((x) => x.heading === entry.target)
        if (!unit) continue
        if (!unit.started) startUnit(unit)
        else uploadTexture(unit)
      }
    })
    units.forEach((unit) => ro.observe(unit.heading))

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      for (const unit of units) {
        const { gl } = unit
        if (unit.texture) gl.deleteTexture(unit.texture)
        if (unit.buffer) gl.deleteBuffer(unit.buffer)
        if (unit.program) gl.deleteProgram(unit.program)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
        unit.heading.style.color = ''
        if (unit.canvas.parentElement) unit.canvas.parentElement.removeChild(unit.canvas)
      }
    }
  }, [reduce])

  return (
    <div ref={hostRef} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}
