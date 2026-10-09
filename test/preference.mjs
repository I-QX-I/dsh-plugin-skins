/**
 * Regression checks for the preference store.
 *
 * Two failures are covered, both of which are visible to the user:
 *
 * 1. "缺失字段导致已保存动效被默认值覆盖" — the Host value lacked a field, and adopting it wholesale
 *    let the schema default overwrite the local choice.
 * 2. "旧快照回显导致已选项弹回" — a durable write takes a round trip, and
 *    the form notifies its subscribers with the PREVIOUS value before the new one
 *    lands. Adopting that stale echo reverts the optimistic update, so the
 *    control visibly bounces new → old → new.
 *
 * The settings section is a plain function component, so the harness can call it,
 * walk the element tree it returns and press the segmented buttons for real.
 * The chosen effect is observable without reaching into the plugin: `soft` emits
 * no halo keyframes, `strong` does.
 */
const pathToFileURL = (await import('node:url')).pathToFileURL

const created = []
const makeEl = (tag) => {
  const el = {
    tagName: tag,
    dataset: {},
    style: { setProperty () {}, cssText: '' },
    textContent: '',
    children: [],
    append (...nodes) { this.children.push(...nodes) },
    /* The bokeh layer is a container of per-blob elements, so the stub models the
     * two things that builds: attributes and child replacement. */
    replaceChildren (...nodes) { this.children = nodes },
    attrs: {},
    setAttribute (name, value) { this.attrs[name] = String(value) },
    remove () {},
  }
  created.push(el)
  return el
}

globalThis.window = {
  __ModuleLoader__: { load (definition) { globalThis.__captured = definition } },
  matchMedia: () => ({ matches: false, addEventListener () {}, removeEventListener () {} }),
}
globalThis.document = {
  head: { append () {} },
  body: {
    hasAttribute: () => true,
    style: { setProperty () {} },
    append () {},
    addEventListener () {},
    attrs: new Set(),
    toggleAttribute (name, force) { if (force) this.attrs.add(name); else this.attrs.delete(name) },
  },
  createElement: makeEl,
  addEventListener () {},
  querySelector: () => null,
  documentElement: { dataset: {}, style: { setProperty () {} } },
  visibilityState: 'visible',
}
globalThis.MutationObserver = class { observe () {} disconnect () {} }
globalThis.requestAnimationFrame = (fn) => { setTimeout(fn, 0); return 1 }
globalThis.cancelAnimationFrame = () => {}

await import(new URL('../client.js', import.meta.url).href)
const plugin = globalThis.__captured.factory((id) => {
  if (id !== 'react') throw new Error('unexpected require: ' + id)
  return {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
  }
})

