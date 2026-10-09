/**
 * Host half of the skins bundle.
 *
 * It renders nothing: the whole skin engine lives in `./client`. This half
 * exists for two reasons.
 *
 * 1. The Loader row must resolve, so the client module system can read this
 *    package's `dsh.client` declaration off the same specifier.
 * 2. `Config` is the entire contract for a durable preference. The settings
 *    service builds the browser-visible namespace catalogue from the Loader
 *    entry's own `Config` export, and the client writes the chosen skin with
 *    `ctx.configForms.get('skins').set('skin', …)`, which persists as a
 *    top-level row in the profile's `cordis.patch.yml`.
 *
 * Every field is `.volatile()`: the settings form drops a field that is not
 * volatile, so without it the entry would expose an empty form and each write
 * would be refused.
 *
 * The manifest declares the schema dependency; the bundle installer resolves
 * it within the installed package on each computer.
 *
 * @see @deepseek-ai/dsh-settings — `schema(entry)` reads `entry.fiber.runtime.Config`
 * @see @deepseek-ai/dsh-client-ui-theme — the same `Config` + `configForms` pattern
 */
import z from '@deepseek-ai/schemastery'

/** Durable skin preference; the namespace is this entry's Loader id (`skins`). */
export const Config = z.object({
  /** Optical shoulder width and displacement; independent of rim exposure. */
  thickness: z.string().default('standard').volatile(),
  /** Edge highlight thickness: off, thin (existing appearance), standard, thick. */
  rim: z.string().default('thin').volatile(),
  /** Independent background speeds; explicit existing selections are retained. */
  flowSpeed: z.string().default('faster').volatile(),
  orbSpeed: z.string().default('standard').volatile(),
  /** Background-only palette separation; preserves theme and UI tokens. */
  colorSeparation: z.string().default('bold').volatile(),
  /** Selected skin id; nine themes; retired ocean is normalized to aero by the client. */
  skin: z.string().default('aero').volatile(),
  /** Transparency preset: `pure`, `bare`, `crystal`, `clear`, `standard` or `deep`. */
  intensity: z.string().default('bare').volatile(),
  /** Working-state motion: `off`, `soft` or `strong`. */
  effect: z.string().default('strong').volatile(),
  /** Drifting background lights: `on` or `off`. */
  drift: z.string().default('on').volatile(),
  /** Pointer hover and press feedback: `on` or `off`. */
  pointer: z.string().default('on').volatile(),
  /** Material: `on` selects liquid refraction, `off` selects frosted blur.
   * Both preserve the same layout. Fresh installs use the creator's Aero liquid preset;
   * explicit existing preferences are retained.
   */
  glass: z.string().default('on').volatile(),
  /** Background light intensity: `soft`, `standard`, `vivid` or `radiant`. */
  vivid: z.string().default('standard').volatile(),
})

/** Mount the Host half; it owns no Host resource. */
export function apply() {}