let failures = 0
const check = (label, ok, detail) => {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok || detail === undefined ? '' : '\n      ' + detail}`)
}

/** Collect every element in a rendered tree that satisfies `test`. */
function collect (node, test, out = []) {
  if (node === null || node === undefined || typeof node !== 'object') return out
  if (Array.isArray(node)) { for (const child of node) collect(child, test, out); return out }
  if (test(node)) out.push(node)
  for (const child of node.children ?? []) collect(child, test, out)
  return out
}

/**
 * Boot the plugin against a Host whose accepted value is under test.
 * @param seed - value the first-paint cache holds.
 * @param hostValue - what `form.getSnapshot().value` reports.
 * @returns handles for pressing controls, reading the live choice and echoing.
 */
async function boot (seed, hostValue, options = {}) {
  globalThis.localStorage = { getItem: () => JSON.stringify(seed), setItem () {} }
  let current = hostValue
  const subscribers = new Set()
  const writes = []
  let activeWrites = 0
  let maxWrites = 0
  const form = {
    getSnapshot: () => ({ value: current, status: 'ready' }),
    subscribe: (cb) => { subscribers.add(cb); return () => subscribers.delete(cb) },
    set: async (key, value) => {
      writes.push([key, value]); activeWrites++; maxWrites=Math.max(maxWrites,activeWrites)
      try {
        if (options.acknowledge) for (const cb of subscribers) cb()
        if (options.delay) await new Promise(resolve=>setTimeout(resolve,options.delay))
        if (options.acknowledge) {
          current={...current,[key]:value}
          for (const cb of subscribers) cb()
        }
        return true
      } finally {activeWrites--}
    },
  }
  const injectors = []
  let registered
  plugin.apply({
    effect: (fn) => fn(),
    on: () => {},
    locale: { register: () => () => {}, bind: () => (k) => k, getSnapshot: () => ({ active: 'zh', revision: 0 }), subscribe: () => () => {} },
    inject: (_deps, cb) => { injectors.push(cb) },
    /* The plugin registers its section from inside a slots.inject callback, so a
     * no-op stub here would silently leave the page unrendered — and the test
     * would then "pass" while exercising nothing. */
    slots: {
      inject: (_owner, cb) => { cb(); return () => {} },
      register: (config, component) => { registered = { config, component }; return () => {} },
    },
  })
  for (const cb of injectors) cb({ configForms: { get: () => form } })
  if (registered === undefined) throw new Error('the settings section was not registered')

  const props = () => ({ ...registered.config.inject(), t: (key) => key })
  return {
    choice: () => props().skinStore.getSnapshot(),
    writes,
    maxWrites: () => maxWrites,
    lights: () => created.filter(el=>el.attrs?.['data-sk-bokeh']!==undefined).at(-1)?.children ?? [],
    css: () => created.filter((el) => el.dataset.pluginCss === 'dsh-plugin-skins/skin.css').pop()?.textContent ?? '',
    /** Press the segmented button for one effect preset. */
    pressEffect (id) {
      const tree = registered.component(props())
      const label = `effect_${id}`
      const button = collect(tree, (n) => n.props?.className === 'sk-segBtn' && (n.children ?? []).includes(label))[0]
      if (button === undefined) throw new Error('no segmented button labelled ' + label)
      button.props.onClick()
    },
    pressAdjustment (key, id) {
      const tree = registered.component(props())
      const group = collect(tree, n => n.props?.['data-sk-adjustment'] === key)[0]
      const button = collect(group, n => n.props?.['data-sk-value'] === id)[0]
      if (!button || button.props.disabled) throw Error('Missing/disabled adjustment '+key)
      button.props.onClick()
    },
    pressVivid (id) {
      const tree=registered.component(props())
      const button=collect(tree,n=>n.props?.className==='sk-segBtn'&&(n.children??[]).includes('vivid_'+id))[0]
      if (!button) throw new Error('no vivid button '+id)
      button.props.onClick()
    },
    pressIntensity (id) {
      const tree=registered.component(props())
      const button=collect(tree,n=>n.props?.className==='sk-segBtn'&&(n.children??[]).includes(id))[0]
      if (!button) throw new Error('no transparency button '+id)
      button.props.onClick()
    },
    toggle (id) {
      const tree=registered.component(props())
      const button=id==='glass' ? collect(tree,n=>n.type==='button'&&n.children?.includes('glass_frosted'))[0] : collect(tree,n=>n.props?.['aria-label']==='module_'+id)[0]
      if (!button) throw new Error('no module switch '+id)
      button.props.onClick()
    },
    /** Push a Host value and let the form notify its subscribers. */
    echo (value) { current = value; for (const cb of subscribers) cb() },
  }
}

/* ---- 1. a Host value that omits a field must not reset it ---- */

const lagging = await boot({ skin: 'aurora', intensity: 'clear', effect: 'soft' }, { skin: 'aurora', intensity: 'clear' })
lagging.echo({ skin: 'aurora', intensity: 'clear' })
check('a Host value without `effect` keeps the local choice', lagging.css().includes('sk-bead-halo') === false)

const strong = await boot({ skin: 'aurora', intensity: 'clear', effect: 'strong' }, { skin: 'aurora', intensity: 'clear' })
strong.echo({ skin: 'aurora', intensity: 'clear' })
check('control: a local `strong` still emits the halo', strong.css().includes('sk-bead-halo') === true)

const off = await boot({ skin: 'aurora', intensity: 'clear', effect: 'off' }, { skin: 'aurora', intensity: 'clear' })
off.echo({ skin: 'aurora', intensity: 'clear' })
/* Keyed on the working-state ANIMATION, not on the attribute string. The attribute
 * now also appears in static rules — the halo element only exists while a run is
 * active — so probing for the string reported a failure that was not one. */
check('control: a local `off` emits no working-state rules', off.css().includes('sk-bead-') === false)

/* ---- 2. a stale echo must not revert an optimistic update ---- */

const live = await boot({ skin: 'aurora', intensity: 'clear', effect: 'soft' }, { skin: 'aurora', intensity: 'clear', effect: 'soft' })
live.pressEffect('strong')
check('the press is applied immediately', live.choice().effect === 'strong', 'choice = ' + live.choice().effect)

live.echo({ skin: 'aurora', intensity: 'clear', effect: 'soft' })
check('a stale echo does not revert it', live.choice().effect === 'strong', 'choice = ' + live.choice().effect)

live.echo({ skin: 'aurora', intensity: 'clear', effect: 'strong' })
check('the confirmed echo is accepted', live.choice().effect === 'strong', 'choice = ' + live.choice().effect)

await new Promise((resolve) => setTimeout(resolve, 2600))
live.echo({ skin: 'aurora', intensity: 'clear', effect: 'off' })
check('once the write window closes, another window is heard again', live.choice().effect === 'off', 'choice = ' + live.choice().effect)

/* Every field must participate in acknowledgement, including added switches. */
const full={skin:'aero',intensity:'clear',effect:'soft',vivid:'standard',drift:'on',pointer:'on',glass:'on'}
const vivid=await boot(full,full)
vivid.pressVivid('vivid');vivid.echo(full)
check('vivid stale echo cannot acknowledge the first three unchanged fields',vivid.choice().vivid==='vivid')
vivid.echo({...full,vivid:'vivid'})
check('vivid confirmation is accepted without resetting the lights',vivid.choice().vivid==='vivid')
const extended=await boot(full,full)
extended.pressVivid('radiant');extended.pressIntensity('crystal');extended.echo(full)
check('New Radiant and Crystal choices survive a stale host echo',extended.choice().vivid==='radiant'&&extended.choice().intensity==='crystal')
extended.echo({...full,vivid:'radiant',intensity:'crystal'})
check('Confirmed new choices persist without resetting any other field',Object.keys(full).every(k=>extended.choice()[k]===({...full,vivid:'radiant',intensity:'crystal'})[k]))
const ultra=await boot(full,full)
ultra.pressIntensity('bare');ultra.echo(full)
check('Ultra survives a stale host echo without changing the other preferences',ultra.choice().intensity==='bare'&&Object.keys(full).filter(k=>k!=='intensity').every(k=>ultra.choice()[k]===full[k]))
ultra.echo({...full,intensity:'bare'})
check('Ultra confirmation persists the additive fifth preset',ultra.choice().intensity==='bare')
const pure=await boot(full,full)
pure.pressIntensity('pure');pure.echo(full)
check('Pure survives stale host echo and preserves other preferences',pure.choice().intensity==='pure'&&Object.keys(full).filter(k=>k!=='intensity').every(k=>pure.choice()[k]===full[k]))
pure.echo({...full,intensity:'pure'})
check('Pure is persisted as an additive sixth preset',pure.choice().intensity==='pure')
check('Pure emits zero blur and no readability floor',pure.css().includes('--sk-control-blur: 0px')&&pure.css().includes('--sk-readability-floor: 0'))
for (const field of ['drift','pointer','glass']) {
  const instance=await boot(full,full)
  instance.toggle(field);instance.echo(full)
  check(field+' stale echo cannot revert the switch',instance.choice()[field]==='off')
}
await new Promise(resolve=>setTimeout(resolve,400))
check('one vivid click writes only that field',JSON.stringify(vivid.writes)===JSON.stringify([['vivid','vivid']]),JSON.stringify(vivid.writes))

const queued=await boot(full,full,{acknowledge:true,delay:600})
queued.pressVivid('vivid')
await new Promise(resolve=>setTimeout(resolve,400))
queued.pressEffect('strong')
await new Promise(resolve=>setTimeout(resolve,400))
queued.pressVivid('soft')
await new Promise(resolve=>setTimeout(resolve,1600))
check('rapid changes never run two profile writes concurrently',queued.maxWrites()===1)
check('rapid changes persist the last choice without clobbering another field',queued.choice().vivid==='soft'&&queued.choice().effect==='strong',JSON.stringify(queued.choice()))
check('rapid changes do not rewrite unchanged preferences',queued.writes.length===3&&queued.writes.every(([key])=>key==='vivid'||key==='effect'),JSON.stringify(queued.writes))

const slow=await boot(full,full,{acknowledge:true,delay:3100})
slow.pressVivid('vivid')
await new Promise(resolve=>setTimeout(resolve,2700))
slow.echo(full)
check('a slow in-flight save does not expire the stale-echo guard',slow.choice().vivid==='vivid')
await new Promise(resolve=>setTimeout(resolve,900))
check('a slow save eventually accepts the intended value',slow.choice().vivid==='vivid'&&slow.maxWrites()===1)

const profiles=[]
for (const level of ['soft','standard','vivid','radiant']) {
  const seed={...full,vivid:level}
  const instance=await boot(seed,seed)
  const lightness=parseFloat(/--sk-tint-lift:\s*\S+\s+\S+\s+(\S+)/.exec(instance.css())[1])
  const alphas=instance.lights().map(e=>Number(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/.exec(e.style.cssText)[1]))
  profiles.push({level,lightness,mean:alphas.reduce((a,b)=>a+b,0)/alphas.length})
}
check('all four profiles have progressively brighter glass surfaces',profiles.every((p,i)=>i===0||p.lightness>profiles[i-1].lightness),JSON.stringify(profiles))
check('all four profiles increase actual light gradients',profiles.every((p,i)=>i===0||p.mean>profiles[i-1].mean),JSON.stringify(profiles))

/* ---- 3. the module switches are attributes, not a repaint ------------------ */

const modules = await boot({ skin: 'aurora', intensity: 'clear', effect: 'strong', drift: 'off', pointer: 'off' }, { skin: 'aurora', intensity: 'clear' })
const attrs = globalThis.document.body.attrs
check('drift off removes the drift attribute', attrs.has('data-sk-drift') === false)
check('pointer off removes the pointer attribute', attrs.has('data-sk-pointer') === false)
const on = await boot({ skin: 'aurora', intensity: 'clear', effect: 'strong', drift: 'on', pointer: 'on' }, { skin: 'aurora', intensity: 'clear' })
check('drift on sets the drift attribute', globalThis.document.body.attrs.has('data-sk-drift') === true)
check('pointer on sets the pointer attribute', globalThis.document.body.attrs.has('data-sk-pointer') === true)
/* The Host value has to agree with the seed here: adopt() merges the Host over the
 * local choice, so passing a different skin would make the effective choice "on"
 * and the attributes would legitimately be set. */
await boot({ skin: 'off', intensity: 'clear', effect: 'strong', drift: 'on', pointer: 'on' }, { skin: 'off' })
check('a skin that is off sets no module attributes at all', globalThis.document.body.attrs.size === 0, 'attrs = ' + [...globalThis.document.body.attrs].join(', '))

/* ---- 4. the lights really are independent --------------------------------- */

await boot({ skin: 'aurora', intensity: 'clear', effect: 'strong', drift: 'on', pointer: 'on' }, { skin: 'aurora' })
const host = created.find((el) => el.attrs?.['data-sk-bokeh'] !== undefined)
check('a bokeh container is mounted', host !== undefined)
if (host !== undefined) {
  const nodes = host.children ?? []
  check('five composition lights have independent elements', nodes.length === 5, nodes.length + ' element(s)')
  const animations = nodes.map((n) => /animation:([^;]+)/.exec(n.style.cssText ?? '')?.[1] ?? '')
  const parts = animations.map((a) => a.split(/\s+/))
  /* The point of the whole pass: previously every circle shared one layer and so
   * one trajectory. Distinctness is the property under test, not the numbers. */
  check('all complete light paths are independent', new Set(nodes.map(n => /--sk-drift-64:([^;]+)/.exec(n.style.cssText)?.[1])).size === nodes.length,
    `${new Set(animations).size} distinct of ${animations.length}`)
  check('each light has its own planned curve', new Set(nodes.map(n => /--sk-drift-64:([^;]+)/.exec(n.style.cssText)?.[1])).size === nodes.length, 'random curves must be independent')
  check('movement shares the avoidance plan clock', new Set(parts.map((p) => p[1])).size === 1, 'plan clocks diverge')
  check('paths remain unique despite the shared plan clock', new Set(nodes.map(n => /--sk-drift-16:([^;]+)/.exec(n.style.cssText)?.[1])).size === nodes.length)
  /* Smooth random curves take longer than the old three-waypoint paths. */
  const seconds = parts.map((p) => parseFloat(p[1]))
  const outOfBand = seconds.filter((s) => s < 100 || s > 240)
  check('every period is inside the ambient band', outOfBand.length === 0, 'out of band: ' + outOfBand.join(', '))
  check('paths span viewport coordinates, not a small pixel cage', nodes.every(n => /--sk-drift-0:translate3d\([^;]+vw,[^;]+vh,0\)/.test(n.style.cssText)), 'missing viewport-relative path')
}

const migrated = await boot(full, full, {acknowledge:true, delay:30})
check('Old seven-field preference adopts all five new defaults', migrated.choice().rim==='thin' && migrated.choice().thickness==='standard' && migrated.choice().flowSpeed==='faster' && migrated.choice().orbSpeed==='standard' && migrated.choice().colorSeparation==='bold')
const additions={flowSpeed:'fast',orbSpeed:'slow',colorSeparation:'soft',rim:'off',thickness:'thick'}
for(const [key,id] of Object.entries(additions)) migrated.pressAdjustment(key,id)
migrated.echo(full)
check('All five new choices survive an old-schema stale echo',Object.entries(additions).every(([key,id])=>migrated.choice()[key]===id))
await new Promise(resolve=>setTimeout(resolve,700))
check('Only five changed fields persist serially',migrated.writes.length===5 && migrated.maxWrites()===1 && migrated.writes.every(([key,id])=>additions[key]===id))
const restored=await boot(migrated.choice(),{...full,...additions})
check('New choices survive fresh plugin mount',Object.entries(additions).every(([key,id])=>restored.choice()[key]===id))

const legacyOcean = {...full,...additions,skin:'ocean'}
const mergedOcean = await boot(legacyOcean,legacyOcean)
check('Retired Ocean maps to Aero without changing any other preference', mergedOcean.choice().skin==='aero' && Object.keys(legacyOcean).filter(k=>k!=='skin').every(k=>mergedOcean.choice()[k]===legacyOcean[k]))
const teal = await boot({...legacyOcean,skin:'teal'},{...legacyOcean,skin:'teal'})
check('New Teal survives both preference sources', teal.choice().skin==='teal')
teal.echo(legacyOcean)
check('An external legacy Ocean selection also normalizes to Aero',teal.choice().skin==='aero')
const flameSeed={...legacyOcean,skin:'flame'}
const flame=await boot(flameSeed,flameSeed)
check('Flame restores from both stores without changing other preferences',Object.keys(flameSeed).every(k=>flame.choice()[k]===flameSeed[k]))

console.log(failures === 0 ? '\nall steps passed' : `\n${failures} step(s) failed`)
process.exit(failures === 0 ? 0 : 1)
